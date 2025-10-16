import { useState, useEffect } from "react";
import { Moon, Sun, Search, User, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Switch } from "./ui/switch";
import { getAvatarForUser } from "../utils/avatarUtils";
import { motion } from "motion/react";
import schoolLogo from "figma:asset/ec2842f91873b96d63f3f307280eb892eb2c1bd8.png";
import marconiLinkLogo from "figma:asset/de4cb319ac4d8bd84174960c19570c5926e0a0d5.png";

interface HeaderProps {
  userProfile?: { name: string; surname: string; avatarIndex?: number; userId?: string } | null;
  appName: string;
  appSubtitle: string;
  onCreatePost: () => void;
  onProfileClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ userProfile, appName, appSubtitle, onCreatePost, onProfileClick, searchQuery, onSearchChange }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Controlla il tema di sistema al caricamento
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('marconilink_theme');
    
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDark(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('marconilink_theme', newIsDark ? 'dark' : 'light');
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const displayName = userProfile?.name && userProfile?.surname 
    ? `${userProfile.name} ${userProfile.surname}`
    : 'Utente';
  
  const initials = userProfile?.name && userProfile?.surname
    ? `${userProfile.name[0]}${userProfile.surname[0]}`
    : 'U';

  const avatarUrl = getAvatarForUser(userProfile?.userId || '', userProfile?.avatarIndex);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/20 dark:bg-slate-900/40 border-b border-white/30 dark:border-slate-700/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo e nome */}
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <img 
                src={schoolLogo} 
                alt="IC G. Marconi" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-lg"
              />
              <img 
                src={marconiLinkLogo} 
                alt="Marconi Link" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-lg hidden sm:block"
              />
            </motion.div>
            <div className="flex flex-col">
              <span className="tracking-tight text-foreground text-sm sm:text-base">{appName}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">{appSubtitle}</span>
            </div>
          </div>

          {/* Search bar - nascosta su mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca appunti, video, progetti..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-white/60 backdrop-blur-sm border-white/40 focus:bg-white/80 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full hover:bg-white/40 dark:hover:bg-slate-700/40 transition-all w-8 h-8 sm:w-10 sm:h-10"
            >
              {isDark ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>

            <Button
              onClick={onCreatePost}
              className="hidden sm:flex gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 dark:from-sky-500 dark:to-blue-600 text-white shadow-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Condividi</span>
            </Button>

            <Button
              onClick={onCreatePost}
              size="icon"
              className="sm:hidden bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 dark:from-sky-500 dark:to-blue-600 text-white shadow-lg w-8 h-8"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>

            <Avatar 
              onClick={onProfileClick}
              className="w-8 h-8 sm:w-9 sm:h-9 border-2 border-white/50 shadow-lg cursor-pointer hover:border-primary transition-all"
            >
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Search bar mobile */}
        <div className="md:hidden pb-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Cerca contenuti..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-white/60 backdrop-blur-sm border-white/40 h-9 text-sm"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
