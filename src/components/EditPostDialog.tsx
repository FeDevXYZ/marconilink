import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: any;
  userId: string;
  userCodes: string[];
  adminCode: string;
  onPostUpdated: (post: any) => void;
}

const MATERIE = [
  "Italiano",
  "Matematica",
  "Storia",
  "Geografia",
  "Scienze",
  "Inglese",
  "Arte",
  "Musica",
  "Educazione Fisica",
  "Tecnologia",
  "Generale",
];

export function EditPostDialog({ open, onOpenChange, post, userId, userCodes, adminCode, onPostUpdated }: EditPostDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [materia, setMateria] = useState('Generale');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setMateria(post.materia || 'Generale');
    }
  }, [post]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Titolo e contenuto sono obbligatori');
      return;
    }

    // Optimistic update - aggiorna immediatamente
    const updatedPost = {
      ...post,
      title: title.trim(),
      content: content.trim(),
      materia,
      updatedAt: new Date().toISOString(),
    };

    onPostUpdated(updatedPost);
    onOpenChange(false);
    toast.success('Post aggiornato!');

    // Sincronizza con il database in background
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/posts/${post.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userId,
            title: title.trim(),
            content: content.trim(),
            materia,
          }),
        }
      );

      if (!response.ok) {
        // Rollback in caso di errore
        onPostUpdated(post);
        toast.error('Errore nell\'aggiornamento del post');
      }
    } catch (error) {
      // Rollback in caso di errore
      onPostUpdated(post);
      console.error('Error updating post:', error);
      toast.error('Errore nell\'aggiornamento del post');
    } finally {
      setLoading(false);
    }
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-white/40 dark:border-slate-700/50 shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica post</DialogTitle>
          <DialogDescription>
            Modifica titolo, contenuto e materia del tuo post
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="materia">Materia</Label>
            <Select value={materia} onValueChange={setMateria}>
              <SelectTrigger className="bg-white/60 border-white/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATERIE.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              placeholder="Inserisci un titolo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/60 border-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenuto *</Label>
            <Textarea
              id="content"
              placeholder="Descrivi il contenuto..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="bg-white/60 border-white/40 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t border-white/20">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvataggio...' : 'Salva modifiche'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
