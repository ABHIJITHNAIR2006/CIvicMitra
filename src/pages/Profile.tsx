import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error-handler";
import DashboardLayout from "../layouts/DashboardLayout";
import { UserProfile, Completion, Badge } from "../types";
import { motion } from "motion/react";
import { MapPin, Calendar, Award, Grid, List, Flame, Star } from "lucide-react";
import { cn } from "../lib/utils";

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ACTIVITY");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid)).catch(e => handleFirestoreError(e, OperationType.GET, `users/${auth.currentUser?.uid}`));
        if (userDoc && userDoc.exists()) setProfile(userDoc.data() as UserProfile);
        else if (userDoc && !userDoc.exists()) console.warn("User profile document not found");

        const compQuery = query(collection(db, "completions"), where("userId", "==", auth.currentUser.uid), orderBy("submittedAt", "desc"));
        const compSnap = await getDocs(compQuery).catch(e => handleFirestoreError(e, OperationType.LIST, "completions"));
        if (compSnap) {
          setCompletions(compSnap.docs.map(d => ({ id: d.id, ...d.data() } as Completion)));
        }

        const badgeQuery = query(collection(db, "users", auth.currentUser.uid, "badges"));
        const badgeSnap = await getDocs(badgeQuery).catch(e => handleFirestoreError(e, OperationType.LIST, `users/${auth.currentUser.uid}/badges`));
        if (badgeSnap) {
          setBadges(badgeSnap.docs.map(d => d.data() as Badge));
        }

      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="p-12 text-center">Loading profile...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl card-shadow overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-primary to-primary-light relative">
            <div className="absolute -bottom-16 left-8 p-2 bg-white rounded-full">
              <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden border-4 border-white">
                <img 
                  src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`} 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
          </div>
          <div className="pt-20 pb-8 px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-display">{profile?.fullName}</h1>
              <p className="text-text-secondary mb-4">@{profile?.username}</p>
              <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  {profile?.city}, {profile?.country}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-light transition-colors">
                Edit Profile
              </button>
              <button className="px-6 py-2 bg-gray-100 text-text-primary rounded-xl font-bold hover:bg-gray-200 transition-colors">
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Star className="text-primary" />} label="Total Points" value={profile?.totalPoints || 0} />
          <StatCard icon={<Flame className="text-accent" />} label="Current Streak" value={profile?.currentStreak || 0} />
          <StatCard icon={<Award className="text-primary-light" />} label="Badges" value={badges.length} />
          <StatCard icon={<Grid className="text-gray-400" />} label="Level" value={profile?.level || 1} />
        </div>

        {/* Tabs */}
        <div className="space-y-6">
          <div className="flex border-b border-gray-100">
            {["ACTIVITY", "BADGES", "GALLERY"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-8 py-4 font-bold transition-all relative",
                  activeTab === tab ? "text-primary" : "text-text-secondary hover:text-primary"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeTab === "ACTIVITY" && (
              <div className="space-y-4">
                {completions.length > 0 ? completions.map(comp => (
                  <div key={comp.id} className="bg-white p-6 rounded-3xl card-shadow flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden">
                        <img src={comp.proofUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h4 className="font-bold">Challenge Completed</h4>
                        <p className="text-sm text-text-secondary">{new Date(comp.submittedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-primary font-bold">+{comp.pointsAwarded} pts</span>
                      <p className="text-xs text-green-600 font-bold uppercase tracking-wider mt-1">Verified</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-white rounded-3xl card-shadow">
                    <p className="text-text-secondary">No activity yet. Start a challenge!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "BADGES" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {badges.length > 0 ? badges.map(badge => (
                  <div key={badge.id} className="bg-white p-6 rounded-3xl card-shadow text-center space-y-3">
                    <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-3xl">
                      {badge.badgeIconUrl}
                    </div>
                    <p className="font-bold text-sm">{badge.badgeName}</p>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-20 bg-white rounded-3xl card-shadow">
                    <p className="text-text-secondary">No badges earned yet. Keep going!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "GALLERY" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {completions.map(comp => (
                  <div key={comp.id} className="aspect-square rounded-2xl overflow-hidden card-shadow">
                    <img src={comp.proofUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-white p-6 rounded-3xl card-shadow flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-display font-bold">{value}</p>
      </div>
    </div>
  );
}
