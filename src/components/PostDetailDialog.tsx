import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Heart, MessageCircle, Download, Paperclip, X, Edit2, Trash2 } from "lucide-react";
import { CommentSection } from "./CommentSection";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface PostDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    type: "annunci" | "appunti" | "video" | "progetti" | "comunicazioni";
    title: string;
    content: string;
    materia?: string;
    codiceCategoria?: string;
    author: {
      id: string;
      name: string;
      avatar: string;
      role: "admin" | "student";
    };
    timestamp: string;
    likes: number;
    comments: number;
    commentsData?: any[];
    attachments?: { name: string; size: string; url: string }[];
    thumbnail?: string;
    isLiked?: boolean;
  };
  currentUserId: string;
  userProfile: any;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  onLike?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPostUpdated?: (post: any) => void;
}

const typeConfig = {
  annunci: { label: "Annuncio", color: "bg-orange-500" },
  comunicazioni: { label: "Comunicazione", color: "bg-red-500" },
  appunti: { label: "Appunti", color: "bg-blue-500" },
  video: { label: "Video", color: "bg-purple-500" },
  progetti: { label: "Progetto", color: "bg-green-500" },
};

export function PostDetailDialog({ open, onOpenChange, post, currentUserId, userProfile, isAdmin = false, isSuperAdmin = false, onLike, onEdit, onDelete, onPostUpdated }: PostDetailDialogProps) {
  const [commentsData, setCommentsData] = useState<any[]>([]);
  const config = typeConfig[post.type];
  const isOwnPost = currentUserId === post.author.id;
  const canEdit = isOwnPost || isAdmin;

  const handleDeleteAllComments = async () => {
    if (!confirm('ATTENZIONE: Vuoi eliminare TUTTI i commenti di questo post?')) return;
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/posts/${post.id}/comments/deleteAll`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ userId: currentUserId }),
        }
      );

      if (response.ok) {
        setCommentsData([]);
        const updatedPost = { ...post, comments: 0 };
        onPostUpdated?.(updatedPost);
        alert('Tutti i commenti eliminati');
      }
    } catch (error) {
      console.error('Error deleting all comments:', error);
      alert('Errore');
    }
  };

  useEffect(() => {
    if (open && post.id) {
      loadComments();
    }
  }, [open, post.id]);

  const loadComments = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/posts/${post.id}/comments`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCommentsData(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleCommentAdded = (newComment: any) => {
    // Optimistic update - aggiungi immediatamente il commento
    setCommentsData([...commentsData, newComment]);
    
    // Aggiorna il contatore commenti nel post
    const updatedPost = { ...post, comments: commentsData.length + 1 };
    onPostUpdated?.(updatedPost);
  };

  const handleCommentDeleted = (commentId: string) => {
    // Optimistic update - rimuovi immediatamente il commento
    setCommentsData(commentsData.filter(c => c.id !== commentId));
    
    // Aggiorna il contatore commenti nel post
    const updatedPost = { ...post, comments: commentsData.length - 1 };
    onPostUpdated?.(updatedPost);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-white/40 dark:border-slate-700/40 shadow-2xl max-w-3xl max-h-[90vh] p-0">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>{post.title}</DialogTitle>
            <DialogDescription>Visualizza i dettagli completi del post</DialogDescription>
          </DialogHeader>
        </VisuallyHidden>

        <div className="max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-12">
                <Avatar className="w-12 h-12 border-2 border-white/50 shrink-0">
                  <AvatarImage src={post.author.avatar} />
                  <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-foreground truncate">{post.author.name}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">{post.timestamp}</span>
                    {post.author.role === "admin" && (
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Badge className={`${config.color} text-white border-0`}>
                  {config.label}
                </Badge>
                {post.materia && post.materia !== 'Generale' && (
                  <Badge variant="outline" className="border-primary/30 text-primary hidden sm:inline-flex">
                    {post.materia}
                  </Badge>
                )}
              </div>
            </div>

            {/* Dev Tools for SuperAdmin */}
            {isSuperAdmin && (
              <div className="mb-4 p-3 bg-red-900/20 dark:bg-red-900/30 border border-red-500/30 rounded text-xs font-mono">
                <div className="text-red-600 dark:text-red-400 mb-2">🔧 DEV MODE</div>
                <div className="space-y-1 text-foreground/70">
                  <div>Post ID: {post.id}</div>
                  <div>Author ID: {post.author.id}</div>
                  <div>Codice Categoria: {post.codiceCategoria || 'Nessuno (pubblico)'}</div>
                  <div>Likes: {post.likes} | Comments: {commentsData.length}</div>
                </div>
                <button
                  onClick={handleDeleteAllComments}
                  className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                >
                  🗑️ Elimina tutti i commenti
                </button>
              </div>
            )}

            {/* Content */}
            <div className="space-y-4">
              <h2 className="text-foreground break-words overflow-wrap-anywhere hyphens-auto" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{post.title}</h2>
              
              {/* Thumbnail se presente */}
              {post.thumbnail && (
                <div className="rounded-xl overflow-hidden border border-white/30">
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full max-h-96 object-cover"
                  />
                </div>
              )}

              <p className="text-foreground whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere hyphens-auto" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {post.content}
              </p>

              {/* Attachments */}
              {post.attachments && post.attachments.length > 0 && (
                <div className="space-y-2 pt-4">
                  <h4 className="flex items-center gap-2 text-muted-foreground">
                    <Paperclip className="w-4 h-4" />
                    Allegati ({post.attachments.length})
                  </h4>
                  {post.attachments.map((attachment, idx) => (
                    <a
                      key={idx}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-white/60 rounded-lg border border-white/30 hover:bg-white/80 transition-all group"
                    >
                      <Paperclip className="w-4 h-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm group-hover:text-primary transition-colors">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{attachment.size}</p>
                      </div>
                      <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/20">
              <div className="flex items-center gap-4">
                <button onClick={onLike} className="flex items-center gap-1.5 group">
                  <Heart
                    className={`w-6 h-6 transition-all group-hover:scale-110 ${
                      post.isLiked ? "fill-destructive text-destructive" : "text-muted-foreground group-hover:text-destructive"
                    }`}
                  />
                  <span className="text-foreground">{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 group">
                  <MessageCircle className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-all group-hover:scale-110" />
                  <span className="text-foreground">{commentsData.length}</span>
                </button>
              </div>
              {canEdit && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={onEdit}>
                    <Edit2 className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="pt-6 mt-6 border-t border-white/20 dark:border-slate-700/50">
              <h4 className="mb-4">Commenti</h4>
              <CommentSection
                postId={post.id}
                comments={commentsData}
                currentUserId={currentUserId}
                userProfile={userProfile}
                onCommentAdded={handleCommentAdded}
                onCommentDeleted={handleCommentDeleted}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
