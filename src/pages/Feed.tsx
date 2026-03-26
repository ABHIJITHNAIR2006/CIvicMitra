import { useEffect, useState, useCallback, memo } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error-handler";
import DashboardLayout from "../layouts/DashboardLayout";
import { Completion } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Image as ImageIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "react-hot-toast";

// Cache for user profiles to avoid redundant fetches
const userCache: Record<string, any> = {};

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "completions"), orderBy("submittedAt", "desc"), limit(20));
    
    const unsubscribe = onSnapshot(q, async (snap) => {
      const postData = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data() as Completion;
        const userId = data.userId;

        // Use cached user data if available
        let userData = userCache[userId];
        if (!userData) {
          const userSnap = await getDoc(doc(db, "users", userId));
          userData = userSnap.exists() ? userSnap.data() : null;
          if (userData) userCache[userId] = userData;
        }
        
        return { 
          id: d.id, 
          ...data, 
          username: userData?.username || "eco_warrior", 
          userAvatar: userData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.userId}` 
        };
      }));
      setPosts(postData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "completions");
    });

    return unsubscribe;
  }, []);

  const handleCreatePost = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !auth.currentUser) return;

    setIsPosting(true);
    try {
      const postData = {
        userId: auth.currentUser.uid,
        challengeId: "community-update",
        proofUrl: `https://picsum.photos/seed/${Math.random()}/800/800`, 
        proofType: "IMAGE",
        aiVerificationStatus: "VERIFIED",
        aiVerificationScore: 1.0,
        pointsAwarded: 5,
        isStreakDay: false,
        submittedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        caption: newPost
      };

      await addDoc(collection(db, "completions"), postData).catch(e => handleFirestoreError(e, OperationType.CREATE, "completions"));
      setNewPost("");
      toast.success("Update shared with the community!");
    } catch (error) {
      toast.error("Failed to post update");
    } finally {
      setIsPosting(false);
    }
  }, [newPost]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl">Community Feed</h1>
          <div className="flex gap-2 bg-white p-1 rounded-xl card-shadow">
            <button className="px-4 py-2 bg-primary text-white rounded-lg font-bold">Global</button>
            <button className="px-4 py-2 text-text-secondary hover:bg-gray-50 rounded-lg font-bold">Following</button>
          </div>
        </div>

        {/* Create Post */}
        <div className="bg-white rounded-3xl card-shadow p-6">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                <img src={auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid}`} className="w-full h-full object-cover" />
              </div>
              <textarea 
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share your eco-journey with the community..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary resize-none min-h-[100px] transition-all"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <button type="button" className="flex items-center gap-2 text-text-secondary hover:text-primary font-bold transition-colors">
                <ImageIcon size={20} />
                <span>Add Photo</span>
              </button>
              <button 
                type="submit"
                disabled={!newPost.trim() || isPosting}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-light transition-all disabled:opacity-50 shadow-md"
              >
                <Send size={18} />
                {isPosting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-96 bg-gray-200 rounded-3xl animate-pulse" />)
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

const PostCard = memo(({ post }: { post: any }) => {
  const [liked, setLiked] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl card-shadow overflow-hidden"
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
            <img src={post.userAvatar} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div>
            <p className="font-bold">@{post.username}</p>
            <p className="text-xs text-text-secondary">{new Date(post.submittedAt).toLocaleString()}</p>
          </div>
        </div>
        <button className="p-2 text-text-secondary hover:bg-gray-50 rounded-full">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-4">
        <p className="text-text-primary mb-4">
          {post.caption || `Just completed the #${post.challengeId.replace(/-/g, '')} challenge! 💧 Small steps for a better planet.`}
        </p>
      </div>

      {/* Post Media */}
      <div className="aspect-square bg-gray-100 relative group">
        <img 
          src={post.proofUrl} 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
          Verified ✓
        </div>
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLiked(!liked)}
              className={cn(
                "flex items-center gap-1 transition-colors",
                liked ? "text-red-500" : "text-text-secondary hover:text-red-500"
              )}
            >
              <Heart size={24} fill={liked ? "currentColor" : "none"} />
              <span className="font-bold">24</span>
            </button>
            <button className="flex items-center gap-1 text-text-secondary hover:text-primary transition-colors">
              <MessageCircle size={24} />
              <span className="font-bold">8</span>
            </button>
            <button className="text-text-secondary hover:text-primary transition-colors">
              <Share2 size={24} />
            </button>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
            +{post.pointsAwarded} pts
          </div>
        </div>

        {/* Comments Preview */}
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-bold">eco_warrior_2</span> Great job! Keep it up! 🌿
          </p>
          <button className="text-sm text-text-secondary font-medium hover:underline">
            View all 8 comments
          </button>
        </div>
      </div>
    </motion.div>
  );
});
