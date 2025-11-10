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

interface Letter {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  content: string;
  backgroundColor?: string;
}

export function InboxPage() {
  const [letters, setLetters] = useState<Letter[]>([
    {
      id: '1',
      from: 'Sarah Mitchell',
      subject: 'Catching up from the mountains',
      preview: 'Hey! I hope this letter finds you well. I wanted to share some thoughts from my recent trip...',
      date: 'Dec 1, 2024',
      read: false,
      content: `Hey! I hope this letter finds you well. I wanted to share some thoughts from my recent trip to the mountains.

The air up there is different - crisp, clean, and somehow makes everything feel more real. I spent most mornings watching the sunrise paint the peaks in shades of pink and gold.

I thought of you a lot during the quiet moments. Remember when we used to talk about taking that road trip? I think we should finally do it.

Hope you're doing well. Write back when you can!

With love,
Sarah`,
      backgroundColor: '#fef3e2',
    },
    {
      id: '2',
      from: 'Marcus Chen',
      subject: 'Book recommendation you NEED to read',
      preview: 'Alright, so I just finished this book and I immediately thought of you because...',
      date: 'Dec 1, 2024',
      read: false,
      content: `Alright, so I just finished this book and I immediately thought of you because it's exactly the kind of weird, philosophical fiction you love.

It's called "The Overstory" by Richard Powers. It's about trees. Yes, trees. But also about human connection, time, and how we're all part of something bigger.

I won't spoil it, but there's this one scene in chapter 4 that literally made me stop and stare at the wall for 10 minutes.

Let me know if you read it. We need to discuss.

Marcus`,
      backgroundColor: '#e8f4f8',
    },
    {
      id: '3',
      from: 'Emma Rodriguez',
      subject: 'Thank you for everything',
      preview: 'I know I don\'t say this enough, but I wanted to write and tell you how much your friendship...',
      date: 'Nov 1, 2024',
      read: true,
      content: `I know I don't say this enough, but I wanted to write and tell you how much your friendship means to me.

This past year has been challenging in ways I didn't expect, and you've been there through all of it. The late-night calls, the spontaneous coffee dates, the way you always know when I need to talk.

I'm writing this at 2 AM because I couldn't sleep and I realized I never properly thanked you for being such an incredible human.

Thank you for being you.

Emma`,
      backgroundColor: '#f8e8f4',
    },
  ]);

  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [daysUntilDrop, setDaysUntilDrop] = useState(5);

  useEffect(() => {
    // Calculate days until next month (1st of next month)
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const diffTime = nextMonth.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysUntilDrop(diffDays);
  }, []);

  const handleLetterClick = (letter: Letter) => {
    setSelectedLetter(letter);
    if (!letter.read) {
      setLetters(letters.map(l => 
        l.id === letter.id ? { ...l, read: true } : l
      ));
    }
  };

  const unreadCount = letters.filter(l => !l.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Countdown Banner */}
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
            {unreadCount > 0 ? (
              <>You have <span className="font-medium text-foreground">{unreadCount}</span> unread letter{unreadCount !== 1 ? 's' : ''}</>
            ) : (
              'All caught up!'
            )}
          </p>
        </div>

        {letters.length === 0 ? (
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
            {letters.map((letter) => (
              <Card
                key={letter.id}
                className="p-6 paper-texture shadow-vintage hover:shadow-vintage-lg transition-all duration-300 border border-border cursor-pointer"
                onClick={() => handleLetterClick(letter)}
              >
                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {letter.read ? (
                      <MailOpen className="w-6 h-6 text-muted-foreground" />
                    ) : (
                      <Mail className="w-6 h-6 text-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg text-foreground">
                          {letter.from}
                        </h3>
                        {!letter.read && (
                          <Badge className="bg-accent text-accent-foreground">New</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground font-mono flex-shrink-0">
                        {letter.date}
                      </span>
                    </div>
                    
                    <h4 className="font-serif text-foreground mb-2">
                      {letter.subject}
                    </h4>
                    
                    <p className="text-muted-foreground line-clamp-2">
                      {letter.preview}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Letter Dialog */}
      <Dialog open={!!selectedLetter} onOpenChange={() => setSelectedLetter(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedLetter && (
            <div>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {selectedLetter.subject}
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono pt-2">
                  <span>From: {selectedLetter.from}</span>
                  <span>•</span>
                  <span>{selectedLetter.date}</span>
                </div>
              </DialogHeader>
              
              <div 
                className="mt-6 p-8 rounded-lg lined-paper min-h-[300px]"
                style={{ backgroundColor: selectedLetter.backgroundColor }}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {selectedLetter.content}
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
