import { DATA_SHEET, xlsxFromSheet } from '../../__tests__/fixtures/xlsxFixture';
import { readXlsxRows } from './xlsxRead';

const NOT_XLSX = 'file: is not an xlsx file';
const sheetOf = (rows: string): string => `<worksheet><sheetData>${rows}</sheetData></worksheet>`;

describe('readXlsxRows limits', () => {
  it('with a cell in the last column XFD, reads it', async () => {
    const bytes = xlsxFromSheet(sheetOf('<row r="1"><c r="XFD1"><v>7</v></c></row>'));

    const rows = await readXlsxRows(bytes, DATA_SHEET);

    expect(rows[0]?.[16383]).toBe('7');
  });

  it('with a cell past column XFD, refuses it as not an xlsx', async () => {
    const bytes = xlsxFromSheet(sheetOf('<row r="1"><c r="ZZZZZZ1"><v>7</v></c></row>'));

    const read = readXlsxRows(bytes, DATA_SHEET);

    await expect(read).rejects.toThrow(NOT_XLSX);
  });

  it('with a row number past 1048576, refuses it as not an xlsx', async () => {
    const bytes = xlsxFromSheet(sheetOf('<row r="1048577"><c r="A1048577"><v>7</v></c></row>'));

    const read = readXlsxRows(bytes, DATA_SHEET);

    await expect(read).rejects.toThrow(NOT_XLSX);
  });

  it('with more than 1,000,000 cells across its rows, refuses it as not an xlsx', async () => {
    const row = (r: number): string => `<row r="${r}"><c r="XFD${r}"><v>1</v></c></row>`;
    const bytes = xlsxFromSheet(sheetOf(Array.from({ length: 62 }, (_unused, index) => row(index + 1)).join('')));

    const read = readXlsxRows(bytes, DATA_SHEET);

    await expect(read).rejects.toThrow(NOT_XLSX);
  });

  it('with a sheet over 50 MB, refuses it as not an xlsx', async () => {
    const bytes = xlsxFromSheet(sheetOf(' '.repeat(50 * 1024 * 1024 + 1)));

    const read = readXlsxRows(bytes, DATA_SHEET);

    await expect(read).rejects.toThrow(NOT_XLSX);
  });

  it('with 50,000 unclosed cells in a row, returns within a second', async () => {
    const bytes = xlsxFromSheet(sheetOf(`<row r="1">${'<c r="A1">'.repeat(50000)}</row>`));
    const started = Date.now();

    await readXlsxRows(bytes, DATA_SHEET);

    expect(Date.now() - started).toBeLessThan(1000);
  });
});
