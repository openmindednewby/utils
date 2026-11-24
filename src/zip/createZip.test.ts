import { crc32, createZip } from './createZip';

const LOCAL_SIG = 0x04034b50;
const END_SIG = 0x06054b50;
const END_SIZE = 22;
const LOCAL_SIZE = 30;

const bytesOf = (text: string): Uint8Array => new TextEncoder().encode(text);
const viewOf = (bytes: Uint8Array): DataView => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

describe('crc32', () => {
  it('with the standard check input, returns 0xcbf43926', () => {
    const input = bytesOf('123456789');

    const sum = crc32(input);

    expect(sum).toBe(0xcbf43926);
  });

  it('with no bytes, returns 0', () => {
    const input = new Uint8Array(0);

    const sum = crc32(input);

    expect(sum).toBe(0);
  });
});

describe('createZip', () => {
  it('with one entry, starts with a local header holding the name and the stored bytes', () => {
    const entry = { path: 'a.txt', bytes: bytesOf('hello') };

    const zip = createZip([entry]);

    const view = viewOf(zip);
    expect(view.getUint32(0, true)).toBe(LOCAL_SIG);
    expect(view.getUint32(14, true)).toBe(crc32(entry.bytes));
    expect(new TextDecoder().decode(zip.slice(LOCAL_SIZE, LOCAL_SIZE + 5))).toBe('a.txt');
    expect(new TextDecoder().decode(zip.slice(LOCAL_SIZE + 5, LOCAL_SIZE + 10))).toBe('hello');
  });

  it('with two entries, ends with a record counting both entries', () => {
    const entries = [
      { path: 'one.pdf', bytes: bytesOf('1') },
      { path: 'dir/two.json', bytes: bytesOf('22') },
    ];

    const zip = createZip(entries);

    const end = viewOf(zip.slice(zip.length - END_SIZE));
    expect(end.getUint32(0, true)).toBe(END_SIG);
    expect(end.getUint16(8, true)).toBe(2);
    expect(end.getUint16(10, true)).toBe(2);
  });

  it('with no entries, returns only the end record', () => {
    const entries: Array<{ path: string; bytes: Uint8Array }> = [];

    const zip = createZip(entries);

    expect(zip.length).toBe(END_SIZE);
  });
});
