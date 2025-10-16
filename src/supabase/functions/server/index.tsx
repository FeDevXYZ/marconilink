import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import * as kv from "./kv_store.tsx";

// Avatar URLs - deve corrispondere a quello nel frontend
const CUSTOM_AVATAR_URLS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
  "https://api.dicebear.com/7.x/bottts/svg?seed=user3",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=user4",
  "https://api.dicebear.com/7.x/micah/svg?seed=user5",
  "https://api.dicebear.com/7.x/personas/svg?seed=user6",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=user7",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=user8",
  "https://api.dicebear.com/7.x/bottts/svg?seed=user9",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=user10",
  "https://api.dicebear.com/7.x/micah/svg?seed=user11",
  "https://api.dicebear.com/7.x/personas/svg?seed=user12",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=user13",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=user14",
  "https://api.dicebear.com/7.x/bottts/svg?seed=user15",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=user16",
  "https://api.dicebear.com/7.x/micah/svg?seed=user17",
  "https://api.dicebear.com/7.x/personas/svg?seed=user18",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=user19",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=user20",
  "https://api.dicebear.com/7.x/bottts/svg?seed=user21",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=user22",
  "https://api.dicebear.com/7.x/micah/svg?seed=user23",
  "https://api.dicebear.com/7.x/personas/svg?seed=user24",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=user25",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=user26",
  "https://api.dicebear.com/7.x/bottts/svg?seed=user27",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=user28",
  "https://api.dicebear.com/7.x/micah/svg?seed=user29",
  "https://api.dicebear.com/7.x/personas/svg?seed=user30",
];

function getAvatarUrl(avatarIndex: number): string {
  if (avatarIndex >= 0 && avatarIndex < CUSTOM_AVATAR_URLS.length) {
    return CUSTOM_AVATAR_URLS[avatarIndex];
  }
  return CUSTOM_AVATAR_URLS[0];
}

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase Storage on startup
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Create storage bucket if it doesn't exist
const bucketName = 'make-0e1ba11c-attachments';
const { data: buckets } = await supabase.storage.listBuckets();
const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
if (!bucketExists) {
  await supabase.storage.createBucket(bucketName, { public: false });
  console.log(`Created storage bucket: ${bucketName}`);
}

// Health check endpoint
app.get("/make-server-0e1ba11c/health", (c) => {
  return c.json({ status: "ok" });
});

// Track visit
app.post("/make-server-0e1ba11c/visit", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, date } = body;
    
    const visitKey = `visit:${date}:${userId}`;
    await kv.set(visitKey, true);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error tracking visit:', error);
    return c.json({ error: 'Failed to track visit' }, 500);
  }
});

// Get stats
app.get("/make-server-0e1ba11c/stats", async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const visitKeys = await kv.getByPrefix(`visit:${today}:`);
    const todayVisits = visitKeys.length;
    
    const postsList = await kv.get('posts:list') || [];
    let totalNotes = 0;
    let totalVideos = 0;
    
    for (const postId of postsList) {
      const post = await kv.get(`post:${postId}`);
      if (post) {
        if (post.type === 'appunti') totalNotes++;
        if (post.type === 'video') totalVideos++;
      }
    }
    
    return c.json({
      todayVisits,
      totalNotes,
      totalVideos,
      totalPosts: postsList.length,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Get leaderboard
app.get("/make-server-0e1ba11c/leaderboard", async (c) => {
  try {
    const postsList = await kv.get('posts:list') || [];
    const userPostCounts = new Map<string, { name: string; avatar: string; count: number }>();
    
    for (const postId of postsList) {
      const post = await kv.get(`post:${postId}`);
      if (post && post.type !== 'annunci' && post.type !== 'comunicazioni') {
        const userId = post.author.id;
        const existing = userPostCounts.get(userId);
        
        if (existing) {
          existing.count++;
        } else {
          userPostCounts.set(userId, {
            name: post.author.name,
            avatar: post.author.avatar,
            count: 1,
          });
        }
      }
    }
    
    const leaderboard = Array.from(userPostCounts.entries())
      .map(([userId, data]) => ({
        userId,
        name: data.name,
        avatar: data.avatar,
        postCount: data.count,
      }))
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 20); // Top 20
    
    return c.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return c.json({ error: 'Failed to fetch leaderboard' }, 500);
  }
});

// Get or create user profile
app.get("/make-server-0e1ba11c/user/profile/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const profile = await kv.get(`user:${userId}`);
    
    if (!profile) {
      // Create default profile
      const defaultProfile = {
        userId,
        name: '',
        surname: '',
        avatarIndex: 0,
        codes: [],
        createdAt: new Date().toISOString(),
      };
      await kv.set(`user:${userId}`, defaultProfile);
      return c.json(defaultProfile);
    }
    
    return c.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Update user profile
app.post("/make-server-0e1ba11c/user/profile", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, name, surname, avatarIndex, codes } = body;
    
    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }
    
    const profile = {
      userId,
      name: name || '',
      surname: surname || '',
      avatarIndex: avatarIndex ?? 0,
      codes: codes || [],
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`user:${userId}`, profile);
    return c.json(profile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Create new post
app.post("/make-server-0e1ba11c/posts", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, type, title, content, materia, attachments, codiceCategoria, isAdmin } = body;
    
    if (!userId || !type || !title || !content) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Get user profile
    const userProfile = await kv.get(`user:${userId}`);
    const authorName = userProfile?.name && userProfile?.surname 
      ? `${userProfile.name} ${userProfile.surname}`
      : 'Utente';
    
    const avatarIndex = userProfile?.avatarIndex ?? 0;
    
    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const post = {
      id: postId,
      type,
      title,
      content,
      materia: materia || 'Generale',
      author: {
        id: userId,
        name: authorName,
        avatar: getAvatarUrl(avatarIndex),
        role: isAdmin ? 'admin' : 'student',
      },
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      attachments: attachments || [],
      codiceCategoria: codiceCategoria || null,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`post:${postId}`, post);
    
    // Add to posts list
    const allPosts = await kv.get('posts:list') || [];
    allPosts.unshift(postId);
    await kv.set('posts:list', allPosts);
    
    return c.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return c.json({ error: 'Failed to create post' }, 500);
  }
});

// Get all posts (filtered by user codes)
app.get("/make-server-0e1ba11c/posts/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const userProfile = await kv.get(`user:${userId}`);
    const userCodes = userProfile?.codes || [];
    const isSuperAdmin = userCodes.includes('SUPERADMIN2024');
    
    const postsList = await kv.get('posts:list') || [];
    const posts = [];
    
    for (const postId of postsList) {
      const post = await kv.get(`post:${postId}`);
      if (post) {
        // SuperAdmin vede tutti i post
        // Altri utenti vedono solo i post senza codice o con codice che possiedono
        if (isSuperAdmin || !post.codiceCategoria || userCodes.includes(post.codiceCategoria)) {
          // Check if user liked this post
          const liked = await kv.get(`like:${postId}:${userId}`);
          // Get comments count
          const comments = await kv.get(`comments:${postId}`) || [];
          posts.push({ ...post, isLiked: !!liked, comments: comments.length });
        }
      }
    }
    
    return c.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return c.json({ error: 'Failed to fetch posts' }, 500);
  }
});

// Update post
app.put("/make-server-0e1ba11c/posts/:postId", async (c) => {
  try {
    const postId = c.req.param('postId');
    const body = await c.req.json();
    const { userId, title, content, materia } = body;
    
    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    // Check if user is owner or admin
    const userProfile = await kv.get(`user:${userId}`);
    const isAdmin = userProfile?.codes?.includes('J'); // ADMIN_CODE
    
    if (post.author.id !== userId && !isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    post.title = title;
    post.content = content;
    post.materia = materia;
    post.updatedAt = new Date().toISOString();
    
    await kv.set(`post:${postId}`, post);
    
    return c.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    return c.json({ error: 'Failed to update post' }, 500);
  }
});

// Delete post
app.delete("/make-server-0e1ba11c/posts/:postId", async (c) => {
  try {
    const postId = c.req.param('postId');
    const body = await c.req.json();
    const { userId } = body;
    
    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    // Check if user is owner or admin
    const userProfile = await kv.get(`user:${userId}`);
    const isAdmin = userProfile?.codes?.includes('J'); // ADMIN_CODE
    
    if (post.author.id !== userId && !isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    // Delete post
    await kv.del(`post:${postId}`);
    
    // Remove from posts list
    const postsList = await kv.get('posts:list') || [];
    const updatedList = postsList.filter((id: string) => id !== postId);
    await kv.set('posts:list', updatedList);
    
    // Delete associated data
    await kv.del(`comments:${postId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return c.json({ error: 'Failed to delete post' }, 500);
  }
});

// Toggle like on post
app.post("/make-server-0e1ba11c/posts/:postId/like", async (c) => {
  try {
    const postId = c.req.param('postId');
    const body = await c.req.json();
    const { userId } = body;
    
    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }
    
    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    const likeKey = `like:${postId}:${userId}`;
    const isLiked = await kv.get(likeKey);
    
    if (isLiked) {
      // Unlike
      await kv.del(likeKey);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // Like
      await kv.set(likeKey, true);
      post.likes += 1;
    }
    
    await kv.set(`post:${postId}`, post);
    
    return c.json({ liked: !isLiked, likes: post.likes });
  } catch (error) {
    console.error('Error toggling like:', error);
    return c.json({ error: 'Failed to toggle like' }, 500);
  }
});

// Get comments for a post
app.get("/make-server-0e1ba11c/posts/:postId/comments", async (c) => {
  try {
    const postId = c.req.param('postId');
    const comments = await kv.get(`comments:${postId}`) || [];
    return c.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return c.json({ error: 'Failed to fetch comments' }, 500);
  }
});

// Add comment to post
app.post("/make-server-0e1ba11c/posts/:postId/comment", async (c) => {
  try {
    const postId = c.req.param('postId');
    const body = await c.req.json();
    const { userId, content, replyTo, replyToUserName } = body;
    
    if (!userId || !content) {
      return c.json({ error: 'userId and content are required' }, 400);
    }
    
    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    // Get user profile
    const userProfile = await kv.get(`user:${userId}`);
    const userName = userProfile?.name && userProfile?.surname 
      ? `${userProfile.name} ${userProfile.surname}`
      : 'Utente';
    
    const avatarIndex = userProfile?.avatarIndex ?? 0;
    
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const comment = {
      id: commentId,
      userId,
      userName,
      userAvatar: getAvatarUrl(avatarIndex),
      content,
      timestamp: new Date().toISOString(),
      replyTo: replyTo || null,
      replyToUserName: replyToUserName || null,
    };
    
    const comments = await kv.get(`comments:${postId}`) || [];
    comments.push(comment);
    await kv.set(`comments:${postId}`, comments);
    
    // Update post comments count
    post.comments = comments.length;
    await kv.set(`post:${postId}`, post);
    
    return c.json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    return c.json({ error: 'Failed to add comment' }, 500);
  }
});

// Delete comment
app.delete("/make-server-0e1ba11c/posts/:postId/comment/:commentId", async (c) => {
  try {
    const postId = c.req.param('postId');
    const commentId = c.req.param('commentId');
    const body = await c.req.json();
    const { userId } = body;
    
    const comments = await kv.get(`comments:${postId}`) || [];
    const comment = comments.find((c: any) => c.id === commentId);
    
    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404);
    }
    
    if (comment.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const updatedComments = comments.filter((c: any) => c.id !== commentId);
    await kv.set(`comments:${postId}`, updatedComments);
    
    // Update post comments count
    const post = await kv.get(`post:${postId}`);
    if (post) {
      post.comments = updatedComments.length;
      await kv.set(`post:${postId}`, post);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return c.json({ error: 'Failed to delete comment' }, 500);
  }
});

// Upload attachment
app.post("/make-server-0e1ba11c/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    const fileName = `${Date.now()}_${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });
    
    if (error) {
      console.error('Upload error:', error);
      return c.json({ error: 'Failed to upload file' }, 500);
    }
    
    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year
    
    return c.json({
      name: file.name,
      url: signedUrlData?.signedUrl,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

Deno.serve(app.fetch);
