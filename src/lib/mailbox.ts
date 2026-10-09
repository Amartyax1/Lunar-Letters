import { supabase } from "./supabaseClient";

export type LetterStatus = "draft" | "scheduled" | "sent";

export type Letter = {
  id: string;
  userId: string;
  circleId: string | null;
  title: string;
  body: string;
  paperColor: string;
  status: LetterStatus;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
};

export type Circle = {
  id: string;
  ownerId: string;
  name: string;
  memberEmails: string[];
};

export type LetterInput = {
  id?: string;
  circleId: string | null;
  title: string;
  body: string;
  paperColor: string;
};

type LetterRow = {
  id: string;
  user_id: string;
  circle_id: string | null;
  title: string;
  body: string;
  paper_color: string;
  status: LetterStatus;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  circles?: { member_emails: string[] | null } | { member_emails: string[] | null }[] | null;
};

type CircleRow = {
  id: string;
  owner_id: string;
  name: string;
  member_emails: string[] | null;
};

const LETTER_COLUMNS =
  "id, user_id, circle_id, title, body, paper_color, status, scheduled_for, created_at, updated_at, sent_at";

function mapLetter(row: LetterRow): Letter {
  return {
    id: row.id,
    userId: row.user_id,
    circleId: row.circle_id,
    title: row.title,
    body: row.body,
    paperColor: row.paper_color,
    status: row.status,
    scheduledFor: row.scheduled_for,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at,
  };
}

function mapCircle(row: CircleRow): Circle {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    memberEmails: row.member_emails ?? [],
  };
}

function memberEmailsOf(row: LetterRow): string[] {
  const circle = row.circles;
  if (!circle) return [];
  const emails = Array.isArray(circle) ? circle[0]?.member_emails : circle.member_emails;
  return emails ?? [];
}

async function requireUser(): Promise<{ id: string; email?: string | null }> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error(error?.message || "Not signed in");
  }
  return data.user;
}

function utcToday(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** 1st of the next month in UTC: the next calendar day-1. */
function nextCalendarDayOneUtc(now = new Date()): string {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toISOString().slice(0, 10);
}

async function releaseDueLetters(userId: string): Promise<void> {
  const { error } = await supabase
    .from("letters")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("status", "scheduled")
    .lte("scheduled_for", utcToday());

  if (error) throw new Error(error.message);
}

export async function listInbox(): Promise<Letter[]> {
  const user = await requireUser();
  await releaseDueLetters(user.id);
  const email = user.email?.trim().toLowerCase() ?? "";
  if (!email) return [];

  const { data, error } = await supabase
    .from("letters")
    .select(`${LETTER_COLUMNS}, circles!inner(member_emails)`)
    .eq("status", "sent")
    .neq("user_id", user.id)
    .order("sent_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as LetterRow[])
    .filter((row) =>
      memberEmailsOf(row).some((member) => member.trim().toLowerCase() === email),
    )
    .map(mapLetter);
}

export async function listSent(): Promise<Letter[]> {
  const user = await requireUser();
  await releaseDueLetters(user.id);

  const { data, error } = await supabase
    .from("letters")
    .select(LETTER_COLUMNS)
    .eq("user_id", user.id)
    .eq("status", "sent")
    .order("sent_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as LetterRow[]).map(mapLetter);
}

export async function listDrafts(): Promise<Letter[]> {
  const user = await requireUser();
  await releaseDueLetters(user.id);

  const { data, error } = await supabase
    .from("letters")
    .select(LETTER_COLUMNS)
    .eq("user_id", user.id)
    .in("status", ["draft", "scheduled"])
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as LetterRow[]).map(mapLetter);
}

export async function saveDraft(input: LetterInput): Promise<Letter> {
  const user = await requireUser();
  const fields = {
    circle_id: input.circleId,
    title: input.title,
    body: input.body,
    paper_color: input.paperColor,
    status: "draft" as const,
    scheduled_for: null,
    sent_at: null,
  };

  if (input.id) {
    const { data: existing, error: readError } = await supabase
      .from("letters")
      .select("id, status")
      .eq("id", input.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) throw new Error(readError.message);
    if (!existing) throw new Error("Letter not found");
    if (existing.status === "sent") throw new Error("Sent letters cannot be edited");

    const { data, error } = await supabase
      .from("letters")
      .update(fields)
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select(LETTER_COLUMNS)
      .single();

    if (error) throw new Error(error.message);
    return mapLetter(data as LetterRow);
  }

  const { data, error } = await supabase
    .from("letters")
    .insert({ ...fields, user_id: user.id })
    .select(LETTER_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return mapLetter(data as LetterRow);
}

export async function scheduleLetter(id: string): Promise<Letter> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("letters")
    .update({
      status: "scheduled",
      scheduled_for: nextCalendarDayOneUtc(),
      sent_at: null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .in("status", ["draft", "scheduled"])
    .select(LETTER_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Letter not found");
  return mapLetter(data as LetterRow);
}

export async function listCircles(): Promise<Circle[]> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("circles")
    .select("id, owner_id, name, member_emails")
    .eq("owner_id", user.id)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as CircleRow[]).map(mapCircle);
}

export async function saveCircle(input: {
  id?: string;
  name: string;
  memberEmails: string[];
}): Promise<Circle> {
  const user = await requireUser();
  const name = input.name.trim();
  if (!name) throw new Error("Circle name is required");
  const memberEmails = [
    ...new Set(input.memberEmails.map((email) => email.trim().toLowerCase()).filter(Boolean)),
  ];

  if (input.id) {
    const { data, error } = await supabase
      .from("circles")
      .update({ name, member_emails: memberEmails })
      .eq("id", input.id)
      .eq("owner_id", user.id)
      .select("id, owner_id, name, member_emails")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Circle not found");
    return mapCircle(data as CircleRow);
  }

  const { data, error } = await supabase
    .from("circles")
    .insert({ owner_id: user.id, name, member_emails: memberEmails })
    .select("id, owner_id, name, member_emails")
    .single();

  if (error) throw new Error(error.message);
  return mapCircle(data as CircleRow);
}

export async function deleteCircle(id: string): Promise<void> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("circles")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Circle not found");
}
