/**
 * Tests for XSS sanitization utilities.
 */
import {
  sanitizeHtml,
  removeControlCharacters,
  sanitizeNotificationMessage,
  sanitizeText,
  sanitizeUrl,
} from './sanitize';

describe('sanitizeHtml', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should escape HTML tags', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('should escape ampersands', () => {
    expect(sanitizeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('should escape quotes', () => {
    expect(sanitizeHtml('"hello" \'world\'')).toBe('&quot;hello&quot; &#x27;world&#x27;');
  });

  it('should escape equals and backticks', () => {
    expect(sanitizeHtml('a=b `code`')).toBe('a&#x3D;b &#x60;code&#x60;');
  });

  it('should handle normal text unchanged', () => {
    expect(sanitizeHtml('Hello World')).toBe('Hello World');
  });

  it('should escape forward slashes', () => {
    expect(sanitizeHtml('path/to/file')).toBe('path&#x2F;to&#x2F;file');
  });
});

describe('removeControlCharacters', () => {
  it('should return empty string for empty input', () => {
    expect(removeControlCharacters('')).toBe('');
  });

  it('should remove null bytes', () => {
    expect(removeControlCharacters('hello\u0000world')).toBe('helloworld');
  });

  it('should remove zero-width characters', () => {
    expect(removeControlCharacters('hello\u200Bworld')).toBe('helloworld');
  });

  it('should remove line separator characters', () => {
    expect(removeControlCharacters('hello\u2028world')).toBe('helloworld');
  });

  it('should preserve normal whitespace (spaces)', () => {
    expect(removeControlCharacters('hello world')).toBe('hello world');
  });

  it('should remove control characters including newlines and tabs', () => {
    // Control characters (0x00-0x1F) include newline (0x0A) and tab (0x09)
    expect(removeControlCharacters('hello\nworld')).toBe('helloworld');
    expect(removeControlCharacters('hello\tworld')).toBe('helloworld');
  });
});

describe('sanitizeNotificationMessage', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeNotificationMessage('')).toBe('');
  });

  it('should trim whitespace', () => {
    expect(sanitizeNotificationMessage('  hello world  ')).toBe('hello world');
  });

  it('should escape HTML', () => {
    expect(sanitizeNotificationMessage('<b>bold</b>')).toBe('&lt;b&gt;bold&lt;&#x2F;b&gt;');
  });

  it('should remove control characters', () => {
    expect(sanitizeNotificationMessage('hello\u0000world')).toBe('helloworld');
  });

  it('should truncate long messages with ellipsis', () => {
    const longMessage = 'a'.repeat(600);
    const result = sanitizeNotificationMessage(longMessage);
    expect(result.length).toBe(500);
    expect(result.endsWith('...')).toBe(true);
  });

  it('should respect custom max length', () => {
    const message = 'a'.repeat(50);
    const result = sanitizeNotificationMessage(message, 20);
    expect(result.length).toBe(20);
    expect(result.endsWith('...')).toBe(true);
  });

  it('should not add ellipsis if message fits', () => {
    const message = 'hello world';
    const result = sanitizeNotificationMessage(message, 100);
    expect(result).toBe('hello world');
    expect(result.endsWith('...')).toBe(false);
  });
});

describe('sanitizeText', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('should trim whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('should remove control characters', () => {
    expect(sanitizeText('hello\u200Bworld')).toBe('helloworld');
  });

  it('should NOT escape HTML (unlike sanitizeNotificationMessage)', () => {
    expect(sanitizeText('<b>bold</b>')).toBe('<b>bold</b>');
  });

  it('should truncate with custom max length', () => {
    const message = 'a'.repeat(50);
    const result = sanitizeText(message, 20);
    expect(result.length).toBe(20);
    expect(result.endsWith('...')).toBe(true);
  });

  it('should not truncate when maxLength is not provided', () => {
    const message = 'a'.repeat(1000);
    const result = sanitizeText(message);
    expect(result.length).toBe(1000);
  });
});

describe('sanitizeUrl', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeUrl('')).toBe('');
  });

  it('should block javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('should block JAVASCRIPT: protocol (case insensitive)', () => {
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
  });

  it('should block data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('should block vbscript: protocol', () => {
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
  });

  it('should allow http: URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('should allow https: URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('should allow relative URLs', () => {
    expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
  });

  it('should trim whitespace', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
  });
});
