import { useState } from "react";
import { Badge } from "./ui/badge";
import { BookOpen, Video, FileText, Megaphone, FolderOpen, Trophy } from "lucide-react";

type FilterType = "all" | "annunci" | "appunti" | "video" | "progetti" | "leaderboard";

interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onLeaderboardClick?: () => void;
}

export function FilterBar({ activeFilter, onFilterChange, onLeaderboardClick }: FilterBarProps) {
  const filters = [
    { id: "all" as FilterType, label: "Tutto", icon: FolderOpen },
    { id: "annunci" as FilterType, label: "Annunci", icon: Megaphone },
    { id: "appunti" as FilterType, label: "Appunti", icon: BookOpen },
    { id: "video" as FilterType, label: "Video", icon: Video },
    { id: "progetti" as FilterType, label: "Progetti", icon: FileText },
    { id: "leaderboard" as FilterType, label: "Classifica", icon: Trophy },
  ];

  return (
    <div className="backdrop-blur-lg bg-white/20 dark:bg-slate-800/20 border border-white/30 dark:border-slate-700/30 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 shadow-lg">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          
          return (
            <button
              key={filter.id}
              onClick={() => {
                if (filter.id === 'leaderboard') {
                  onLeaderboardClick?.();
                } else {
                  onFilterChange(filter.id);
                }
              }}
              className={`
                flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm
                ${filter.id === 'leaderboard'
                  ? "bg-gradient-to-r from-yellow-400 to-amber-500 dark:from-yellow-600 dark:to-amber-700 text-white shadow-lg hover:scale-105"
                  : isActive
                    ? "bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-500 dark:to-blue-600 text-white shadow-lg scale-105"
                    : "bg-white/40 dark:bg-slate-700/60 hover:bg-white/60 dark:hover:bg-slate-600/70 text-foreground hover:scale-105"
                }
              `}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{filter.label}</span>
              <span className="sm:hidden">{filter.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
