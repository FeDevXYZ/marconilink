import { Heart, MessageCircle, Download, Paperclip, Edit2, Trash2, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { motion } from "motion/react";

interface FeedCardProps {
  id: string;
  type: "annunci" | "appunti" | "video" | "progetti" | "comunicazioni";
  title: string;
  content: string;
  materia?: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: "admin" | "student";
  };
  timestamp: string;
  likes: number;
  comments: number;
  attachments?: { name: string; size: string; url: string }[];
  thumbnail?: string;
  isLiked?: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
  onClick?: () => void;
  onLike?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const typeConfig = {
  annunci: { label: "Annuncio", color: "bg-orange-500" },
  comunicazioni: { label: "Comunicazione", color: "bg-red-500" },
  appunti: { label: "Appunti", color: "bg-blue-500" },
  video: { label: "Video", color: "bg-purple-500" },
  progetti: { label: "Progetto", color: "bg-green-500" },
};

export function FeedCard({
  type,
  title,
  content,
  materia,
  author,
  timestamp,
  likes,
  comments,
  attachments,
  thumbnail,
  isLiked = false,
  currentUserId,
  isAdmin = false,
  onClick,
  onLike,
  onEdit,
  onDelete,
}: FeedCardProps) {
  const config = typeConfig[type];

  // Truncate content for preview
  const truncatedContent = content.length > 200 
    ? content.substring(0, 200) + '...' 
    : content;

  const isOwnPost = currentUserId === author.id;
  const canEdit = isOwnPost || isAdmin;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="backdrop-blur-lg bg-white/30 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/50 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {/* Header */}
      <div className="p-3 sm:p-4 lg:p-5 pb-2 sm:pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-white/50 shrink-0">
              <AvatarImage src={author.avatar} />
              <AvatarFallback>{author.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-foreground text-sm sm:text-base truncate">{author.name}</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground">{timestamp}</span>
                {author.role === "admin" && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1.5 sm:gap-2 items-start shrink-0">
            <Badge className={`${config.color} text-white border-0 text-[10px] sm:text-xs px-1.5 sm:px-2`}>
              {config.label}
            </Badge>
            {materia && materia !== 'Generale' && (
              <Badge variant="outline" className="border-primary/30 text-primary text-[10px] sm:text-xs px-1.5 sm:px-2 hidden sm:inline-flex">
                {materia}
              </Badge>
            )}
            {canEdit && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-md hover:bg-white/40 dark:hover:bg-slate-700/40 flex items-center justify-center transition-colors"
                  >
                    <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="backdrop-blur-xl bg-white/95 dark:bg-slate-800/95 border-white/40 dark:border-slate-700/50">
                  <DropdownMenuItem 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onEdit?.(); 
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Modifica
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onDelete?.(); 
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 lg:px-5">
        <h3 className="mb-1.5 sm:mb-2 text-foreground text-sm sm:text-base lg:text-lg break-words overflow-wrap-anywhere line-clamp-2 hyphens-auto" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{title}</h3>
        <p className="text-muted-foreground mb-2 sm:mb-3 text-xs sm:text-sm break-words overflow-wrap-anywhere hyphens-auto" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{truncatedContent}</p>

        {/* Thumbnail se presente */}
        {thumbnail && (
          <div className="mb-2 sm:mb-3 rounded-lg sm:rounded-xl overflow-hidden border border-white/30">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-32 sm:h-40 lg:h-48 object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
            {attachments.slice(0, 2).map((attachment, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 sm:p-2.5 lg:p-3 bg-white/40 rounded-lg border border-white/30 hover:bg-white/60 transition-all cursor-pointer"
              >
                <Paperclip className="w-3 h-3 sm:w-4 sm:h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs sm:text-sm">{attachment.name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{attachment.size}</p>
                </div>
                <Download className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground hover:text-primary transition-colors shrink-0" />
              </div>
            ))}
            {attachments.length > 2 && (
              <p className="text-xs text-muted-foreground px-2">
                +{attachments.length - 2} altri allegati
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 border-t border-white/20 dark:border-slate-700/50 bg-white/10 dark:bg-slate-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onLike?.();
              }}
              className="flex items-center gap-1 sm:gap-1.5 group"
            >
              <Heart
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-all group-hover:scale-110 ${
                  isLiked ? "fill-destructive text-destructive" : "text-muted-foreground group-hover:text-destructive"
                }`}
              />
              <span className="text-xs sm:text-sm text-muted-foreground">{likes}</span>
            </button>
            <button className="flex items-center gap-1 sm:gap-1.5 group">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:scale-110" />
              <span className="text-xs sm:text-sm text-muted-foreground">{comments}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
