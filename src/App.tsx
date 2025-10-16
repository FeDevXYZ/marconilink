// ========== CONFIGURAZIONE ==========
const ADMIN_CODE = "J"; // Codice admin per pubblicare annunci
const SUPERADMIN_CODE = "SUPERADMIN2024"; // Codice super admin (vede tutto e può modificare/eliminare tutto)

// Testi personalizzabili
const APP_NAME = "Marconi Link";
const APP_SUBTITLE = "I.C. Pace del Mela";
const WELCOME_TITLE = "Benvenuto su Marconi Link 👋";
const WELCOME_DESCRIPTION = "La piattaforma di condivisione risorse per studenti e docenti dell'I.C. Pace del Mela. Scopri, condividi e impara insieme alla tua comunità scolastica.";
const FOOTER_TEXT = "Marconi Link - Scopri, condividi e impara.";
const FOOTER_SUBTITLE = "Questa piattaforma non è di proprietà dell'Istituto Comprensivo Pace del Mela, è un iniziativa di noi studenti.";

import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { FilterBar } from "./components/FilterBar";
import { FeedCard } from "./components/FeedCard";
import { StatsBar } from "./components/StatsBar";
import { ProfileDialog } from "./components/ProfileDialog";
import { CreatePostDialog } from "./components/CreatePostDialog";
import { PostDetailDialog } from "./components/PostDetailDialog";
import { EditPostDialog } from "./components/EditPostDialog";
import { LeaderboardDialog } from "./components/LeaderboardDialog";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from './utils/supabase/info';

type FilterType = "all" | "annunci" | "appunti" | "video" | "progetti" | "leaderboard";

export default function App() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [editPostDialogOpen, setEditPostDialogOpen] = useState(false);
  const [leaderboardDialogOpen, setLeaderboardDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postToEdit, setPostToEdit] = useState<any>(null);
  
  // User state
  const [userId] = useState(() => {
    let id = localStorage.getItem('marconilink_userId');
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('marconilink_userId', id);
    }
    return id;
  });
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ todayVisits: 0, totalPosts: 0, totalVideos: 0, totalNotes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
    trackVisit();
  }, []);

  useEffect(() => {
    if (userProfile) {
      loadPosts();
      loadStats();
    }
  }, [userProfile]);

  // Auto-refresh ogni 10 secondi
  useEffect(() => {
    if (!userProfile) return;

    const intervalId = setInterval(() => {
      // Refresh silenzioso in background (silent = true)
      loadPosts(true);
      loadStats();
    }, 10000); // 10 secondi

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]); // userId è nella closure, non serve nelle dipendenze

  const trackVisit = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/visit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ userId, date: today }),
        }
      );
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/stats`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/user/profile/${userId}`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
        
        // Show profile dialog if user hasn't set name/surname yet
        if (!profile.name || !profile.surname) {
          setProfileDialogOpen(true);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Errore nel caricamento del profilo');
    }
  };

  const loadPosts = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/posts/${userId}`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        if (!silent) {
          toast.error('Errore nel caricamento dei post');
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      if (!silent) {
        toast.error('Errore nel caricamento dei post');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleLike = async (postId: string) => {
    // Optimistic update - aggiorna immediatamente il client
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const wasLiked = post.isLiked;
    const newLiked = !wasLiked;
    const newLikes = wasLiked ? post.likes - 1 : post.likes + 1;

    // Update immediato dello stato locale
    setPosts(posts.map(p => 
      p.id === postId 
        ? { ...p, isLiked: newLiked, likes: newLikes }
        : p
    ));

    // Update selected post if open
    if (selectedPost?.id === postId) {
      setSelectedPost({ ...selectedPost, isLiked: newLiked, likes: newLikes });
    }

    // Sincronizza con il database in background
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/posts/${postId}/like`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        // Rollback in caso di errore
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, isLiked: wasLiked, likes: post.likes }
            : p
        ));
        if (selectedPost?.id === postId) {
          setSelectedPost({ ...selectedPost, isLiked: wasLiked, likes: post.likes });
        }
        toast.error('Errore nel like del post');
      }
    } catch (error) {
      // Rollback in caso di errore
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, isLiked: wasLiked, likes: post.likes }
          : p
      ));
      if (selectedPost?.id === postId) {
        setSelectedPost({ ...selectedPost, isLiked: wasLiked, likes: post.likes });
      }
      console.error('Error toggling like:', error);
      toast.error('Errore nel like del post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo post?')) return;

    // Ottimistic update - rimuovi immediatamente dal client
    const deletedPost = posts.find(p => p.id === postId);
    setPosts(posts.filter(p => p.id !== postId));
    setSelectedPost(null);
    toast.success('Post eliminato');

    // Sincronizza con il database in background
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/posts/${postId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        loadStats(); // Aggiorna le statistiche
      } else {
        // Rollback in caso di errore
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete error:', errorData);
        if (deletedPost) {
          setPosts(prevPosts => [deletedPost, ...prevPosts]);
        }
        toast.error(`Errore nell'eliminazione: ${errorData.error || 'Permesso negato'}`);
      }
    } catch (error) {
      // Rollback in caso di errore
      if (deletedPost) {
        setPosts(prevPosts => [deletedPost, ...prevPosts]);
      }
      console.error('Error deleting post:', error);
      toast.error('Errore nell\'eliminazione del post');
    }
  };

  const handleEditPost = (post: any) => {
    setPostToEdit(post);
    setSelectedPost(null);
    setEditPostDialogOpen(true);
  };

  const handlePostUpdated = (updatedPost: any) => {
    // Optimistic update - aggiorna immediatamente il client
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
    if (selectedPost?.id === updatedPost.id) {
      setSelectedPost(updatedPost);
    }
  };

  const handlePostCreated = (newPost: any) => {
    // Optimistic update - aggiungi immediatamente al feed
    setPosts([newPost, ...posts]);
    toast.success('Post pubblicato!');
  };

  const handlePostsRefresh = () => {
    // Refresh manuale (con loading)
    loadPosts(false);
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minuto' : 'minuti'} fa`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'ora' : 'ore'} fa`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'} fa`;
    
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isAdmin = userProfile?.codes?.includes(ADMIN_CODE) || false;
  const isSuperAdmin = userProfile?.codes?.includes(SUPERADMIN_CODE) || false;

  // Filter and search
  const filteredFeed = posts
    .filter(item => {
      // SuperAdmin vede tutti i post
      if (isSuperAdmin) return true;
      
      // Filtro per categoria
      return activeFilter === "all" || activeFilter === "leaderboard" || item.type === activeFilter;
    })
    .filter(item => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.author.name.toLowerCase().includes(query) ||
        (item.materia && item.materia.toLowerCase().includes(query))
      );
    });

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" />
      
      <Header 
        userProfile={userProfile ? { ...userProfile, userId } : null}
        onCreatePost={() => setCreatePostDialogOpen(true)}
        onProfileClick={() => setProfileDialogOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Welcome Section */}
        <div className="mb-4 sm:mb-6 lg:mb-8 backdrop-blur-lg bg-white/25 dark:bg-slate-800/25 border border-white/30 dark:border-slate-700/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
          <h1 className="text-foreground mb-1 sm:mb-2 text-xl sm:text-2xl lg:text-3xl">
            {WELCOME_TITLE}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {WELCOME_DESCRIPTION}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-4 sm:mb-6">
          <StatsBar stats={stats} />
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6">
          <FilterBar 
            activeFilter={activeFilter} 
            onFilterChange={setActiveFilter}
            onLeaderboardClick={() => setLeaderboardDialogOpen(true)}
          />
        </div>

        {/* Feed */}
        {loading ? (
          <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center shadow-lg">
            <p className="text-muted-foreground text-sm sm:text-base">Caricamento...</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {filteredFeed.length > 0 ? (
              filteredFeed.map(item => (
                <FeedCard 
                  key={item.id} 
                  {...item}
                  timestamp={formatTimestamp(item.timestamp)}
                  onClick={() => setSelectedPost(item)}
                  onLike={() => handleLike(item.id)}
                  currentUserId={userId}
                  isAdmin={isAdmin || isSuperAdmin}
                  onEdit={() => handleEditPost(item)}
                  onDelete={() => handleDeletePost(item.id)}
                />
              ))
            ) : (
              <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center shadow-lg">
                <p className="text-muted-foreground text-sm sm:text-base">
                  {searchQuery ? 'Nessun risultato trovato per la tua ricerca.' : 'Nessun contenuto trovato per questa categoria.'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 sm:mt-12 lg:mt-16 py-4 sm:py-6 lg:py-8 backdrop-blur-lg bg-white/20 dark:bg-slate-900/20 border-t border-white/30 dark:border-slate-700/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">
            {FOOTER_TEXT}
          </p>
          <p className="text-muted-foreground text-xs mt-1 sm:mt-2">
            {FOOTER_SUBTITLE}
          </p>
        </div>
      </footer>

      {/* Dialogs */}
      <ProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        userId={userId}
        adminCode={ADMIN_CODE}
        onProfileUpdate={() => {
          loadUserProfile();
          loadPosts();
        }}
      />

      <CreatePostDialog
        open={createPostDialogOpen}
        onOpenChange={setCreatePostDialogOpen}
        userId={userId}
        userProfile={userProfile}
        userCodes={userProfile?.codes || []}
        adminCode={ADMIN_CODE}
        onPostCreated={handlePostCreated}
        onPostSynced={() => loadStats()}
      />

      <EditPostDialog
        open={editPostDialogOpen}
        onOpenChange={setEditPostDialogOpen}
        post={postToEdit}
        userId={userId}
        userCodes={userProfile?.codes || []}
        adminCode={ADMIN_CODE}
        onPostUpdated={(updatedPost) => {
          handlePostUpdated(updatedPost);
          setPostToEdit(null);
        }}
      />

      {selectedPost && (
        <PostDetailDialog
          open={!!selectedPost}
          onOpenChange={(open) => !open && setSelectedPost(null)}
          post={{
            ...selectedPost,
            timestamp: formatTimestamp(selectedPost.timestamp),
          }}
          currentUserId={userId}
          userProfile={userProfile}
          isAdmin={isAdmin || isSuperAdmin}
          isSuperAdmin={isSuperAdmin}
          onLike={() => handleLike(selectedPost.id)}
          onEdit={() => handleEditPost(selectedPost)}
          onDelete={() => handleDeletePost(selectedPost.id)}
          onPostUpdated={(updatedPost) => {
            setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
            setSelectedPost(updatedPost);
          }}
        />
      )}

      <LeaderboardDialog
        open={leaderboardDialogOpen}
        onOpenChange={setLeaderboardDialogOpen}
      />
    </div>
  );
}
