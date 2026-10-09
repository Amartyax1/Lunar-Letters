import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Mail, Clock, Check, Edit, Eye, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { listDrafts, listSent, type Letter } from '../lib/mailbox';

interface EditLetter {
  id: string;
  to: string;
  subject: string;
  content: string;
  backgroundColor: string;
}

interface SentPageProps {
  onEditLetter: (letter: EditLetter) => void;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return 'Something went wrong while loading your letters.';
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

function letterWhen(letter: Letter): string {
  if (letter.status === 'sent') {
    return `Sent on ${formatLetterDate(letter.sentAt ?? letter.updatedAt)}`;
  }
  if (letter.scheduledFor) {
    return `Scheduled for ${formatLetterDate(letter.scheduledFor)}`;
  }
  return `Updated ${formatLetterDate(letter.updatedAt)}`;
}

export function SentPage({ onEditLetter }: SentPageProps) {
  const [sentLetters, setSentLetters] = useState<Letter[]>([]);
  const [draftLetters, setDraftLetters] = useState<Letter[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([listSent(), listDrafts()])
      .then(([sent, drafts]) => {
        if (cancelled) return;
        if (!Array.isArray(sent) || !Array.isArray(drafts)) {
          throw new Error('Letters did not come back as a list.');
        }
        setSentLetters(sent);
        setDraftLetters(drafts);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSentLetters([]);
        setDraftLetters([]);
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleViewLetter = (letter: Letter) => {
    setSelectedLetter(letter);
  };

  const handleEditLetter = (letter: Letter) => {
    if (letter.status === 'sent') {
      toast.error('Cannot edit letters that have already been sent');
      return;
    }
    onEditLetter({
      id: letter.id,
      to: letter.circleId ?? '',
      subject: letter.title,
      content: letter.body,
      backgroundColor: letter.paperColor || '#fafaf8',
    });
  };

  const seen = new Set<string>();
  const allLetters: Letter[] = [];
  for (const letter of [...sentLetters, ...draftLetters]) {
    if (seen.has(letter.id)) continue;
    seen.add(letter.id);
    allLetters.push(letter);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-tight text-foreground mb-2">
            Sent Letters
          </h1>
          <p className="text-muted-foreground">
            View your sent letters and manage drafts before they go out
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
                Couldn&apos;t load your letters
              </h2>
              <p className="text-foreground">{error}</p>
            </div>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="all">
                All ({allLetters.length})
              </TabsTrigger>
              <TabsTrigger value="sent">
                Sent ({sentLetters.length})
              </TabsTrigger>
              <TabsTrigger value="drafts">
                Drafts ({draftLetters.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {allLetters.length === 0 ? (
                <EmptyState message="No letters yet" />
              ) : (
                allLetters.map((letter) => (
                  <LetterCard
                    key={letter.id}
                    letter={letter}
                    onView={handleViewLetter}
                    onEdit={handleEditLetter}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {sentLetters.length === 0 ? (
                <EmptyState message="No sent letters yet" />
              ) : (
                sentLetters.map((letter) => (
                  <LetterCard
                    key={letter.id}
                    letter={letter}
                    onView={handleViewLetter}
                    onEdit={handleEditLetter}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="drafts" className="space-y-4">
              {draftLetters.length === 0 ? (
                <EmptyState message="No drafts yet" />
              ) : (
                draftLetters.map((letter) => (
                  <LetterCard
                    key={letter.id}
                    letter={letter}
                    onView={handleViewLetter}
                    onEdit={handleEditLetter}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
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
                  <StatusBadge letter={selectedLetter} />
                  <span>•</span>
                  <span>{letterWhen(selectedLetter)}</span>
                </div>
              </DialogHeader>

              <div
                className="mt-6 p-8 rounded-lg lined-paper min-h-[300px]"
                style={{ backgroundColor: selectedLetter.paperColor || '#fafaf8' }}
              >
                <div className="whitespace-pre-wrap leading-relaxed font-serif">
                  {selectedLetter.body}
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <div>
                  {selectedLetter.status !== 'sent' && (
                    <Button
                      variant="outline"
                      onClick={() => handleEditLetter(selectedLetter)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Letter
                    </Button>
                  )}
                </div>
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

function StatusBadge({ letter }: { letter: Letter }) {
  if (letter.status === 'sent') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <Check className="w-3 h-3 mr-1" />
        Sent
      </Badge>
    );
  }

  if (letter.status === 'scheduled') {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        Scheduled
      </Badge>
    );
  }

  return (
    <Badge className="bg-accent/20 text-accent-foreground">
      <FileText className="w-3 h-3 mr-1" />
      {letter.status === 'draft' ? 'Draft' : letter.status || 'Draft'}
    </Badge>
  );
}

function LetterCard({
  letter,
  onView,
  onEdit,
}: {
  letter: Letter;
  onView: (letter: Letter) => void;
  onEdit: (letter: Letter) => void;
}) {
  return (
    <Card className="p-6 paper-texture shadow-vintage hover:shadow-vintage-lg transition-all duration-300 border border-border">
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-serif text-lg text-foreground">
                {letterTitle(letter)}
              </h3>
              <StatusBadge letter={letter} />
            </div>

            {letter.circleId && (
              <p className="text-sm text-muted-foreground">
                Circle {letter.circleId}
              </p>
            )}

            <p className="text-sm text-muted-foreground mt-2 font-mono">
              {letterWhen(letter)}
            </p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => onView(letter)}>
              <Eye className="w-4 h-4" />
            </Button>
            {letter.status !== 'sent' && (
              <Button variant="outline" size="sm" onClick={() => onEdit(letter)}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-muted-foreground line-clamp-2 leading-relaxed">
          {letterPreview(letter.body)}
        </p>
      </div>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="p-12 text-center paper-texture shadow-vintage">
      <div className="relative z-10">
        <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </Card>
  );
}
