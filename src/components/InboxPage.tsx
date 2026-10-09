import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Mail, MailOpen, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { listInbox, type Letter } from '../lib/mailbox';

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return 'Something went wrong while loading your inbox.';
}

function formatLetterDate(value: string | null): string {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function letterTitle(letter: Letter): string {
  const title = letter.title.trim();
  return title || 'Untitled letter';
}

function letterPreview(body: string): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  if (!flat) return 'This letter is empty.';
  if (flat.length <= 180) return flat;
  return `${flat.slice(0, 177)}…`;
}

export function InboxPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [daysUntilDrop, setDaysUntilDrop] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const diffTime = nextMonth.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysUntilDrop(diffDays);
  }, []);

  useEffect(() => {
    let cancelled = false;

    listInbox()
      .then((rows) => {
        if (cancelled) return;
        if (!Array.isArray(rows)) {
          throw new Error('Inbox did not return a list of letters.');
        }
        setLetters(rows);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLetters([]);
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLetterClick = (letter: Letter) => {
    setSelectedLetter(letter);
    setOpenedIds((ids) => (ids.includes(letter.id) ? ids : [...ids, letter.id]));
  };

  const unreadCount = letters.filter((letter) => !openedIds.includes(letter.id)).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 p-4 paper-texture shadow-vintage border border-accent/30 bg-gradient-to-r from-accent/10 to-accent/5">
          <div className="relative z-10 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-foreground" />
            <p className="text-sm text-foreground font-mono">
              Next letter drop in <span className="font-medium">{daysUntilDrop} days</span>
            </p>
          </div>
        </Card>

        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-tight text-foreground mb-2">
            Inbox
          </h1>
          <p className="text-muted-foreground">
            {loading ? (
              'Loading your letters…'
            ) : error ? (
              'Your letters could not be loaded.'
            ) : letters.length === 0 ? (
              'Your inbox is empty.'
            ) : unreadCount > 0 ? (
              <>You have <span className="font-medium text-foreground">{unreadCount}</span> unread letter{unreadCount !== 1 ? 's' : ''}</>
            ) : (
              'All caught up!'
            )}
          </p>
        </div>

        {loading ? (
          <Card className="p-12 text-center paper-texture shadow-vintage">
            <div className="relative z-10">
              <p className="text-muted-foreground">Loading your letters…</p>
            </div>
          </Card>
        ) : error ? (
          <Card className="p-12 text-center paper-texture shadow-vintage" role="alert">
            <div className="relative z-10">
              <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="font-display text-2xl text-foreground mb-2">
                Couldn&apos;t load your inbox
              </h2>
              <p className="text-foreground">{error}</p>
            </div>
          </Card>
        ) : letters.length === 0 ? (
          <Card className="p-12 text-center paper-texture shadow-vintage">
            <div className="relative z-10">
              <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="font-display text-2xl text-foreground mb-2">
                No letters yet
              </h2>
              <p className="text-muted-foreground">
                Your inbox is empty. Letters will appear here on the 1st of each month.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {letters.map((letter) => {
              const opened = openedIds.includes(letter.id);
              return (
                <Card
                  key={letter.id}
                  className="p-6 paper-texture shadow-vintage hover:shadow-vintage-lg transition-all duration-300 border border-border cursor-pointer"
                  onClick={() => handleLetterClick(letter)}
                >
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {opened ? (
                        <MailOpen className="w-6 h-6 text-muted-foreground" />
                      ) : (
                        <Mail className="w-6 h-6 text-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg text-foreground">
                            {letterTitle(letter)}
                          </h3>
                          {!opened && (
                            <Badge className="bg-accent text-accent-foreground">New</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground font-mono flex-shrink-0">
                          {formatLetterDate(letter.sentAt ?? letter.createdAt)}
                        </span>
                      </div>

                      {letter.circleId && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Circle {letter.circleId}
                        </p>
                      )}

                      <p className="text-muted-foreground line-clamp-2">
                        {letterPreview(letter.body)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selectedLetter} onOpenChange={() => setSelectedLetter(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedLetter && (
            <div>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {letterTitle(selectedLetter)}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-mono pt-2">
                  {selectedLetter.circleId && (
                    <>
                      <span>Circle {selectedLetter.circleId}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{formatLetterDate(selectedLetter.sentAt ?? selectedLetter.createdAt)}</span>
                </div>
              </DialogHeader>

              <div
                className="mt-6 p-8 rounded-lg lined-paper min-h-[300px]"
                style={{ backgroundColor: selectedLetter.paperColor || '#fafaf8' }}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {selectedLetter.body}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedLetter(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
