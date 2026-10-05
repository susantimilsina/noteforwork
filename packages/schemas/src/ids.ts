/**
 * Public identifiers. Generated ONLY on the server with a CSPRNG (never Math.random, never in the browser).
 * Crockford base32 avoids ambiguous characters (no I, L, O, U) so IDs are easy to read over the phone.
 */
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export const NOTE_ID_PATTERN = /^NFW-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;
export const REQUEST_REF_PATTERN = /^REQ-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

/** Normalize user-typed IDs: uppercase, trim, map look-alikes (O→0, I/L→1). */
export function normalizePublicId(raw: string): string {
  return raw.trim().toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/\s+/g, '');
}

/** Format random bytes into grouped Crockford base32. Caller supplies CSPRNG bytes. */
export function formatId(prefix: 'NFW' | 'REQ', bytes: Uint8Array, groups: number): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5 && out.length < groups * 4) {
      out += CROCKFORD[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (out.length < groups * 4) throw new Error('Not enough random bytes for ID');
  const chunks = out.match(/.{4}/g)!;
  return `${prefix}-${chunks.join('-')}`;
}
