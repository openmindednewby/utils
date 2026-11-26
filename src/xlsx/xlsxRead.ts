import { FileFormatError, isFileFormatError } from '../zip/fileFormatError';
import { readZipEntries } from '../zip/zipRead';
import { xmlElements } from './xmlElements';

export type CellValue = string | number | null;

const decoder = new TextDecoder();
const ENTITIES: Record<string, string | undefined> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const HEX = 16;
const ALPHABET = 26;
const COLUMN_BASE = 'A'.charCodeAt(0) - 1;
const MAX_COLUMN_INDEX = 16383;
const MAX_ROWS = 1048576;
const MAX_CELLS = 1000000;
const MAX_XML_BYTES = 50 * 1024 * 1024;
const WORKBOOK = 'xl/workbook.xml';
const WORKBOOK_RELS = 'xl/_rels/workbook.xml.rels';
const SHARED_STRINGS = 'xl/sharedStrings.xml';
const FIRST_SHEET = 'xl/worksheets/sheet1.xml';

function notXlsx(): FileFormatError {
  return new FileFormatError('an xlsx file');
}

function entity(code: string): string {
  if (code.startsWith('#x')) {
    return String.fromCodePoint(parseInt(code.slice(2), HEX));
  }
  if (code.startsWith('#')) {
    return String.fromCodePoint(Number(code.slice(1)));
  }
  return ENTITIES[code] ?? '';
}

function unescapeXml(value: string): string {
  return value.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_match, code: string) => entity(code));
}

function attr(attrs: string, name: string): string | null {
  return new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attrs)?.[1] ?? null;
}

function texts(xml: string): string {
  return [...xmlElements(xml, 't')].map((element) => unescapeXml(element.inner ?? '')).join('');
}

function sharedStrings(xml: string | undefined): string[] {
  return xml === undefined ? [] : [...xmlElements(xml, 'si')].map((element) => texts(element.inner ?? ''));
}

function columnIndex(ref: string | null, fallback: number): number {
  const letters = ref === null ? '' : (/^[A-Z]+/.exec(ref)?.[0] ?? '');
  const index = letters === '' ? fallback : [...letters].reduce((total, letter) => total * ALPHABET + letter.charCodeAt(0) - COLUMN_BASE, 0) - 1;
  if (index > MAX_COLUMN_INDEX) {
    throw notXlsx();
  }
  return index;
}

function cellValue(attrs: string, inner: string | undefined, shared: string[]): string | null {
  const type = attr(attrs, 't');
  const value = inner === undefined ? undefined : xmlElements(inner, 'v').next().value?.inner;
  if (type === 'inlineStr') {
    return texts(inner ?? '');
  }
  if (value === undefined || type === 'e') {
    return null;
  }
  return type === 's' ? (shared[Number(value)] ?? null) : unescapeXml(value);
}

function rowCells(xml: string, shared: string[]): CellValue[] {
  const row: CellValue[] = [];
  for (const element of xmlElements(xml, 'c')) {
    row[columnIndex(attr(element.attrs, 'r'), row.length)] = cellValue(element.attrs, element.inner, shared);
  }
  return Array.from(row, (value) => value ?? null);
}

function sheetRows(xml: string, shared: string[]): CellValue[][] {
  const rows: CellValue[][] = [];
  let cells = 0;
  for (const element of xmlElements(xml, 'row')) {
    const number = Number(attr(element.attrs, 'r'));
    const index = Number.isInteger(number) && number > 0 ? number - 1 : rows.length;
    if (index >= MAX_ROWS) {
      throw notXlsx();
    }
    const row = rowCells(element.inner ?? '', shared);
    cells += row.length;
    if (cells > MAX_CELLS) {
      throw notXlsx();
    }
    rows[index] = row;
  }
  return Array.from(rows, (row) => row ?? []);
}

function sheetPath(workbook: string | undefined, rels: string | undefined, sheetName: string | null): string {
  const sheets = [...(workbook ?? '').matchAll(/<sheet\b([^>]*)>/g)].map((match) => match[1] ?? '');
  const sheet = sheets.find((attrs) => attr(attrs, 'name') === sheetName) ?? sheets[0];
  const id = sheet === undefined ? null : attr(sheet, 'r:id');
  const target = [...(rels ?? '').matchAll(/<Relationship\b([^>]*)>/g)].map((match) => match[1] ?? '').find((attrs) => attr(attrs, 'Id') === id);
  const path = target === undefined ? null : attr(target, 'Target');
  if (path === null) {
    return FIRST_SHEET;
  }
  return path.startsWith('/') ? path.slice(1) : `xl/${path}`;
}

/** The cell values of one sheet (the named one, else the first) as rows of cells; strings, numbers or null. */
export async function readXlsxRows(bytes: Uint8Array, sheetName: string | null): Promise<CellValue[][]> {
  const entries = await readZipEntries(bytes).catch((error: unknown) => {
    throw isFileFormatError(error) ? notXlsx() : error;
  });
  const read = (name: string): string | undefined => {
    const data = entries.get(name);
    if (data !== undefined && data.byteLength > MAX_XML_BYTES) {
      throw notXlsx();
    }
    return data === undefined ? undefined : decoder.decode(data);
  };
  const sheet = read(sheetPath(read(WORKBOOK), read(WORKBOOK_RELS), sheetName));
  if (sheet === undefined) {
    throw notXlsx();
  }
  return sheetRows(sheet, sharedStrings(read(SHARED_STRINGS)));
}
