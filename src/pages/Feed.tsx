import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error-handler";
import DashboardLayout from "../layouts/DashboardLayout";
import { Completion } from "../types";
import { motion } from "motion/react";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/utils";

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "completions"), orderBy("submittedAt", "desc"), limit(20));
    
    const unsubscribe = onSnapshot(q, async (snap) => {
      const postData = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data() as Completion;
        // Fetch user details from users_public
        const userSnap = await getDoc(doc(db, "users_public", data.userId));
        const userData = userSnap.exists() ? userSnap.data() : null;
        
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

function PostCard({ post }: { post: any }) {
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
            <img src={post.userAvatar} className="w-full h-full object-cover" />
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
          Just completed the <span className="text-primary font-bold">#ReusableBottleDay</span> challenge! 💧 Small steps for a better planet.
        </p>
      </div>

      {/* Post Media */}
      <div className="aspect-square bg-gray-100 relative group">
        <img 
          src={post.proofUrl} 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer"
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
}
