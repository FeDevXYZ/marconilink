import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Upload, X, FileText, Image as ImageIcon, Video, Music, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAvatarForUser } from '../utils/avatarUtils';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userProfile: any;
  userCodes: string[];
  adminCode: string;
  onPostCreated: (post: any) => void;
  onPostSynced?: () => void;
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

export function CreatePostDialog({ open, onOpenChange, userId, userProfile, userCodes, adminCode, onPostCreated, onPostSynced }: CreatePostDialogProps) {
  const [type, setType] = useState<string>('appunti');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [materia, setMateria] = useState('Generale');
  const [codiceCategoria, setCodiceCategoria] = useState('');
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; type: string; size: number }>>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasAdminCode = userCodes.includes(adminCode);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    if (attachments.length + files.length > 5) {
      toast.error('Puoi caricare massimo 5 allegati');
      return;
    }

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/upload`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAttachments(prev => [...prev, data]);
        } else {
          toast.error(`Errore nel caricamento di ${file.name}`);
        }
      }
      toast.success('Allegati caricati con successo!');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Errore nel caricamento degli allegati');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (type.startsWith('audio/')) return <Music className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Titolo e contenuto sono obbligatori');
      return;
    }

    if ((type === 'annunci' || type === 'comunicazioni') && !hasAdminCode) {
      toast.error(`Devi avere il codice ${adminCode} per postare annunci e comunicazioni`);
      return;
    }

    // Crea il post ottimistico immediatamente
    const authorName = userProfile?.name && userProfile?.surname 
      ? `${userProfile.name} ${userProfile.surname}`
      : 'Utente';
    
    const optimisticPost = {
      id: `temp_${Date.now()}`,
      type,
      title: title.trim(),
      content: content.trim(),
      materia,
      author: {
        id: userId,
        name: authorName,
        avatar: getAvatarForUser(userId, userProfile?.avatarIndex),
        role: hasAdminCode && (type === 'annunci' || type === 'comunicazioni') ? 'admin' : 'student',
      },
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      attachments: attachments.map(a => ({
        name: a.name,
        url: a.url,
        type: a.type,
        size: formatFileSize(a.size),
      })),
      codiceCategoria: codiceCategoria.trim().toUpperCase() || null,
      isLiked: false,
      _optimistic: true, // Flag per identificare post ottimistici
    };

    // Mostra immediatamente nel feed
    onPostCreated(optimisticPost);
    resetForm();
    onOpenChange(false);

    // Sincronizza con il database in background
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/posts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userId,
            type,
            title: title.trim(),
            content: content.trim(),
            materia,
            attachments: attachments.map(a => ({
              name: a.name,
              url: a.url,
              type: a.type,
              size: formatFileSize(a.size),
            })),
            codiceCategoria: codiceCategoria.trim().toUpperCase() || null,
            isAdmin: hasAdminCode && (type === 'annunci' || type === 'comunicazioni'),
          }),
        }
      );

      if (response.ok) {
        onPostSynced?.(); // Aggiorna stats
      } else {
        toast.error('Errore nel salvataggio del post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Errore nel salvataggio del post');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType('appunti');
    setTitle('');
    setContent('');
    setMateria('Generale');
    setCodiceCategoria('');
    setAttachments([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-white/40 dark:border-slate-700/50 shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Condividi un contenuto</DialogTitle>
          <DialogDescription>
            Crea un nuovo post con allegati e seleziona la materia
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo di contenuto *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-white/60 border-white/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appunti">Appunti</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="progetti">Progetto</SelectItem>
                {hasAdminCode && <SelectItem value="annunci">Annuncio</SelectItem>}
                {hasAdminCode && <SelectItem value="comunicazioni">Comunicazione</SelectItem>}
              </SelectContent>
            </Select>
          </div>

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
              placeholder="Descrivi il contenuto che vuoi condividere..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="bg-white/60 border-white/40 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codice">Codice categoria (facoltativo)</Label>
            <Input
              id="codice"
              placeholder="Es: CLASSE3A"
              value={codiceCategoria}
              onChange={(e) => setCodiceCategoria(e.target.value.toUpperCase())}
              className="bg-white/60 border-white/40"
            />
            <p className="text-xs text-muted-foreground">
              Solo gli utenti con questo codice potranno vedere il post. Lascia vuoto per rendere il post visibile a tutti.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Allegati (massimo 5)</Label>
            <div className="border-2 border-dashed border-white/40 dark:border-slate-600/50 rounded-lg p-6 text-center bg-white/30 dark:bg-slate-800/40">
              <input
                type="file"
                id="file-upload"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading || attachments.length >= 5}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Caricamento...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clicca per caricare immagini, video, audio, documenti...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attachments.length}/5 allegati
                    </p>
                  </div>
                )}
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2 mt-3">
                {attachments.map((attachment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 bg-white/60 dark:bg-slate-700/60 rounded-lg border border-white/30 dark:border-slate-600/50"
                  >
                    {getFileIcon(attachment.type)}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                    </div>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t border-white/20">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={loading || uploading}>
            {loading ? 'Pubblicazione...' : 'Pubblica'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
