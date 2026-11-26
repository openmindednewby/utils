import { DATA_SHEET, xlsxFixture } from '../../__tests__/fixtures/xlsxFixture';
import { readXlsxRows } from './xlsxRead';

describe('readXlsxRows', () => {
  it('with a self-closing empty row, keeps the row after it', async () => {
    const bytes = xlsxFixture([['Date'], [], ['next']]);

    const rows = await readXlsxRows(bytes, DATA_SHEET);

    expect(rows).toEqual([['Date'], [], ['next']]);
  });

  it('with a named sheet, reads shared strings and numbers from it', async () => {
    const bytes = xlsxFixture([['Date', 'Amount'], ['2026-10-01', 12.5]]);

    const rows = await readXlsxRows(bytes, DATA_SHEET);

    expect(rows).toEqual([['Date', 'Amount'], ['2026-10-01', '12.5']]);
  });

  it('with no sheet name, reads the first sheet', async () => {
    const bytes = xlsxFixture();

    const rows = await readXlsxRows(bytes, null);

    expect(rows).toEqual([['1']]);
  });

  it('with bytes that are not a zip, refuses them as not an xlsx', async () => {
    const bytes = new Uint8Array(22);

    const read = readXlsxRows(bytes, null);

    await expect(read).rejects.toThrow('file: is not an xlsx file');
  });
});
