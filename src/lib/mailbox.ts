/**
 * Local stand-in so Inbox and Sent can typecheck before the shared mailbox
 * module lands. Letters live in localStorage under "lunar-letters.mailbox"
 * as a JSON array. This file only exports listInbox, listSent, listDrafts,
 * and Letter.
 *
 * status "inbox" is returned by listInbox.
 * status "sent" is returned by listSent.
 * status "draft" or "scheduled" is returned by listDrafts.
 */

const STORAGE_KEY = 'lunar-letters.mailbox';

export type Letter = {
  id: string;
  userId: string;
  circleId: string | null;
  title: string;
  body: string;
  paperColor: string;
  status: string;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
};

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isLetter(value: unknown): value is Letter {
  if (!value || typeof value !== 'object') return false;
  const letter = value as Record<string, unknown>;
  return (
    typeof letter.id === 'string' &&
    typeof letter.userId === 'string' &&
    isNullableString(letter.circleId) &&
    typeof letter.title === 'string' &&
    typeof letter.body === 'string' &&
    typeof letter.paperColor === 'string' &&
    typeof letter.status === 'string' &&
    isNullableString(letter.scheduledFor) &&
    typeof letter.createdAt === 'string' &&
    typeof letter.updatedAt === 'string' &&
    isNullableString(letter.sentAt)
  );
}

function readAll(): Letter[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    throw new Error('Could not read saved letters.');
  }

  if (raw === null || raw.trim() === '') return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Saved letters could not be read.');
  }

  if (!Array.isArray(parsed) || !parsed.every(isLetter)) {
    throw new Error('Saved letters could not be read.');
  }

  return parsed;
}

export async function listInbox(): Promise<Letter[]> {
  return readAll().filter((letter) => letter.status === 'inbox');
}

export async function listSent(): Promise<Letter[]> {
  return readAll().filter((letter) => letter.status === 'sent');
}

export async function listDrafts(): Promise<Letter[]> {
  return readAll().filter(
    (letter) => letter.status === 'draft' || letter.status === 'scheduled',
  );
}
