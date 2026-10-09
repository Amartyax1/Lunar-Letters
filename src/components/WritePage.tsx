import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
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
import { Bold, Italic, Save, Send, Palette, Users, FileText, Sparkles, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner@2.0.3';
import { CircleManager } from './CircleManager';
import {
  listCircles,
  listDrafts,
  saveDraft,
  scheduleLetter,
  type Circle,
  type Letter,
  type LetterInput,
} from '../lib/mailbox';

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

function plainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function toEditorHtml(body: string) {
  if (!body) return '';
  if (/<[a-z][\s\S]*>/i.test(body)) return body;
  return body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function formatSavedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDelivery(iso: string | null) {
  if (!iso) return 'the next 1st';
  const date = new Date(iso.includes('T') ? iso : `${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return 'the next 1st';
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function WritePage({ letterToEdit, onClearEdit }: WritePageProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const pendingRecipient = useRef<string | null>(null);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#fafaf8');
  const [customColor, setCustomColor] = useState('#fafaf8');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState('');
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>();
  const [showCircleDialog, setShowCircleDialog] = useState(false);
  const [showDraftsDialog, setShowDraftsDialog] = useState(false);
  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [draftToLoad, setDraftToLoad] = useState<Letter | null>(null);
  const [daysUntilDrop, setDaysUntilDrop] = useState(5);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Letter[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);

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

  const [displayedPrompts] = useState(() => {
    const shuffled = [...allPrompts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.floor(Math.random() * 2) + 2);
  });

  const savedDrafts = drafts.filter((letter) => letter.status === 'draft');

  const writeEditor = (html: string) => {
    setContent(html);
    if (editorRef.current && editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html;
    }
  };

  const refreshDrafts = async () => {
    setDrafts(await listDrafts());
  };

  const refreshCircles = async () => {
    setCircles(await listCircles());
  };

  useEffect(() => {
    let active = true;
    listDrafts()
      .then((saved) => {
        if (active) setDrafts(saved);
      })
      .catch((error) => {
        if (active) toast.error(errorMessage(error, 'Could not load drafts'));
      });
    listCircles()
      .then((available) => {
        if (active) setCircles(available);
      })
      .catch((error) => {
        if (active) toast.error(errorMessage(error, 'Could not load circles'));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!letterToEdit) return;
    setTo(letterToEdit.to);
    setSubject(letterToEdit.subject);
    writeEditor(toEditorHtml(letterToEdit.content));
    setBackgroundColor(letterToEdit.backgroundColor);
    setSelectedCircle('');
    setSelectedCircleId(null);
    setActiveDraftId(undefined);
    pendingRecipient.current = letterToEdit.to;
    toast.success('Letter loaded for editing');
    onClearEdit?.();
  }, [letterToEdit, onClearEdit]);

  useEffect(() => {
    const recipient = pendingRecipient.current;
    if (!recipient || circles.length === 0) return;
    const match = circles.find(
      (circle) =>
        circle.name === recipient ||
        (circle.memberEmails ?? []).join(', ') === recipient,
    );
    if (!match) return;
    setSelectedCircle(match.name);
    setSelectedCircleId(match.id);
    pendingRecipient.current = null;
  }, [circles]);

  useEffect(() => {
    if (!selectedCircleId || selectedCircle) return;
    const match = circles.find((circle) => circle.id === selectedCircleId);
    if (!match) return;
    setSelectedCircle(match.name);
    setTo((match.memberEmails ?? []).join(', '));
  }, [circles, selectedCircleId, selectedCircle]);

  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const diffTime = nextMonth.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysUntilDrop(diffDays);
  }, []);

  useEffect(() => {
    const updateFormatState = () => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection?.anchorNode || !editor.contains(selection.anchorNode)) {
        setBoldActive(false);
        setItalicActive(false);
        return;
      }
      try {
        setBoldActive(document.queryCommandState('bold'));
        setItalicActive(document.queryCommandState('italic'));
      } catch {
        setBoldActive(false);
        setItalicActive(false);
      }
    };
    document.addEventListener('selectionchange', updateFormatState);
    return () => document.removeEventListener('selectionchange', updateFormatState);
  }, []);

  const circleLabel = (id: string | null) => {
    if (!id) return 'No circle';
    return circles.find((circle) => circle.id === id)?.name ?? 'Circle';
  };

  const currentBody = () => editorRef.current?.innerHTML ?? content;

  const persistDraft = async () => {
    const input: LetterInput = {
      ...(activeDraftId ? { id: activeDraftId } : {}),
      circleId: selectedCircleId,
      title: subject.trim() || 'No subject',
      body: currentBody(),
      paperColor: backgroundColor,
    };
    const saved = await saveDraft(input);
    setActiveDraftId(saved.id);
    await refreshDrafts();
    return saved;
  };

  const handleSaveDraft = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await persistDraft();
      toast.success('Draft saved!');
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save draft'));
    } finally {
      setBusy(false);
    }
  };

  const loadDraft = (draft: Letter) => {
    const circle = circles.find((item) => item.id === draft.circleId);
    setSelectedCircleId(draft.circleId);
    setSelectedCircle(circle?.name ?? '');
    setTo(circle ? (circle.memberEmails ?? []).join(', ') : '');
    setSubject(draft.title);
    writeEditor(toEditorHtml(draft.body));
    setBackgroundColor(draft.paperColor);
    setActiveDraftId(draft.id);
    setShowDraftsDialog(false);
    toast.success('Draft loaded!');
  };

  const handleLoadDraft = (draft: Letter) => {
    if (plainText(currentBody()) || to || subject) {
      setDraftToLoad(draft);
      setShowSaveWarning(true);
      return;
    }
    loadDraft(draft);
  };

  const handleSaveAndLoad = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await persistDraft();
      if (draftToLoad) loadDraft(draftToLoad);
      setShowSaveWarning(false);
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save draft'));
    } finally {
      setBusy(false);
    }
  };

  const handleReplaceWithDraft = () => {
    if (draftToLoad) loadDraft(draftToLoad);
    setShowSaveWarning(false);
  };

  const clearComposer = () => {
    setTo('');
    setSubject('');
    setSelectedCircle('');
    setSelectedCircleId(null);
    setActiveDraftId(undefined);
    writeEditor('');
  };

  const handleSend = async () => {
    if (busy) return;
    if (!to && !selectedCircle) {
      toast.error('Please select a recipient');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please add a subject');
      return;
    }
    if (!plainText(currentBody())) {
      toast.error('Please write your letter');
      return;
    }
    setBusy(true);
    try {
      const saved = await persistDraft();
      const scheduled = await scheduleLetter(saved.id);
      await refreshDrafts();
      toast.success(`Letter scheduled for ${formatDelivery(scheduled.scheduledFor)}`);
      clearComposer();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not schedule letter'));
    } finally {
      setBusy(false);
    }
  };

  const handleUseCircle = (circle: Circle) => {
    setSelectedCircle(circle.name);
    setSelectedCircleId(circle.id);
    setTo((circle.memberEmails ?? []).join(', '));
    setShowCircleDialog(false);
  };

  const applyFormat = (command: 'bold' | 'italic') => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
      toast.error('Select the text you want to format');
      return;
    }
    const anchor = selection.anchorNode;
    if (!anchor || !editor.contains(anchor)) {
      toast.error('Select the text you want to format');
      return;
    }
    const range = selection.getRangeAt(0);
    editor.focus();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand(command);
    setContent(editor.innerHTML);
  };

  const showPlaceholder = plainText(content).length === 0;

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
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 paper-texture shadow-vintage border border-border">
              <div className="relative z-10 space-y-4">
                <div className="space-y-2">
                  <Label>To</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter recipient names separated by commas"
                      value={to}
                      onChange={(e) => {
                        setTo(e.target.value);
                        setSelectedCircle('');
                        setSelectedCircleId(null);
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

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="What's your letter about?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-input-background border-border"
                  />
                </div>

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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Your Letter</Label>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="Bold"
                        aria-pressed={boldActive}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applyFormat('bold')}
                        className={boldActive ? 'bg-secondary' : ''}
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="Italic"
                        aria-pressed={italicActive}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applyFormat('italic')}
                        className={italicActive ? 'bg-secondary' : ''}
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div
                    className="rounded-lg lined-paper p-6 min-h-[400px]"
                    style={{ backgroundColor }}
                  >
                    <div className="relative">
                      {showPlaceholder && (
                        <p className="pointer-events-none absolute inset-0 text-muted-foreground font-serif whitespace-pre-wrap">
                          {'Dear friend,\n\nWrite your letter here...'}
                        </p>
                      )}
                      <div
                        ref={editorRef}
                        role="textbox"
                        aria-multiline="true"
                        aria-label="Letter body"
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(event) => setContent(event.currentTarget.innerHTML)}
                        className="relative min-h-[380px] bg-transparent border-none focus-visible:ring-0 font-serif text-base leading-relaxed outline-none [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleSaveDraft} disabled={busy}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button onClick={handleSend} disabled={busy} className="bg-primary text-primary-foreground">
                    <Send className="w-4 h-4 mr-2" />
                    Send Letter
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4 paper-texture shadow-vintage border border-accent/30 bg-gradient-to-r from-accent/10 to-accent/5">
              <div className="relative z-10 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-foreground" />
                <p className="text-sm text-foreground font-mono text-center">
                  Next drop in <span className="font-medium">{daysUntilDrop} days</span>
                </p>
              </div>
            </Card>

            <Card className="p-6 paper-texture shadow-vintage border border-border">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg">Drafts</h3>
                  <Badge>{savedDrafts.length}</Badge>
                </div>
                {savedDrafts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved drafts</p>
                ) : (
                  <div className="space-y-2">
                    {savedDrafts.slice(0, 3).map((draft) => (
                      <button
                        key={draft.id}
                        onClick={() => handleLoadDraft(draft)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                      >
                        <p className="text-sm font-medium truncate">{draft.title}</p>
                        <p className="text-xs text-muted-foreground">To: {circleLabel(draft.circleId)}</p>
                        <p className="text-xs text-muted-foreground">{formatSavedAt(draft.updatedAt)}</p>
                      </button>
                    ))}
                    {savedDrafts.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowDraftsDialog(true)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View all {savedDrafts.length} drafts
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>

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
        onOpenChange={(open) => {
          setShowCircleDialog(open);
          if (!open) {
            refreshCircles().catch((error) => {
              toast.error(errorMessage(error, 'Could not load circles'));
            });
          }
        }}
        onUse={handleUseCircle}
        onDeleted={(circle) => {
          if (selectedCircle === circle.name || selectedCircleId === circle.id) {
            setSelectedCircle('');
            setSelectedCircleId(null);
          }
        }}
      />

      <Dialog open={showDraftsDialog} onOpenChange={setShowDraftsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">All Drafts</DialogTitle>
            <DialogDescription>
              Select a draft to continue writing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {savedDrafts.map((draft) => (
              <button
                key={draft.id}
                onClick={() => handleLoadDraft(draft)}
                className="w-full text-left p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
              >
                <h4 className="font-medium mb-1">{draft.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">To: {circleLabel(draft.circleId)}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{plainText(draft.body)}</p>
                <p className="text-xs text-muted-foreground mt-2">Saved {formatSavedAt(draft.updatedAt)}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
