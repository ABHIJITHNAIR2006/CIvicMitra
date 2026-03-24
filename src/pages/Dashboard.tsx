import { useEffect, useState } from "react";
import { collection, query, getDocs, limit, orderBy, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error-handler";
import DashboardLayout from "../layouts/DashboardLayout";
import { Challenge, UserProfile, Completion, VerificationStatus } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Zap, Target, ArrowRight, Leaf, Users, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import ChallengeCard from "../components/ChallengeCard";
import ChallengeModal from "../components/ChallengeModal";
import { cn } from "../lib/utils";

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);
  const [recentActivity, setRecentActivity] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;

      try {
        // Fetch User Profile
        const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid)).catch(e => handleFirestoreError(e, OperationType.GET, `users/${auth.currentUser?.uid}`));
        if (userSnap && userSnap.exists()) {
          setProfile(userSnap.data() as UserProfile);
        }

        // Fetch Daily Challenges
        const challengesSnap = await getDocs(query(collection(db, "challenges"), where("isDaily", "==", true), limit(3))).catch(e => handleFirestoreError(e, OperationType.LIST, "challenges"));
        if (challengesSnap) {
          setDailyChallenges(challengesSnap.docs.map(d => d.data() as Challenge));
        }

        // Fetch Recent Activity
        const activitySnap = await getDocs(query(
          collection(db, "completions"), 
          where("userId", "==", auth.currentUser.uid),
          orderBy("submittedAt", "desc"),
          limit(5)
        )).catch(e => handleFirestoreError(e, OperationType.LIST, "completions"));
        if (activitySnap) {
          setRecentActivity(activitySnap.docs.map(d => ({ id: d.id, ...d.data() } as Completion)));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl mb-2">Welcome back, {profile?.fullName?.split(' ')[0] || profile?.username || 'Eco-Warrior'}!</h1>
            <p className="text-text-secondary text-lg">You've saved <span className="text-primary font-bold">12.4kg</span> of CO2 this week. Keep it up!</p>
          </div>
          <div className="flex gap-4">
            <StatCard icon={<Zap className="text-accent" />} label="Streak" value={`${profile?.currentStreak || 0} Days`} />
            <StatCard icon={<Trophy className="text-yellow-500" />} label="Points" value={profile?.totalPoints || 0} />
          </div>
        </div>

        {/* Daily Challenges */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl flex items-center gap-2">
              <Target className="text-primary" />
              Daily Challenges
            </h2>
            <Link to="/challenges" className="text-primary font-bold flex items-center gap-1 hover:underline">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dailyChallenges.map((challenge) => (
              <ChallengeCard 
                key={challenge.challengeId} 
                challenge={challenge} 
                onClick={() => setSelectedChallenge(challenge)}
              />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl mb-6 flex items-center gap-2">
              <Calendar className="text-primary" />
              Recent Activity
            </h2>
            <div className="bg-white rounded-3xl card-shadow overflow-hidden">
              {recentActivity.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Leaf className="mx-auto text-gray-200 mb-4" size={48} />
                  <p className="text-text-secondary">No activity yet. Start a challenge to see your progress!</p>
                </div>
              )}
            </div>
          </div>

          {/* Community Stats */}
          <div className="space-y-6">
            <h2 className="text-2xl mb-6 flex items-center gap-2">
              <Users className="text-primary" />
              Community
            </h2>
            <div className="bg-primary text-white rounded-3xl p-8 card-shadow relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-primary-light font-bold uppercase tracking-widest text-xs mb-2">Global Impact</p>
                <h3 className="text-4xl font-display mb-4">1,240 Tons</h3>
                <p className="text-primary-light/80 text-sm leading-relaxed">Total CO2 offset by the EcoStep community this month. We're making a difference together!</p>
              </div>
              <Leaf className="absolute -bottom-4 -right-4 text-white/10" size={120} />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedChallenge && (
            <ChallengeModal 
              challenge={selectedChallenge} 
              onClose={() => setSelectedChallenge(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-white px-6 py-4 rounded-2xl card-shadow flex items-center gap-4 min-w-[140px]">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">{label}</p>
        <p className="text-xl font-display">{value}</p>
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Completion }) {
  return (
    <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center text-xl",
          activity.aiVerificationStatus === VerificationStatus.VERIFIED ? "bg-green-50" : "bg-red-50"
        )}>
          {activity.aiVerificationStatus === VerificationStatus.VERIFIED ? "🌱" : "❌"}
        </div>
        <div>
          <p className="font-bold">Challenge Completed</p>
          <p className="text-sm text-text-secondary">{new Date(activity.submittedAt).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn(
          "font-bold",
          activity.aiVerificationStatus === VerificationStatus.VERIFIED ? "text-primary" : "text-red-500"
        )}>
          {activity.aiVerificationStatus === VerificationStatus.VERIFIED ? `+${activity.pointsAwarded} pts` : "Rejected"}
        </p>
        <p className="text-xs text-text-secondary uppercase tracking-widest font-bold">
          {activity.aiVerificationStatus}
        </p>
      </div>
    </div>
  );
}
