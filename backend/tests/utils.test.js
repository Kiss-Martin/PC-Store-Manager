// Tests for utility functions
import { jest } from '@jest/globals';

import { sanitizeMiddleware } from '../src/middlewares/sanitize.middleware.js';
import { languageMiddleware } from '../src/middlewares/language.middleware.js';
import { errorHandler } from '../src/middlewares/error.middleware.js';
import { asyncWrap } from '../src/utils/async.util.js';
import { scrubSensitive } from '../src/utils/scrub.util.js';
import { escapeCsvValue, generateCsvFromObjects } from '../src/utils/csv.util.js';
import { hashToken } from '../src/utils/token.util.js';
import { ORDER_STATUSES } from '../src/utils/constants.js';

// ─── sanitizeMiddleware ──────────────────────────────────

describe('sanitizeMiddleware', () => {
  const next = jest.fn();

  beforeEach(() => {
    next.mockClear();
  });

  it('should strip null bytes from strings in body', () => {
    const req = { body: { name: 'hello\0world' } };
    sanitizeMiddleware(req, {}, next);
    expect(req.body.name).toBe('helloworld');
    expect(next).toHaveBeenCalled();
  });

  it('should HTML-encode angle brackets and quotes', () => {
    const req = { body: { note: '<script>alert("xss")</script>' } };
    sanitizeMiddleware(req, {}, next);
    expect(req.body.note).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(next).toHaveBeenCalled();
  });

  it('should leave safe strings untouched', () => {
    const req = { body: { name: 'normal text 123' } };
    sanitizeMiddleware(req, {}, next);
    expect(req.body.name).toBe('normal text 123');
  });

  it('should handle nested objects', () => {
    const req = { body: { outer: { inner: '<b>bold</b>' } } };
    sanitizeMiddleware(req, {}, next);
    expect(req.body.outer.inner).toBe('&lt;b&gt;bold&lt;/b&gt;');
  });

  it('should handle missing body gracefully', () => {
    const req = { body: null };
    sanitizeMiddleware(req, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('should not modify non-string values', () => {
    const req = { body: { count: 42, flag: true } };
    sanitizeMiddleware(req, {}, next);
    expect(req.body.count).toBe(42);
    expect(req.body.flag).toBe(true);
  });
});

// ─── languageMiddleware ──────────────────────────────────

describe('languageMiddleware', () => {
  const next = jest.fn();

  beforeEach(() => {
    next.mockClear();
  });

  it('should parse "hu" from Accept-Language header', () => {
    const req = { headers: { 'accept-language': 'hu-HU,hu;q=0.9' } };
    languageMiddleware(req, {}, next);
    expect(req.lang).toBe('hu');
    expect(next).toHaveBeenCalled();
  });

  it('should parse "en" from Accept-Language header', () => {
    const req = { headers: { 'accept-language': 'en-US,en;q=0.9' } };
    languageMiddleware(req, {}, next);
    expect(req.lang).toBe('en');
    expect(next).toHaveBeenCalled();
  });

  it('should default to "en" when no Accept-Language header', () => {
    const req = { headers: {} };
    languageMiddleware(req, {}, next);
    expect(req.lang).toBe('en');
  });

  it('should default to "en" when header is empty', () => {
    const req = { headers: { 'accept-language': '' } };
    languageMiddleware(req, {}, next);
    expect(req.lang).toBe('en');
  });
});

// ─── errorHandler ────────────────────────────────────────

describe('errorHandler', () => {
  it('should return 500 and error message by default', () => {
    const err = new Error('Something broke');
    const req = { lang: 'en' };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const nextFn = jest.fn();
    errorHandler(err, req, res, nextFn);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Something broke' });
  });

  it('should use statusCode from error if set', () => {
    const err = new Error('Not Found');
    err.statusCode = 404;
    const req = { lang: 'en' };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not Found' });
  });
});

// ─── asyncWrap ───────────────────────────────────────────

describe('asyncWrap', () => {
  it('should call the handler and proceed normally on success', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const req = {};
    const res = {};
    const next = jest.fn();
    const wrapped = asyncWrap(handler);
    await wrapped(req, res, next);
    expect(handler).toHaveBeenCalledWith(req, res, next);
  });

  it('should call next with error when handler throws', async () => {
    const error = new Error('async fail');
    const handler = jest.fn().mockRejectedValue(error);
    const next = jest.fn();
    const wrapped = asyncWrap(handler);
    await wrapped({}, {}, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

// ─── scrubSensitive ──────────────────────────────────────

describe('scrubSensitive', () => {
  it('should remove password_hash from objects', () => {
    const input = { id: 1, email: 'a@b.com', password_hash: '$2a$10$...' };
    const result = scrubSensitive(input);
    expect(result).not.toHaveProperty('password_hash');
    expect(result.email).toBe('a@b.com');
  });

  it('should remove password from objects', () => {
    const input = { id: 1, password: 'secret' };
    const result = scrubSensitive(input);
    expect(result).not.toHaveProperty('password');
  });

  it('should remove supabaseKey from objects', () => {
    const input = { id: 1, supabaseKey: 'key123' };
    const result = scrubSensitive(input);
    expect(result).not.toHaveProperty('supabaseKey');
  });

  it('should scrub nested objects', () => {
    const input = { user: { id: 1, password_hash: 'hash' }, data: 'ok' };
    const result = scrubSensitive(input);
    expect(result.user).not.toHaveProperty('password_hash');
    expect(result.user.id).toBe(1);
  });

  it('should scrub arrays of objects', () => {
    const input = [
      { id: 1, password: 'a' },
      { id: 2, password: 'b' },
    ];
    const result = scrubSensitive(input);
    expect(result).toHaveLength(2);
    expect(result[0]).not.toHaveProperty('password');
    expect(result[1]).not.toHaveProperty('password');
  });

  it('should return primitives unchanged', () => {
    expect(scrubSensitive(null)).toBe(null);
    expect(scrubSensitive(42)).toBe(42);
    expect(scrubSensitive('hello')).toBe('hello');
  });
});

// ─── CSV utils ───────────────────────────────────────────

describe('CSV utilities', () => {
  describe('escapeCsvValue', () => {
    it('should return empty string for null', () => {
      expect(escapeCsvValue(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(escapeCsvValue(undefined)).toBe('');
    });

    it('should return plain string when no special chars', () => {
      expect(escapeCsvValue('hello')).toBe('hello');
    });

    it('should wrap value containing commas in quotes', () => {
      expect(escapeCsvValue('hello, world')).toBe('"hello, world"');
    });

    it('should escape double quotes inside value', () => {
      expect(escapeCsvValue('say "hello"')).toBe('"say ""hello"""');
    });

    it('should wrap value containing newlines', () => {
      expect(escapeCsvValue('line1\nline2')).toBe('"line1\nline2"');
    });

    it('should convert numbers to string', () => {
      expect(escapeCsvValue(42)).toBe('42');
    });
  });

  describe('generateCsvFromObjects', () => {
    it('should generate CSV with BOM, header and rows', () => {
      const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ];
      const rows = [
        { id: 1, name: 'Widget' },
        { id: 2, name: 'Gadget' },
      ];
      const csv = generateCsvFromObjects(columns, rows);
      // BOM marker
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('ID,Name');
      expect(csv).toContain('1,Widget');
      expect(csv).toContain('2,Gadget');
    });

    it('should handle empty rows', () => {
      const columns = [{ key: 'id', label: 'ID' }];
      const csv = generateCsvFromObjects(columns, []);
      expect(csv).toContain('ID');
    });
  });
});

// ─── hashToken ───────────────────────────────────────────

describe('hashToken', () => {
  it('should return a hex string for valid input', () => {
    const result = hashToken('my-token');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(/^[a-f0-9]+$/.test(result)).toBe(true);
  });

  it('should return null for null input', () => {
    expect(hashToken(null)).toBe(null);
  });

  it('should return null for empty string', () => {
    expect(hashToken('')).toBe(null);
  });

  it('should return the same hash for the same input', () => {
    const hash1 = hashToken('token-abc');
    const hash2 = hashToken('token-abc');
    expect(hash1).toBe(hash2);
  });

  it('should return different hashes for different inputs', () => {
    const hash1 = hashToken('token-a');
    const hash2 = hashToken('token-b');
    expect(hash1).not.toBe(hash2);
  });
});

// ─── Constants ───────────────────────────────────────────

describe('ORDER_STATUSES', () => {
  it('should contain the expected order statuses', () => {
    expect(ORDER_STATUSES).toEqual(['pending', 'processing', 'completed', 'cancelled']);
  });

  it('should have 4 statuses', () => {
    expect(ORDER_STATUSES).toHaveLength(4);
  });
});
