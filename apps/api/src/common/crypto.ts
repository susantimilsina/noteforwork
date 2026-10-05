import { createHash, randomBytes } from 'node:crypto';
import { formatId } from '@nfw/schemas';

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** Opaque bearer secret (256 bits). Only its hash is stored. */
export const newSecretToken = () => randomBytes(32).toString('base64url');

/** REQ-XXXX-XXXX — 40 random bits, for humans/support; not an access credential. */
export const newRequestRef = () => formatId('REQ', randomBytes(5), 2);

/** NFW-XXXX-XXXX-XXXX — 60 random bits. */
export const newNoteId = () => formatId('NFW', randomBytes(8), 3);
