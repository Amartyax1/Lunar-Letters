import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Mail, Clock, Check, Edit, Eye } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';

interface SentLetter {
  id: string;
  to: string;
  toMultiple?: string[];
  subject: string;
  content: string;
  backgroundColor?: string;
  sentDate?: string;
  scheduledFor: string;
  status: 'sent' | 'scheduled';
  circle?: string;
}

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

export function SentPage({ onEditLetter }: SentPageProps) {
  const [letters, setLetters] = useState<SentLetter[]>([
    {
      id: '1',
      to: 'Mom, Dad, Sister',
      toMultiple: ['Mom', 'Dad', 'Sister'],
      subject: 'Happy holidays from the city!',
      content: `Dear family,

I hope this letter finds you all well. The city is beautiful this time of year, with lights everywhere and that crisp winter air.

I've been thinking about our last family dinner and how much I miss those moments. Work has been busy, but good - I got that promotion I mentioned!

Can't wait to see you all at Christmas. I'm bringing that dessert you all love.

Love you all,
Your son/brother`,
      backgroundColor: '#fef3e2',
      sentDate: 'Dec 1, 2024',
      scheduledFor: 'Dec 1, 2024',
      status: 'sent',
      circle: 'Family',
    },
    {
      id: '2',
      to: 'Alex',
      subject: 'Remember that time we got lost in Tokyo?',
      content: `Hey Alex,

I was going through old photos and found that picture of us completely lost in Tokyo at 3 AM, eating convenience store onigiri and laughing about our terrible sense of direction.

We should plan another trip soon. Maybe somewhere we can get lost in again?

Let me know when you're free to call.

Your perpetually lost travel buddy`,
      backgroundColor: '#e8f4f8',
      sentDate: 'Nov 1, 2024',
      scheduledFor: 'Nov 1, 2024',
      status: 'sent',
    },
    {
      id: '3',
      to: 'Sarah, Marcus, Emma, James',
      toMultiple: ['Sarah', 'Marcus', 'Emma', 'James'],
      subject: 'Next book club pick',
      content: `Book Club friends!

Okay, hear me out - for next month, I'm proposing "The Ministry for the Future" by Kim Stanley Robinson.

It's climate fiction that's actually hopeful, which we could all use right now. Plus it's got that blend of science and storytelling that I know we all love.

Let me know what you think! And yes, I promise it's not as depressing as the last one I picked.

See you at next month's meeting!`,
      backgroundColor: '#f8e8f4',
      scheduledFor: 'Jan 1, 2025',
      status: 'scheduled',
      circle: 'Book Club',
    },
    {
      id: '4',
      to: 'Jordan',
      subject: 'You were right about the coffee shop',
      content: `Jordan,

You know that coffee shop you recommended? The one with the weird art on the walls?

I finally went, and I have to admit - you were absolutely right. Best cortado I've had in the city. And yes, the art is still weird.

I'm sorry I doubted your taste in coffee spots.

Thanks for the rec!`,
      backgroundColor: '#e8f8f0',
      scheduledFor: 'Jan 1, 2025',
      status: 'scheduled',
    },
  ]);

  const [selectedLetter, setSelectedLetter] = useState<SentLetter | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');

  const handleViewLetter = (letter: SentLetter) => {
    setSelectedLetter(letter);
    setViewMode('view');
  };

  const handleEditLetter = (letter: SentLetter) => {
    if (letter.status === 'sent') {
      toast.error('Cannot edit letters that have already been sent');
      return;
    }
    // Navigate to Write page with the letter data
    onEditLetter({
      id: letter.id,
      to: letter.to,
      subject: letter.subject,
      content: letter.content,
      backgroundColor: letter.backgroundColor || '#fafaf8',
    });
  };

  const handleSaveEdit = () => {
    toast.success('Letter updated!');
    setSelectedLetter(null);
  };

  const sentLetters = letters.filter(l => l.status === 'sent');
  const scheduledLetters = letters.filter(l => l.status === 'scheduled');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-tight text-foreground mb-2">
            Sent Letters
          </h1>
          <p className="text-muted-foreground">
            View your sent letters and manage scheduled ones
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all">
              All ({letters.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent ({sentLetters.length})
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              Scheduled ({scheduledLetters.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {letters.map((letter) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                onView={handleViewLetter}
                onEdit={handleEditLetter}
              />
            ))}
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

          <TabsContent value="scheduled" className="space-y-4">
            {scheduledLetters.length === 0 ? (
              <EmptyState message="No scheduled letters" />
            ) : (
              scheduledLetters.map((letter) => (
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
      </div>

      {/* Letter View/Edit Dialog */}
      <Dialog open={!!selectedLetter} onOpenChange={() => setSelectedLetter(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedLetter && (
            <div>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {selectedLetter.subject}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-mono pt-2">
                  <span>To: {selectedLetter.to}</span>
                  {selectedLetter.circle && (
                    <>
                      <span>•</span>
                      <Badge className="bg-accent/20 text-accent-foreground">
                        {selectedLetter.circle}
                      </Badge>
                    </>
                  )}
                  {selectedLetter.toMultiple && selectedLetter.toMultiple.length > 1 && (
                    <>
                      <span>•</span>
                      <Badge className="bg-accent/20 text-accent-foreground">
                        {selectedLetter.toMultiple.length} recipients
                      </Badge>
                    </>
                  )}
                  <span>•</span>
                  {selectedLetter.status === 'sent' ? (
                    <span>Sent: {selectedLetter.sentDate}</span>
                  ) : (
                    <span>Scheduled for: {selectedLetter.scheduledFor}</span>
                  )}
                </div>
              </DialogHeader>

              {selectedLetter.toMultiple && selectedLetter.toMultiple.length > 1 && (
                <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm mb-2">This letter will be sent to:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLetter.toMultiple.map((recipient, index) => (
                      <Badge key={index} variant="outline">
                        {recipient}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div
                className="mt-6 p-8 rounded-lg lined-paper min-h-[300px]"
                style={{ backgroundColor: selectedLetter.backgroundColor }}
              >
                <div className="whitespace-pre-wrap leading-relaxed font-serif">
                  {selectedLetter.content}
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <div>
                  {selectedLetter.status === 'scheduled' && (
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

function LetterCard({
  letter,
  onView,
  onEdit,
}: {
  letter: SentLetter;
  onView: (letter: SentLetter) => void;
  onEdit: (letter: SentLetter) => void;
}) {
  return (
    <Card className="p-6 paper-texture shadow-vintage hover:shadow-vintage-lg transition-all duration-300 border border-border">
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-serif text-lg text-foreground">
                {letter.subject}
              </h3>
              {letter.status === 'sent' ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Check className="w-3 h-3 mr-1" />
                  Sent
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Scheduled
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>To: {letter.to}</span>
              {letter.circle && (
                <>
                  <span>•</span>
                  <Badge className="bg-accent/20 text-accent-foreground text-xs">
                    {letter.circle}
                  </Badge>
                </>
              )}
              {letter.toMultiple && letter.toMultiple.length > 1 && (
                <>
                  <span>•</span>
                  <Badge className="bg-accent/20 text-accent-foreground text-xs">
                    {letter.toMultiple.length} recipients
                  </Badge>
                </>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-2 font-mono">
              {letter.status === 'sent'
                ? `Sent on ${letter.sentDate}`
                : `Scheduled for ${letter.scheduledFor}`}
            </p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => onView(letter)}>
              <Eye className="w-4 h-4" />
            </Button>
            {letter.status === 'scheduled' && (
              <Button variant="outline" size="sm" onClick={() => onEdit(letter)}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-muted-foreground line-clamp-2 leading-relaxed">
          {letter.content}
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
