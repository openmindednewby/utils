import { xlsxFixture } from '../../__tests__/fixtures/xlsxFixture';
import { createZip } from './createZip';
import { isFileFormatError } from './fileFormatError';
import { readZipEntries } from './zipRead';

const END_SIGNATURE = 0x06054b50;
const END_SIZE = 22;
const ENTRY_COUNT_AT = 10;
const CENTRAL_OFFSET_AT = 16;
const originalDecompression = globalThis.DecompressionStream;

function endRecordPointingAt(offset: number): Uint8Array {
  const bytes = new Uint8Array(END_SIZE);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, END_SIGNATURE, true);
  view.setUint16(ENTRY_COUNT_AT, 1, true);
  view.setUint32(CENTRAL_OFFSET_AT, offset, true);
  return bytes;
}

describe('readZipEntries', () => {
  afterEach(() => {
    Reflect.set(globalThis, 'DecompressionStream', originalDecompression);
  });

  it('with an uncompressed archive from createZip, returns each file by name', async () => {
    const bytes = createZip([{ path: 'a.txt', bytes: new TextEncoder().encode('hello') }]);

    const entries = await readZipEntries(bytes);

    expect(new TextDecoder().decode(entries.get('a.txt'))).toBe('hello');
  });

  it('with a deflated archive, returns the inflated files', async () => {
    const bytes = xlsxFixture();

    const entries = await readZipEntries(bytes);

    expect(new TextDecoder().decode(entries.get('xl/worksheets/sheet1.xml'))).toContain('<v>1</v>');
  });

  it('with bytes that hold no end record, refuses them as not a zip', async () => {
    const bytes = new Uint8Array(END_SIZE);

    const read = readZipEntries(bytes);

    await expect(read).rejects.toThrow('file: is not a zip file');
  });

  it('with a central directory offset past the end of the file, refuses it as not a zip', async () => {
    const bytes = endRecordPointingAt(1000);

    const read = readZipEntries(bytes);

    await expect(read).rejects.toThrow('file: is not a zip file');
  });

  it('with corrupt compressed data, refuses it with a FileFormatError', async () => {
    const bytes = xlsxFixture();
    bytes.fill(0xff, 45, 50);

    const error: unknown = await readZipEntries(bytes).catch((caught: unknown) => caught);

    expect(isFileFormatError(error)).toBe(true);
  });

  it('with no deflate support in the runtime, passes the runtime error through', async () => {
    Reflect.set(globalThis, 'DecompressionStream', undefined);

    const read = readZipEntries(xlsxFixture());

    await expect(read).rejects.toThrow(TypeError);
  });
});
