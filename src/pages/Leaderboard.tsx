import { useEffect, useState, useMemo, memo } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error-handler";
import DashboardLayout from "../layouts/DashboardLayout";
import { UserProfile } from "../types";
import { motion } from "motion/react";
import { Trophy, Medal, Star, Flame } from "lucide-react";
import { cn } from "../lib/utils";

export default function Leaderboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL_TIME");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "users_public"), orderBy("totalPoints", "desc"), limit(50));
        const snap = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.LIST, "users_public"));
        if (snap) {
          setUsers(snap.docs.map(d => d.data() as UserProfile));
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [activeTab]);

  const podiumUsers = useMemo(() => {
    if (users.length < 3) return [];
    // Return in order: [2nd, 1st, 3rd] for layout
    return [users[1], users[0], users[2]];
  }, [users]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl mb-4">Eco Leaderboard</h1>
          <p className="text-text-secondary">See how you stack up against the global community of eco-warriors.</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center">
          <div className="bg-white p-1 rounded-2xl card-shadow flex gap-1">
            {["WEEKLY", "MONTHLY", "ALL_TIME"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2 rounded-xl font-bold transition-all",
                  activeTab === tab ? "bg-primary text-white" : "text-text-secondary hover:bg-gray-50"
                )}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Podium */}
        {!loading && podiumUsers.length >= 3 && (
          <div className="flex items-end justify-center gap-4 md:gap-12 py-12">
            <PodiumItem user={podiumUsers[0]} rank={2} height="h-48" />
            <PodiumItem user={podiumUsers[1]} rank={1} height="h-64" />
            <PodiumItem user={podiumUsers[2]} rank={3} height="h-40" />
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-3xl card-shadow overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-6 bg-gray-50 text-xs font-bold text-text-secondary uppercase tracking-widest">
            <div className="col-span-1">Rank</div>
            <div className="col-span-7 md:col-span-8">User</div>
            <div className="col-span-2 md:col-span-1 text-right">Streak</div>
            <div className="col-span-2 text-right">Points</div>
          </div>

          {loading ? (
            <div className="p-12 text-center animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map((user, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={user.uid} 
                  className={cn(
                    "grid grid-cols-12 gap-4 p-6 items-center hover:bg-gray-50 transition-colors",
                    user.uid === auth.currentUser?.uid && "bg-primary/5"
                  )}
                >
                  <div className="col-span-1 font-display font-bold text-lg text-text-secondary">
                    #{i + 1}
                  </div>
                  <div className="col-span-7 md:col-span-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                      <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold">{user.fullName}</p>
                      <p className="text-xs text-text-secondary">@{user.username}</p>
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1 text-right flex items-center justify-end gap-1 text-accent font-bold">
                    <Flame size={14} />
                    {user.currentStreak}
                  </div>
                  <div className="col-span-2 text-right font-bold text-primary">
                    {user.totalPoints.toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

const PodiumItem = memo(({ user, rank, height }: { user: UserProfile, rank: number, height: string }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className={cn(
          "w-20 h-20 md:w-24 md:h-24 rounded-full border-4 p-1",
          rank === 1 ? "border-yellow-400" : rank === 2 ? "border-gray-300" : "border-orange-400"
        )}>
          <img 
            src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
            className="w-full h-full rounded-full object-cover" 
            loading="lazy"
          />
        </div>
        <div className={cn(
          "absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold",
          rank === 1 ? "bg-yellow-400" : rank === 2 ? "bg-gray-300" : "bg-orange-400"
        )}>
          {rank}
        </div>
      </div>
      <div className="text-center">
        <p className="font-bold text-sm md:text-base">{user.fullName}</p>
        <p className="text-primary font-bold">{user.totalPoints} pts</p>
      </div>
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height: "auto" }}
        className={cn(
          "w-24 md:w-32 rounded-t-2xl flex flex-col items-center justify-center text-white font-display font-bold text-2xl",
          rank === 1 ? "bg-yellow-400" : rank === 2 ? "bg-gray-300" : "bg-orange-400",
          height
        )}
      >
        {rank === 1 ? <Trophy size={32} /> : rank === 2 ? <Medal size={32} /> : <Star size={32} />}
      </motion.div>
    </div>
  );
});
