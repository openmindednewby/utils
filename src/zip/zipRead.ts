import { FileFormatError } from './fileFormatError';

const END_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const END_SIZE = 22;
const MAX_COMMENT = 65535;
const CENTRAL_SIZE = 46;
const LOCAL_SIZE = 30;
const STORED = 0;
const DEFLATED = 8;
const DEFAULT_MAX_ENTRY_BYTES = 64 * 1024 * 1024;
const DEFAULT_MAX_TOTAL_BYTES = 256 * 1024 * 1024;
const decoder = new TextDecoder();

export interface ZipReadOptions {
  names?: (name: string) => boolean;
  maxEntryBytes?: number;
  maxTotalBytes?: number;
}

interface CentralEntry {
  name: string;
  method: number;
  size: number;
  declared: number;
  local: number;
  next: number;
}

interface Limits {
  names: (name: string) => boolean;
  maxEntryBytes: number;
  maxTotalBytes: number;
}

function notZip(): FileFormatError {
  return new FileFormatError('a zip file');
}

function endOffset(view: DataView): number {
  const last = view.byteLength - END_SIZE;
  for (let offset = last; offset >= Math.max(0, last - MAX_COMMENT); offset -= 1) {
    if (view.getUint32(offset, true) === END_SIGNATURE) {
      return offset;
    }
  }
  throw notZip();
}

function centralEntry(view: DataView, bytes: Uint8Array, offset: number): CentralEntry {
  if (view.getUint32(offset, true) !== CENTRAL_SIGNATURE) {
    throw notZip();
  }
  const nameLength = view.getUint16(offset + 28, true);
  const nameStart = offset + CENTRAL_SIZE;
  return {
    name: decoder.decode(bytes.subarray(nameStart, nameStart + nameLength)),
    method: view.getUint16(offset + 10, true),
    size: view.getUint32(offset + 20, true),
    declared: view.getUint32(offset + 24, true),
    local: view.getUint32(offset + 42, true),
    next: nameStart + nameLength + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true),
  };
}

function joined(chunks: Uint8Array[], length: number): Uint8Array {
  const result = new Uint8Array(length);
  let at = 0;
  for (const chunk of chunks) {
    result.set(chunk, at);
    at += chunk.byteLength;
  }
  return result;
}

async function readCapped(reader: ReadableStreamDefaultReader<Uint8Array>, cap: number): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read().catch(() => {
      throw notZip();
    });
    if (done) {
      return joined(chunks, length);
    }
    length += value.byteLength;
    if (length > cap) {
      await reader.cancel().catch(() => undefined);
      throw notZip();
    }
    chunks.push(value);
  }
}

function inflate(data: Uint8Array, cap: number): Promise<Uint8Array> {
  const stream = new Blob([data.slice()]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return readCapped(stream.getReader() as ReadableStreamDefaultReader<Uint8Array>, cap);
}

async function entryData(view: DataView, bytes: Uint8Array, entry: CentralEntry, cap: number): Promise<Uint8Array> {
  const start = entry.local + LOCAL_SIZE + view.getUint16(entry.local + 26, true) + view.getUint16(entry.local + 28, true);
  const raw = bytes.subarray(start, start + entry.size);
  if (entry.method === STORED) {
    if (raw.byteLength > cap) {
      throw notZip();
    }
    return raw.slice();
  }
  if (entry.method === DEFLATED) {
    return inflate(raw, cap);
  }
  throw notZip();
}

async function readEntries(bytes: Uint8Array, limits: Limits): Promise<Map<string, Uint8Array>> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = endOffset(view);
  const entries = new Map<string, Uint8Array>();
  let total = 0;
  let offset = view.getUint32(end + 16, true);
  for (let index = 0; index < view.getUint16(end + 10, true); index += 1) {
    const entry = centralEntry(view, bytes, offset);
    offset = entry.next;
    if (!limits.names(entry.name)) {
      continue;
    }
    const cap = Math.min(limits.maxEntryBytes, limits.maxTotalBytes - total);
    if (entry.declared > cap) {
      throw notZip();
    }
    const data = await entryData(view, bytes, entry, cap);
    total += data.byteLength;
    entries.set(entry.name, data);
  }
  return entries;
}

/** The files of a zip archive by name; throws FileFormatError when the bytes are not a readable zip, and passes runtime errors through. */
export async function readZipEntries(bytes: Uint8Array, options: ZipReadOptions = {}): Promise<Map<string, Uint8Array>> {
  const limits: Limits = {
    names: options.names ?? ((): boolean => true),
    maxEntryBytes: options.maxEntryBytes ?? DEFAULT_MAX_ENTRY_BYTES,
    maxTotalBytes: options.maxTotalBytes ?? DEFAULT_MAX_TOTAL_BYTES,
  };
  try {
    return await readEntries(bytes, limits);
  } catch (error) {
    throw error instanceof RangeError ? notZip() : error;
  }
}
