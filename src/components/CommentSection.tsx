import { useState } from "react";
import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send, Trash2, X } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAvatarForUser } from '../utils/avatarUtils';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  replyTo?: string;
  replyToUserName?: string;
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  currentUserId: string;
  userProfile: any;
  onCommentAdded: (comment: Comment) => void;
  onCommentDeleted: (commentId: string) => void;
}

export function CommentSection({ postId, comments, currentUserId, userProfile, onCommentAdded, onCommentDeleted }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Scrivi qualcosa prima di commentare!');
      return;
    }

    // Optimistic update - crea commento locale immediatamente
    const userName = userProfile?.name && userProfile?.surname 
      ? `${userProfile.name} ${userProfile.surname}`
      : 'Utente';

    const optimisticComment: Comment = {
      id: `temp_${Date.now()}`,
      userId: currentUserId,
      userName,
      userAvatar: getAvatarForUser(currentUserId, userProfile?.avatarIndex),
      content: newComment.trim(),
      timestamp: new Date().toISOString(),
      replyTo: replyingTo?.id,
      replyToUserName: replyingTo?.userName,
    };

    // Mostra immediatamente
    onCommentAdded(optimisticComment);
    setNewComment('');
    setReplyingTo(null);

    // Sincronizza con il database in background
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/posts/${postId}/comment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userId: currentUserId,
            content: optimisticComment.content,
            replyTo: optimisticComment.replyTo,
            replyToUserName: optimisticComment.replyToUserName,
          }),
        }
      );

      if (!response.ok) {
        // Rollback in caso di errore
        onCommentDeleted(optimisticComment.id);
        toast.error('Errore nell\'aggiunta del commento');
      }
    } catch (error) {
      // Rollback in caso di errore
      onCommentDeleted(optimisticComment.id);
      console.error('Error adding comment:', error);
      toast.error('Errore nell\'aggiunta del commento');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string, comment: Comment) => {
    if (!confirm('Vuoi eliminare questo commento?')) return;

    // Optimistic update - rimuovi immediatamente
    onCommentDeleted(commentId);
    toast.success('Commento eliminato');

    // Sincronizza con il database in background
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/posts/${postId}/comment/${commentId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ userId: currentUserId }),
        }
      );

      if (!response.ok) {
        // Rollback in caso di errore
        onCommentAdded(comment);
        toast.error('Errore nell\'eliminazione del commento');
      }
    } catch (error) {
      // Rollback in caso di errore
      onCommentAdded(comment);
      console.error('Error deleting comment:', error);
      toast.error('Errore nell\'eliminazione del commento');
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  // Ordina commenti in modo intelligente
  const sortedComments = React.useMemo(() => {
    if (!comments || comments.length === 0) return [];

    // Separa commenti principali e risposte
    const mainComments = comments.filter(c => !c.replyTo);
    const replies = comments.filter(c => c.replyTo);

    // Ordina commenti principali cronologicamente
    mainComments.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Costruisci l'array finale
    const result: Comment[] = [];
    for (const mainComment of mainComments) {
      result.push(mainComment);
      
      // Trova risposte dirette a questo commento
      const directReplies = replies.filter(r => r.replyTo === mainComment.id);
      // Ordina risposte cronologicamente
      directReplies.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      result.push(...directReplies);
    }

    return result;
  }, [comments]);

  return (
    <div className="space-y-4">
      {/* Comments list */}
      {sortedComments.length > 0 && (
        <div className="space-y-3">
          {sortedComments.map((comment) => (
            <div key={comment.id} className={`flex gap-3 p-3 bg-white/50 dark:bg-slate-700/60 rounded-lg ${comment.replyTo ? 'ml-6 border-l-2 border-primary/30' : ''}`}>
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={comment.userAvatar} />
                <AvatarFallback>{comment.userName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate">{comment.userName}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(comment.timestamp)}
                    </span>
                    {comment.userId === currentUserId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id, comment)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                {comment.replyToUserName && (
                  <p className="text-xs text-primary/70 mt-0.5">
                    ↳ risposta a {comment.replyToUserName}
                  </p>
                )}
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words hyphens-auto" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {comment.content}
                </p>
                <button
                  onClick={() => setReplyingTo(comment)}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Rispondi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      <div className="space-y-2">
        {replyingTo && (
          <div className="flex items-center gap-2 text-sm bg-primary/10 dark:bg-primary/20 px-3 py-2 rounded-lg">
            <span className="text-primary dark:text-sky-400">Rispondendo a {replyingTo.userName}</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder={replyingTo ? `Rispondi a ${replyingTo.userName}...` : "Scrivi un commento..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            className="bg-white/60 border-white/40 resize-none min-h-[60px]"
          />
          <Button
            onClick={handleAddComment}
            disabled={loading || !newComment.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
