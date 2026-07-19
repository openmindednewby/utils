/**
 * Text sanitization utilities for preventing XSS and ensuring safe display.
 * These utilities sanitize user-provided text before rendering.
 */

/**
 * HTML entities that should be escaped to prevent XSS attacks.
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Regular expression matching characters that need escaping.
 */
const HTML_ESCAPE_REGEX = /[&<>"'`=/]/g;

/**
 * Unicode code point ranges for dangerous characters.
 * These are control characters and zero-width characters that can be
 * used in homograph attacks or to hide malicious content.
 */

/** C0 control characters range start (NULL) */
const C0_CONTROL_START = 0x0000;
/** C0 control characters range end (Unit Separator) */
const C0_CONTROL_END = 0x001f;
/** C1 control characters range start (DEL and beyond) */
const C1_CONTROL_START = 0x007f;
/** C1 control characters range end */
const C1_CONTROL_END = 0x009f;
/** Zero-width characters range start (Zero Width Space) */
const ZERO_WIDTH_START = 0x200b;
/** Zero-width characters range end (Right-to-Left Mark) */
const ZERO_WIDTH_END = 0x200f;
/** Format characters range start (Line Separator) */
const FORMAT_CHARS_START = 0x2028;
/** Format characters range end (Narrow No-Break Space) */
const FORMAT_CHARS_END = 0x202f;
/** Byte Order Mark code point */
const BYTE_ORDER_MARK = 0xfeff;

/**
 * Maximum reasonable length for notification messages.
 */
const MAX_NOTIFICATION_LENGTH = 500;

/**
 * Length of ellipsis suffix ("...") used when truncating text.
 */
const ELLIPSIS_LENGTH = 3;

/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 * Use this when displaying user-provided content in the UI.
 *
 * @param text - The text to sanitize
 * @returns The sanitized text with HTML entities escaped
 *
 * @example
 * sanitizeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function sanitizeHtml(text: string): string {
  if (text.length === 0) {return '';}
  return text.replace(HTML_ESCAPE_REGEX, (char) => HTML_ENTITIES[char] ?? char);
}

/**
 * Control characters and zero-width characters that should be removed.
 * These can be used in homograph attacks or to hide malicious content.
 */
function isDangerousCharCode(code: number): boolean {
  const isC0Control = code >= C0_CONTROL_START && code <= C0_CONTROL_END;
  const isC1Control = code >= C1_CONTROL_START && code <= C1_CONTROL_END;
  const isZeroWidth = code >= ZERO_WIDTH_START && code <= ZERO_WIDTH_END;
  const isFormatChar = code >= FORMAT_CHARS_START && code <= FORMAT_CHARS_END;
  const isBom = code === BYTE_ORDER_MARK;
  return isC0Control || isC1Control || isZeroWidth || isFormatChar || isBom;
}

/**
 * Removes control characters and zero-width characters from text.
 * These characters can be used to create misleading text or hide content.
 *
 * @param text - The text to sanitize
 * @returns The text with dangerous characters removed
 */
export function removeControlCharacters(text: string): string {
  if (text.length === 0) {return '';}
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (!isDangerousCharCode(code)) {out += text[i];}
  }
  return out;
}

/**
 * Sanitizes a notification message for safe display.
 * This function:
 * 1. Removes control/zero-width characters
 * 2. Trims whitespace
 * 3. Truncates to a reasonable length
 * 4. Escapes HTML entities (for web platform)
 *
 * Note: React Native's Text component already escapes HTML by default,
 * but this provides defense-in-depth and handles the web platform.
 *
 * @param message - The notification message to sanitize
 * @param maxLength - Maximum length (default: 500)
 * @returns The sanitized message
 *
 * @example
 * sanitizeNotificationMessage('  Hello <b>World</b>  ')
 * // Returns: 'Hello &lt;b&gt;World&lt;/b&gt;'
 */
export function sanitizeNotificationMessage(
  message: string,
  maxLength: number = MAX_NOTIFICATION_LENGTH
): string {
  if (message.length === 0) {return '';}

  // Remove dangerous characters first
  let sanitized = removeControlCharacters(message);

  // Trim whitespace
  sanitized = sanitized.trim();

  // Truncate if too long
  if (sanitized.length > maxLength) 
    {sanitized = `${sanitized.substring(0, maxLength - ELLIPSIS_LENGTH)}...`;}
  

  // Escape HTML entities
  sanitized = sanitizeHtml(sanitized);

  return sanitized;
}

/**
 * Sanitizes text for safe display, without HTML escaping.
 * Use this for React Native components where HTML escaping isn't needed
 * but control character removal and length limits are still important.
 *
 * @param text - The text to sanitize
 * @param maxLength - Maximum length (optional)
 * @returns The sanitized text
 */
export function sanitizeText(text: string, maxLength?: number): string {
  if (text.length === 0) {return '';}

  let sanitized = removeControlCharacters(text);
  sanitized = sanitized.trim();

  const hasValidMaxLength = typeof maxLength === 'number' && maxLength > 0;
  const exceedsMaxLength = hasValidMaxLength && sanitized.length > maxLength;
  if (exceedsMaxLength) 
    {sanitized = `${sanitized.substring(0, maxLength - ELLIPSIS_LENGTH)}...`;}
  

  return sanitized;
}

/**
 * Validates and sanitizes a URL to prevent javascript: and data: protocol attacks.
 *
 * @param url - The URL to validate
 * @returns The sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (url.length === 0) {return '';}

  const trimmedLower = url.trim().toLowerCase();
  const protocol = trimmedLower.split(':')[0];

  // Block dangerous protocols
  const isDangerousProtocol = protocol === 'javascript' || protocol === 'data' || protocol === 'vbscript';
  if (isDangerousProtocol) 
    {return '';}
  

  return url.trim();
}
