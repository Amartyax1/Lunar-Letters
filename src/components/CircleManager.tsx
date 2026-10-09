import { useEffect, useState } from 'react';
import { Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
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
import {
  deleteCircle,
  listCircles,
  saveCircle,
  type Circle,
} from '../lib/mailbox';

interface CircleManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUse: (circle: Circle) => void;
  onDeleted?: (circle: Circle) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function daysUntilFirst() {
  const today = new Date();
  const nextFirst = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return Math.ceil((nextFirst.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function parseMemberEmails(raw: string) {
  const tokens = raw
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const emails: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    const email = token.toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      invalid.push(token);
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
  }

  return { emails, invalid };
}

export function CircleManager({ open, onOpenChange, onUse, onDeleted }: CircleManagerProps) {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Circle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [emailsText, setEmailsText] = useState('');
  const [formError, setFormError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Circle | null>(null);
  const [daysUntilDrop, setDaysUntilDrop] = useState(daysUntilFirst);

  const loadCircles = async () => {
    setLoading(true);
    try {
      const next = await listCircles();
      setCircles(Array.isArray(next) ? next : []);
    } catch (error) {
      setCircles([]);
      toast.error(errorMessage(error, 'Could not load circles'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setDaysUntilDrop(daysUntilFirst());
    setShowForm(false);
    setEditing(null);
    setFormError('');
    void loadCircles();
  }, [open]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setEmailsText('');
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (circle: Circle) => {
    setEditing(circle);
    setName(circle.name);
    setEmailsText((circle.memberEmails ?? []).join('\n'));
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Give the circle a name.');
      return;
    }

    const { emails, invalid } = parseMemberEmails(emailsText);
    if (invalid.length > 0) {
      setFormError(`These are not emails: ${invalid.join(', ')}`);
      return;
    }
    if (emails.length === 0) {
      setFormError('Add at least one member email.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      await saveCircle({
        id: editing?.id,
        name: trimmedName,
        memberEmails: emails,
      });
      toast.success(editing ? 'Circle updated' : 'Circle created');
      setShowForm(false);
      setEditing(null);
      await loadCircles();
    } catch (error) {
      const message = errorMessage(error, 'Could not save this circle');
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setSaving(true);
    try {
      await deleteCircle(target.id);
      toast.success('Circle deleted');
      setPendingDelete(null);
      onDeleted?.(target);
      await loadCircles();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete this circle'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {showForm ? (editing ? 'Edit circle' : 'New circle') : 'Circles'}
            </DialogTitle>
            <DialogDescription>
              {showForm
                ? 'Rename the circle and update who receives the letter.'
                : 'Send one letter to a whole group. It goes out on the 1st.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-2 rounded-lg border border-accent/30 bg-gradient-to-r from-accent/10 to-accent/5 px-3 py-2">
            <Clock className="w-4 h-4 text-foreground" />
            <p className="text-sm font-mono text-foreground">
              Next drop in <span className="font-medium">{daysUntilDrop} days</span> — the 1st
            </p>
          </div>

          {showForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="circle-name">Name</Label>
                <Input
                  id="circle-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Book Club"
                  className="bg-input-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="circle-emails">Member emails</Label>
                <Textarea
                  id="circle-emails"
                  value={emailsText}
                  onChange={(event) => setEmailsText(event.target.value)}
                  placeholder={'sarah@example.com\nmarcus@example.com'}
                  className="bg-input-background border-border"
                  style={{ minHeight: '8rem' }}
                />
                <p className="text-xs text-muted-foreground">
                  One email per line, or separate them with commas.
                </p>
              </div>
              {formError && (
                <p className="text-sm" style={{ color: 'var(--destructive)' }}>{formError}</p>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormError('');
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={() => void handleSave()} disabled={saving}>
                  {editing ? 'Save changes' : 'Create circle'}
                </Button>
              </div>
            </div>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Loading circles…</p>
          ) : circles.length === 0 ? (
            <div className="rounded-lg border border-border px-4 py-8 text-center space-y-3">
              <p className="font-medium">No circles yet</p>
              <p className="text-sm text-muted-foreground">
                Create a circle when you want one letter to reach several people on the 1st.
              </p>
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create a circle
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  New circle
                </Button>
              </div>
              {circles.map((circle) => {
                const emails = circle.memberEmails ?? [];
                return (
                  <div
                    key={circle.id}
                    className="rounded-lg border border-border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-medium">{circle.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {emails.length > 0 ? emails.join(', ') : 'No member emails'}
                        </p>
                      </div>
                      <Badge>{emails.length} {emails.length === 1 ? 'member' : 'members'}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => onUse(circle)}
                      >
                        Use this circle
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(circle)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPendingDelete(circle)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(next) => !next && setPendingDelete(null)}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the circle and its member emails. You can create it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={saving}
            >
              Delete circle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
