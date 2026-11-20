const BYTES_PER_MB = 1_000_000;

/** Formats a byte count as whole megabytes. */
export function megabytesText(bytes: number): string {
  return `${String(Math.round(bytes / BYTES_PER_MB))} MB`;
}
