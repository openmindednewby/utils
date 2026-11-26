const FILE_FORMAT_ERROR = 'FileFormatError';

export class FileFormatError extends Error {
  public readonly format: string;

  public constructor(format: string) {
    super(`file: is not ${format}`);
    this.name = FILE_FORMAT_ERROR;
    this.format = format;
  }
}

/** True for a FileFormatError from any copy of this package, since each subpath bundles its own class. */
export function isFileFormatError(error: unknown): error is FileFormatError {
  return error instanceof Error && error.name === FILE_FORMAT_ERROR;
}
