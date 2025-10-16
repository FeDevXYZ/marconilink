import { Users, BookOpen, Video, FileText } from "lucide-react";
import { motion } from "motion/react";

interface StatsBarProps {
  stats: {
    todayVisits: number;
    totalNotes: number;
    totalVideos: number;
    totalPosts: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  const statsData = [
    { icon: Users, label: "Visitatori oggi", value: stats.todayVisits.toString(), color: "text-blue-500" },
    { icon: BookOpen, label: "Appunti", value: stats.totalNotes.toString(), color: "text-purple-500" },
    { icon: Video, label: "Video", value: stats.totalVideos.toString(), color: "text-pink-500" },
    { icon: FileText, label: "Contenuti totali", value: stats.totalPosts.toString(), color: "text-green-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
      {statsData.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="backdrop-blur-lg bg-white/30 dark:bg-slate-800/60 border border-white/30 dark:border-slate-700/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl bg-white/50 dark:bg-slate-700/60 ${stat.color}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</span>
                <span className="text-foreground text-sm sm:text-base">{stat.value}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
