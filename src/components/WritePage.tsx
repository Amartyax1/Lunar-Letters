import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Bold, Italic, List, Save, Send, Palette, Users, FileText, Sparkles, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import { CircleManager } from './CircleManager';
import type { Circle } from '../lib/mailbox';

interface Draft {
  id: string;
  to: string;
  subject: string;
  content: string;
  backgroundColor: string;
  savedAt: string;
}

interface EditLetter {
  id: string;
  to: string;
  subject: string;
  content: string;
  backgroundColor: string;
}

interface WritePageProps {
  letterToEdit?: EditLetter | null;
  onClearEdit?: () => void;
}

export function WritePage({ letterToEdit, onClearEdit }: WritePageProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#fafaf8');
  const [customColor, setCustomColor] = useState('#fafaf8');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<string>('');
  const [showCircleDialog, setShowCircleDialog] = useState(false);
  const [showDraftsDialog, setShowDraftsDialog] = useState(false);
  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [draftToLoad, setDraftToLoad] = useState<Draft | null>(null);
  const [daysUntilDrop, setDaysUntilDrop] = useState(5);

  const [drafts, setDrafts] = useState<Draft[]>([
    {
      id: '1',
      to: 'Sarah',
      subject: 'Thinking of you',
      content: 'Hey Sarah, I was thinking about our conversation last week...',
      backgroundColor: '#fef3e2',
      savedAt: '2 hours ago',
    },
    {
      id: '2',
      to: 'Book Club Circle',
      subject: 'This month\'s pick',
      content: 'Everyone! I have thoughts about the ending...',
      backgroundColor: '#e8f4f8',
      savedAt: '1 day ago',
    },
  ]);

  const colorPalettes = [
    { name: 'Classic Paper', color: '#fafaf8' },
    { name: 'Warm Cream', color: '#fef3e2' },
    { name: 'Soft Blue', color: '#e8f4f8' },
    { name: 'Gentle Pink', color: '#f8e8f4' },
    { name: 'Mint Fresh', color: '#e8f8f0' },
    { name: 'Lavender Dreams', color: '#f0e8f8' },
  ];

  const allPrompts = [
    "Convince your friend that pigeons are actually government drones",
    "Write a manifesto about why cereal is a soup",
    "Describe your last embarrassing moment as if it were a dramatic movie scene",
    "Explain your life philosophy using only food metaphors",
    "Write a conspiracy theory about your local coffee shop",
    "Describe what you think your pet would say about you behind your back",
    "Write a dramatic breakup letter to your alarm clock",
    "Pitch an absurd business idea you'd actually invest in",
    "Roast yourself gently but hilariously",
    "Write about a mundane task as if it's an epic quest",
    "Explain why socks disappearing in the laundry is actually time travel",
    "Write a letter as if you're a medieval knight reporting on modern technology",
    "Convince someone that their houseplant is secretly judging them",
  ];

  // Select 2-3 random prompts on component mount
  const [displayedPrompts] = useState(() => {
    const shuffled = [...allPrompts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.floor(Math.random() * 2) + 2); // 2 or 3 prompts
  });

  // Load letter to edit when it changes
  useEffect(() => {
    if (letterToEdit) {
      setTo(letterToEdit.to);
      setSubject(letterToEdit.subject);
      setContent(letterToEdit.content);
      setBackgroundColor(letterToEdit.backgroundColor);
      toast.success('Letter loaded for editing');
      if (onClearEdit) {
        onClearEdit();
      }
    }
  }, [letterToEdit, onClearEdit]);

  const handleSaveDraft = () => {
    const newDraft: Draft = {
      id: Date.now().toString(),
      to: to || selectedCircle || 'Untitled',
      subject: subject || 'No subject',
      content,
      backgroundColor,
      savedAt: 'Just now',
    };
    setDrafts([newDraft, ...drafts]);
    toast.success('Draft saved!');
  };

  const handleLoadDraft = (draft: Draft) => {
    if (content || to || subject) {
      setDraftToLoad(draft);
      setShowSaveWarning(true);
    } else {
      loadDraft(draft);
    }
  };

  const loadDraft = (draft: Draft) => {
    setTo(draft.to);
    setSubject(draft.subject);
    setContent(draft.content);
    setBackgroundColor(draft.backgroundColor);
    setShowDraftsDialog(false);
    toast.success('Draft loaded!');
  };

  const handleSaveAndLoad = () => {
    handleSaveDraft();
    if (draftToLoad) {
      loadDraft(draftToLoad);
    }
    setShowSaveWarning(false);
  };

  const handleReplaceWithDraft = () => {
    if (draftToLoad) {
      loadDraft(draftToLoad);
    }
    setShowSaveWarning(false);
  };

  const handleSend = () => {
    if (!to && !selectedCircle) {
      toast.error('Please select a recipient');
      return;
    }
    if (!subject) {
      toast.error('Please add a subject');
      return;
    }
    if (!content) {
      toast.error('Please write your letter');
      return;
    }
    toast.success('Letter scheduled for next drop!');
    setTo('');
    setSubject('');
    setContent('');
    setSelectedCircle('');
  };

  const handleUseCircle = (circle: Circle) => {
    setSelectedCircle(circle.name);
    setTo((circle.memberEmails ?? []).join(', '));
    setShowCircleDialog(false);
  };

  // Calculate countdown
  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const diffTime = nextMonth.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysUntilDrop(diffDays);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-tight text-foreground mb-2">
            Write a Letter
          </h1>
          <p className="text-muted-foreground">
            Your letter will be delivered on the 1st of next month
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 paper-texture shadow-vintage border border-border">
              <div className="relative z-10 space-y-4">
                {/* Recipients */}
                <div className="space-y-2">
                  <Label>To</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter recipient names separated by commas"
                      value={to}
                      onChange={(e) => {
                        setTo(e.target.value);
                        setSelectedCircle('');
                      }}
                      className="bg-input-background border-border flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowCircleDialog(true)}
                      className="flex-shrink-0"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Circles
                    </Button>
                  </div>
                  {selectedCircle && (
                    <Badge className="bg-accent/20 text-accent-foreground">
                      Circle: {selectedCircle}
                    </Badge>
                  )}
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="What's your letter about?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-input-background border-border"
                  />
                </div>

                {/* Background Color */}
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {colorPalettes.map((palette) => (
                      <button
                        key={palette.name}
                        onClick={() => setBackgroundColor(palette.color)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          backgroundColor === palette.color
                            ? 'border-foreground scale-110'
                            : 'border-border hover:scale-105'
                        }`}
                        style={{ backgroundColor: palette.color }}
                        title={palette.name}
                      />
                    ))}
                    <button
                      onClick={() => setShowColorPicker(true)}
                      className="w-10 h-10 rounded-lg border-2 border-border hover:scale-105 transition-all flex items-center justify-center bg-gradient-to-br from-red-200 via-yellow-200 to-blue-200"
                      title="Custom color"
                    >
                      <Palette className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Letter Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Your Letter</Label>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsBold(!isBold)}
                        className={isBold ? 'bg-secondary' : ''}
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsItalic(!isItalic)}
                        className={isItalic ? 'bg-secondary' : ''}
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div
                    className="rounded-lg lined-paper p-6 min-h-[400px]"
                    style={{ backgroundColor }}
                  >
                    <Textarea
                      placeholder="Dear friend,&#10;&#10;Write your letter here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[380px] bg-transparent border-none focus-visible:ring-0 resize-none font-serif"
                      style={{
                        fontWeight: isBold ? 'bold' : 'normal',
                        fontStyle: isItalic ? 'italic' : 'normal',
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleSaveDraft}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button onClick={handleSend} className="bg-primary text-primary-foreground">
                    <Send className="w-4 h-4 mr-2" />
                    Send Letter
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Countdown Banner */}
            <Card className="p-4 paper-texture shadow-vintage border border-accent/30 bg-gradient-to-r from-accent/10 to-accent/5">
              <div className="relative z-10 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-foreground" />
                <p className="text-sm text-foreground font-mono text-center">
                  Next drop in <span className="font-medium">{daysUntilDrop} days</span>
                </p>
              </div>
            </Card>

            {/* Drafts */}
            <Card className="p-6 paper-texture shadow-vintage border border-border">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg">Drafts</h3>
                  <Badge>{drafts.length}</Badge>
                </div>
                {drafts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved drafts</p>
                ) : (
                  <div className="space-y-2">
                    {drafts.slice(0, 3).map((draft) => (
                      <button
                        key={draft.id}
                        onClick={() => handleLoadDraft(draft)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                      >
                        <p className="text-sm font-medium truncate">{draft.subject}</p>
                        <p className="text-xs text-muted-foreground">To: {draft.to}</p>
                        <p className="text-xs text-muted-foreground">{draft.savedAt}</p>
                      </button>
                    ))}
                    {drafts.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowDraftsDialog(true)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View all {drafts.length} drafts
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Writing Prompts */}
            <Card className="p-6 paper-texture shadow-vintage border border-border">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-accent-foreground" />
                  <h3 className="font-display text-lg">Writing Prompts</h3>
                </div>
                <div className="space-y-3">
                  {displayedPrompts.map((prompt, index) => (
                    <p key={index} className="text-sm text-muted-foreground leading-relaxed p-3 bg-secondary/30 rounded-lg border border-border">
                      {prompt}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Reload page for new prompts
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <CircleManager
        open={showCircleDialog}
        onOpenChange={setShowCircleDialog}
        onUse={handleUseCircle}
        onDeleted={(circle) => {
          if (selectedCircle === circle.name) {
            setSelectedCircle('');
          }
        }}
      />

      {/* All Drafts Dialog */}
      <Dialog open={showDraftsDialog} onOpenChange={setShowDraftsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">All Drafts</DialogTitle>
            <DialogDescription>
              Select a draft to continue writing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {drafts.map((draft) => (
              <button
                key={draft.id}
                onClick={() => handleLoadDraft(draft)}
                className="w-full text-left p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
              >
                <h4 className="font-medium mb-1">{draft.subject}</h4>
                <p className="text-sm text-muted-foreground mb-2">To: {draft.to}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{draft.content}</p>
                <p className="text-xs text-muted-foreground mt-2">Saved {draft.savedAt}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Warning Dialog */}
      <AlertDialog open={showSaveWarning} onOpenChange={setShowSaveWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to save your current letter as a draft before loading this one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleReplaceWithDraft}>
              Replace without saving
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndLoad}>
              Save current & load draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Custom Color Picker Dialog */}
      <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Custom Background Color</DialogTitle>
            <DialogDescription>
              Choose any color for your letter background
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>RGB Color Picker</Label>
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-full h-24 rounded-lg cursor-pointer"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowColorPicker(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setBackgroundColor(customColor);
                  setShowColorPicker(false);
                }}
                className="flex-1"
              >
                Apply Color
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
