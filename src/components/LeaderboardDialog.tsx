import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface LeaderboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string;
  postCount: number;
}

export function LeaderboardDialog({ open, onOpenChange }: LeaderboardDialogProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadLeaderboard();
    }
  }, [open]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/leaderboard`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground">#{position + 1}</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-white/40 dark:border-slate-700/50 shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Classifica Creatori
          </DialogTitle>
          <DialogDescription>
            I migliori contributori della community
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>Caricamento...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>Nessun contenuto ancora pubblicato</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl transition-all
                    ${index < 3 ? 'bg-gradient-to-r from-white/60 to-white/40 dark:from-slate-700/60 dark:to-slate-800/40' : 'bg-white/40 dark:bg-slate-800/50'}
                    hover:bg-white/60 dark:hover:bg-slate-700/60
                  `}
                >
                  <div className="shrink-0">
                    {getMedalIcon(index)}
                  </div>
                  
                  <Avatar className="w-10 h-10 border-2 border-white/50">
                    <AvatarImage src={entry.avatar} />
                    <AvatarFallback>{entry.name[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="truncate">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.postCount} {entry.postCount === 1 ? 'contenuto' : 'contenuti'}
                    </p>
                  </div>

                  <Badge variant="secondary" className="shrink-0">
                    {entry.postCount}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
