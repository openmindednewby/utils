/**
 * The CSV serializer's escaping is the whole risk surface — a comma, a quote or a newline inside a
 * value is exactly what turns one row into two columns or two rows in a spreadsheet. So these tests
 * hammer `toCsv`'s field escaping (RFC 4180). Ported from finreg-web on extraction (ZY-25).
 */
import { toCsv, type CsvColumn } from './toCsv';

interface Row {
  name: string;
  amount: number;
  note?: string | null;
}

const columns: Array<CsvColumn<Row>> = [
  { header: 'Name', value: (row) => row.name },
  { header: 'Amount', value: (row) => row.amount },
  { header: 'Note', value: (row) => row.note },
];

/** Split into physical CSV records on CRLF — the row separator the serializer emits. */
function lines(csv: string): string[] {
  return csv.split('\r\n');
}

describe('toCsv', () => {
  it('writes a header row followed by one row per item', () => {
    const csv = toCsv([{ name: 'Acme', amount: 100 }], columns);

    expect(lines(csv)).toEqual(['Name,Amount,Note', 'Acme,100,']);
  });

  it('quotes a field containing a comma so it stays a single column', () => {
    const csv = toCsv([{ name: 'Acme, Inc', amount: 100 }], columns);

    // Without quoting, "Acme, Inc" would become two columns and shift every value right.
    expect(lines(csv)[1]).toBe('"Acme, Inc",100,');
  });

  it('doubles embedded quotes and wraps the field', () => {
    const csv = toCsv([{ name: 'The "Big" Co', amount: 50 }], columns);

    expect(lines(csv)[1]).toBe('"The ""Big"" Co",50,');
  });

  it('quotes a field containing a newline so it stays a single row', () => {
    const csv = toCsv([{ name: 'Line1\nLine2', amount: 1 }], columns);

    // The embedded \n must NOT create a new physical record — the quoted field keeps it as one row.
    expect(lines(csv)).toEqual(['Name,Amount,Note', '"Line1\nLine2",1,']);
  });

  it('quotes a field containing a carriage return', () => {
    const csv = toCsv([{ name: 'A\r\nB', amount: 1 }], columns);

    // Only the header CRLF and the one record CRLF should be structural; the field's \r\n is quoted.
    expect(csv).toBe('Name,Amount,Note\r\n"A\r\nB",1,');
  });

  it('renders null and undefined as empty cells, not the strings "null"/"undefined"', () => {
    const csv = toCsv(
      [
        { name: 'Has note', amount: 1, note: 'hi' },
        { name: 'Null note', amount: 2, note: null },
        { name: 'Missing note', amount: 3 },
      ],
      columns,
    );

    expect(lines(csv)).toEqual([
      'Name,Amount,Note',
      'Has note,1,hi',
      'Null note,2,',
      'Missing note,3,',
    ]);
  });

  it('stringifies numeric values, including zero', () => {
    const csv = toCsv([{ name: 'Zero', amount: 0 }], columns);

    // A common bug: `value || ''` would turn a legitimate 0 into an empty cell.
    expect(lines(csv)[1]).toBe('Zero,0,');
  });

  it('escapes header text too', () => {
    const csv = toCsv([], [{ header: 'Amount, EUR', value: (row: Row) => row.amount }]);

    expect(csv).toBe('"Amount, EUR"');
  });

  it('returns the header line alone for an empty row set', () => {
    const csv = toCsv([], columns);

    expect(csv).toBe('Name,Amount,Note');
  });
});
