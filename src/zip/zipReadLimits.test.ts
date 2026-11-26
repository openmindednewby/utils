import { deflatedZip } from '../../__tests__/fixtures/xlsxFixture';
import { createZip } from './createZip';
import { readZipEntries } from './zipRead';

const NOT_ZIP = 'file: is not a zip file';
const END_SIZE = 22;
const CENTRAL_SIZE = 46;
const UNCOMPRESSED_AT = 24;
const bytesOf = (text: string): Uint8Array => new TextEncoder().encode(text);

function declareUncompressedSize(bytes: Uint8Array, size: number): Uint8Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.byteLength - END_SIZE;
  let offset = view.getUint32(end + 16, true);
  for (let index = 0; index < view.getUint16(end + 10, true); index += 1) {
    view.setUint32(offset + UNCOMPRESSED_AT, size, true);
    offset += CENTRAL_SIZE + view.getUint16(offset + 28, true) + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
  }
  return bytes;
}

describe('readZipEntries options', () => {
  it('with a names filter, returns only the matching files', async () => {
    const bytes = createZip([{ path: 'a.txt', bytes: bytesOf('a') }, { path: 'b.txt', bytes: bytesOf('b') }]);

    const entries = await readZipEntries(bytes, { names: (name) => name === 'a.txt' });

    expect([...entries.keys()]).toEqual(['a.txt']);
  });

  it('with a names filter, never inflates a corrupt file it skips', async () => {
    const bytes = deflatedZip([{ name: 'skip.bin', text: 'unrelated media payload '.repeat(40) }, { name: 'keep.txt', text: 'kept' }]);
    bytes.fill(0xff, 40, 46);

    const entries = await readZipEntries(bytes, { names: (name) => name === 'keep.txt' });

    expect(new TextDecoder().decode(entries.get('keep.txt'))).toBe('kept');
  });

  it('with a declared size over maxEntryBytes, refuses it as not a zip', async () => {
    const bytes = deflatedZip([{ name: 'big.txt', text: 'x'.repeat(2000) }]);

    const read = readZipEntries(bytes, { maxEntryBytes: 1000 });

    await expect(read).rejects.toThrow(NOT_ZIP);
  });

  it('with a stored file over maxEntryBytes, refuses it as not a zip', async () => {
    const bytes = createZip([{ path: 'big.txt', bytes: bytesOf('x'.repeat(2000)) }]);

    const read = readZipEntries(bytes, { maxEntryBytes: 1000 });

    await expect(read).rejects.toThrow(NOT_ZIP);
  });

  it('with a small declared size that inflates past maxEntryBytes, stops and refuses it as not a zip', async () => {
    const bytes = declareUncompressedSize(deflatedZip([{ name: 'bomb.txt', text: ' '.repeat(1024 * 1024) }]), 1);

    const read = readZipEntries(bytes, { maxEntryBytes: 1000 });

    await expect(read).rejects.toThrow(NOT_ZIP);
  });

  it('with files that together pass maxTotalBytes, refuses them as not a zip', async () => {
    const bytes = createZip([{ path: 'a.txt', bytes: bytesOf('x'.repeat(600)) }, { path: 'b.txt', bytes: bytesOf('y'.repeat(600)) }]);

    const read = readZipEntries(bytes, { maxTotalBytes: 1000 });

    await expect(read).rejects.toThrow(NOT_ZIP);
  });

  it('with a lying declared size, counts the inflated bytes toward maxTotalBytes', async () => {
    const files = [{ name: 'a.txt', text: ' '.repeat(600) }, { name: 'b.txt', text: ' '.repeat(600) }];
    const bytes = declareUncompressedSize(deflatedZip(files), 1);

    const read = readZipEntries(bytes, { maxTotalBytes: 1000 });

    await expect(read).rejects.toThrow(NOT_ZIP);
  });
});
