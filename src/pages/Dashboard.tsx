import { useEffect, useState, useMemo, memo } from "react";
import { collection, query, getDocs, limit, orderBy, where, doc, getDoc, setDoc, writeBatch, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Category, Difficulty, Challenge, UserProfile, Completion, VerificationStatus, Role } from "../types";
import { toast } from "react-hot-toast";
import { handleFirestoreError, OperationType } from "../lib/firestore-error-handler";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Zap, Target, ArrowRight, Leaf, Users, Calendar, Database, CheckCircle2, Clock, Star, Award } from "lucide-react";
import { Link } from "react-router-dom";
import ChallengeCard from "../components/ChallengeCard";
import ChallengeModal from "../components/ChallengeModal";
import DailyQuizCard from "../components/DailyQuizCard";
import QuizModal from "../components/QuizModal";
import LevelBadge from "../components/LevelBadge";
import LevelUpCelebration from "../components/LevelUpCelebration";
import { cn } from "../lib/utils";
import { useEventData } from "../lib/event-registration-utils";
import { getCurrentLevel, LEVELS } from "../lib/level-utils";

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);
  const [recentActivity, setRecentActivity] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [displayCO2, setDisplayCO2] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const { registrations, submissions } = useEventData();

  const userSubmissions = submissions.filter(s => s.userEmail === auth.currentUser?.email);
  const totalSubmissionPoints = userSubmissions.reduce((sum, s) => sum + s.points, 0);
  const totalPoints = (profile?.points || 0) + totalSubmissionPoints;

  const currentLevel = useMemo(() => getCurrentLevel(totalPoints), [totalPoints]);

  useEffect(() => {
    if (loading) return;

    const storedLevel = localStorage.getItem("user_level");
    const sessionShown = sessionStorage.getItem("level_shown_this_session");

    // 1. Initial Login/Session Popup (Show current level once per session)
    if (!sessionShown) {
      setNewLevel(currentLevel.level);
      setShowLevelUp(true);
      sessionStorage.setItem("level_shown_this_session", "true");
      // Sync localStorage if it's the first time ever
      if (!storedLevel) {
        localStorage.setItem("user_level", currentLevel.level.toString());
      }
      return;
    }

    // 2. Level Increase Popup
    if (storedLevel) {
      const lastLevel = parseInt(storedLevel);
      if (currentLevel.level > lastLevel) {
        setNewLevel(currentLevel.level);
        setShowLevelUp(true);
        localStorage.setItem("user_level", currentLevel.level.toString());
        toast.success(`⬆️ Level Up! You are now a ${currentLevel.title}!`, {
          icon: '🎉',
          duration: 5000
        });
      } else if (currentLevel.level < lastLevel) {
        // Sync if points decreased (rare but possible if data resets)
        localStorage.setItem("user_level", currentLevel.level.toString());
      }
    }
  }, [currentLevel.level, loading]);

  const calculateCO2 = (pts: number) => (pts * 0.05).toFixed(1);

  useEffect(() => {
    const targetCO2 = parseFloat(calculateCO2(totalPoints));
    if (targetCO2 === displayCO2) return;

    const startValue = displayCO2;
    const duration = 1500; // 1.5 seconds
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quad
      const easedProgress = progress * (2 - progress);
      const currentValue = startValue + (targetCO2 - startValue) * easedProgress;
      
      setDisplayCO2(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayCO2(targetCO2);
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 1000);
      }
    };

    requestAnimationFrame(animate);
  }, [totalPoints]);

  const welcomeMessage = useMemo(() => {
    const name = profile?.fullName?.split(' ')[0] || profile?.username || 'Eco-Warrior';
    const co2 = displayCO2.toFixed(1);
    const level = getCurrentLevel(totalPoints);
    
    return (
      <>
        <h1 className="text-4xl mb-2">Welcome back, {name}!</h1>
        <p className={cn(
          "text-lg transition-colors duration-300 flex items-center gap-2",
          isUpdating ? "text-green-500 font-bold" : "text-text-secondary"
        )}>
          <span className="font-bold">{level.emoji} {level.title}</span>
          <span className="opacity-30">|</span>
          <span>{co2} kg CO2 saved</span>
        </p>
      </>
    );
  }, [profile, displayCO2, totalPoints, isUpdating]);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const challengesData = [
        {
          challengeId: "reusable-bottle-day",
          title: "Reusable Bottle Day",
          description: "Carry and use a reusable water bottle all day to reduce single-use plastic waste.",
          shortDescription: "Carry and use a reusable water bottle all day.",
          category: Category.WATER,
          difficulty: Difficulty.EASY,
          points: 10,
          bonusPointsStreak: 5,
          iconEmoji: "💧",
          bannerImageUrl: "https://picsum.photos/seed/bottle/800/400",
          proofInstructions: "Upload a photo of your reusable bottle in hand or on your desk.",
          isDaily: true,
          isActive: true
        },
        {
          challengeId: "short-shower",
          title: "Short Shower Challenge",
          description: "Take a shower under 5 minutes to conserve water.",
          shortDescription: "Take a shower under 5 minutes.",
          category: Category.WATER,
          difficulty: Difficulty.MEDIUM,
          points: 15,
          bonusPointsStreak: 5,
          iconEmoji: "🚿",
          bannerImageUrl: "https://picsum.photos/seed/shower/800/400",
          proofInstructions: "Upload a photo of a timer showing <5:00 next to running water.",
          isDaily: true,
          isActive: true
        },
        {
          challengeId: "lights-out",
          title: "Lights Out Hour",
          description: "Turn off all non-essential lights for 1 hour to save energy.",
          shortDescription: "Turn off all non-essential lights for 1 hour.",
          category: Category.ENERGY,
          difficulty: Difficulty.EASY,
          points: 10,
          bonusPointsStreak: 5,
          iconEmoji: "💡",
          bannerImageUrl: "https://picsum.photos/seed/lights/800/400",
          proofInstructions: "Upload a photo of your dark room or only essential light.",
          isDaily: true,
          isActive: true
        },
        {
          challengeId: "walk-it",
          title: "Walk It",
          description: "Walk instead of taking a vehicle for any trip under 1 km.",
          shortDescription: "Walk instead of taking a vehicle for short trips.",
          category: Category.TRANSPORT,
          difficulty: Difficulty.EASY,
          points: 15,
          bonusPointsStreak: 5,
          iconEmoji: "🚶",
          bannerImageUrl: "https://picsum.photos/seed/walk/800/400",
          proofInstructions: "Upload a walking selfie or a Google Maps screenshot showing your walk.",
          isDaily: true,
          isActive: true
        },
        {
          challengeId: "no-plastic-bag",
          title: "No Plastic Bag",
          description: "Carry a cloth or reusable bag for all your shopping today.",
          shortDescription: "Carry a cloth/reusable bag for all shopping.",
          category: Category.WASTE,
          difficulty: Difficulty.EASY,
          points: 10,
          bonusPointsStreak: 5,
          iconEmoji: "🛍️",
          bannerImageUrl: "https://picsum.photos/seed/bag/800/400",
          proofInstructions: "Upload a photo of your cloth bag with your purchases.",
          isDaily: true,
          isActive: true
        }
      ];

      const batch = writeBatch(db);
      challengesData.forEach(c => {
        const ref = doc(db, "challenges", c.challengeId);
        batch.set(ref, c);
      });
      await batch.commit();
      toast.success("Challenges seeded successfully!");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to seed data");
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    // Immediate Admin Check based on email
    if (auth.currentUser.email === "arcadeabhi6@gmail.com") {
      setIsAdmin(true);
    }

    // Real-time user profile listener
    const unsubscribeProfile = onSnapshot(doc(db, "users", auth.currentUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data() as UserProfile;
        setProfile(userData);
        if (userData.role === Role.ADMIN) {
          setIsAdmin(true);
        }
      }
    }, (e) => {
      console.error("User profile listener failed:", e);
    });

    const fetchData = async () => {
      if (!auth.currentUser) return;

      try {
        // Parallel fetching for other data
        const [challengesSnap, activitySnap] = await Promise.all([
          getDocs(query(collection(db, "challenges"), where("isDaily", "==", true), limit(3))).catch(e => {
            console.error("Challenges fetch failed:", e);
            return null;
          }),
          getDocs(query(
            collection(db, "completions"), 
            where("userId", "==", auth.currentUser.uid),
            orderBy("submittedAt", "desc"),
            limit(5)
          )).catch(e => {
            console.error("Activity fetch failed:", e);
            return null;
          })
        ]);

        if (challengesSnap) {
          setDailyChallenges(challengesSnap.docs.map(d => d.data() as Challenge));
        }

        if (activitySnap) {
          setRecentActivity(activitySnap.docs.map(d => ({ id: d.id, ...d.data() } as Completion)));
        }

        // Check for daily quiz attempt
        const today = new Date().toISOString().split('T')[0];
        const quizQuery = query(
          collection(db, "quiz_attempts"),
          where("userId", "==", auth.currentUser.uid),
          where("date", "==", today),
          limit(1)
        );
        const quizSnap = await getDocs(quizQuery).catch(e => {
          console.error("Quiz check failed:", e);
          return null;
        });

        if (quizSnap && quizSnap.empty) {
          setIsQuizOpen(true);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Some data failed to load. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => unsubscribeProfile();
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
            {welcomeMessage}
            {isAdmin && dailyChallenges.length === 0 && (
              <button 
                onClick={handleSeedData}
                disabled={seeding}
                className="mt-4 flex items-center gap-2 px-6 py-2 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg disabled:opacity-50"
              >
                <Database size={18} />
                {seeding ? "Seeding..." : "Seed Initial Challenges"}
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <StatCard icon={<Zap className="text-accent" />} label="Streak" value={`${profile?.currentStreak || 0} Days`} />
            <StatCard icon={<Trophy className="text-yellow-500" />} label="Points" value={(profile?.points || 0) + totalSubmissionPoints} />
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
          
          {dailyChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dailyChallenges.map((challenge) => (
                <ChallengeCard 
                  key={challenge.challengeId} 
                  challenge={challenge} 
                  onClick={() => setSelectedChallenge(challenge)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-3xl p-12 text-center card-shadow">
              <Leaf className="mx-auto text-gray-200 mb-4" size={48} />
              <h3 className="text-xl mb-2">No daily challenges available</h3>
              <p className="text-text-secondary mb-6">Check back later or explore all challenges.</p>
              {isAdmin && (
                <button 
                  onClick={handleSeedData}
                  disabled={seeding}
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-light transition-all mx-auto shadow-lg disabled:opacity-50"
                >
                  <Database size={20} />
                  {seeding ? "Seeding..." : "Seed Initial Challenges"}
                </button>
              )}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-10">
            {/* Level Progress Card */}
            <div>
              <h2 className="text-2xl mb-6 flex items-center gap-2">
                <Award className="text-primary" />
                Your Rank Progress
              </h2>
              <LevelBadge points={totalPoints} />
            </div>

            <div>
              <h2 className="text-2xl mb-6 flex items-center gap-2">
                <Calendar className="text-primary" />
                Recent Activity
              </h2>
              <div className="bg-card rounded-3xl card-shadow overflow-hidden">
                {recentActivity.length > 0 ? (
                  <div className="divide-y divide-primary/5">
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

            {/* My Event Submissions */}
            <div>
              <h2 className="text-2xl mb-6 flex items-center gap-2">
                <Star className="text-primary" />
                My Event Submissions
              </h2>
              <div className="bg-card rounded-3xl card-shadow overflow-hidden">
                {userSubmissions.length > 0 ? (
                  <>
                    <div className="divide-y divide-primary/5">
                      {userSubmissions.map((sub) => (
                        <div key={sub.id} className="p-6 flex items-center justify-between hover:bg-primary/5 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                              <CheckCircle2 size={24} />
                            </div>
                            <div>
                              <p className="font-bold">{sub.eventName}</p>
                              <p className="text-sm text-text-secondary">{sub.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">+{sub.points} pts</p>
                            <div className="flex items-center gap-1 text-xs text-text-secondary uppercase tracking-widest font-bold">
                              <Clock size={12} />
                              {sub.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 bg-primary/5 border-t border-primary/10 flex justify-between items-center">
                      <span className="font-bold text-text-secondary">Total Points from Submissions</span>
                      <span className="text-2xl font-display font-bold text-primary">⭐ {totalSubmissionPoints}</span>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center">
                    <Trophy className="mx-auto text-gray-200 mb-4" size={48} />
                    <p className="text-text-secondary">No event submissions yet. Register for an event to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Community Stats */}
          <div className="space-y-6">
            <h2 className="text-2xl mb-6 flex items-center gap-2">
              <Zap className="text-primary" />
              Daily Bonus
            </h2>
            <DailyQuizCard />

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
          {isQuizOpen && (
            <QuizModal 
              isOpen={isQuizOpen} 
              onClose={() => setIsQuizOpen(false)} 
              onComplete={() => setIsQuizOpen(false)} 
            />
          )}
          {showLevelUp && newLevel && (
            <LevelUpCelebration 
              level={newLevel} 
              onClose={() => setShowLevelUp(false)} 
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

const StatCard = memo(({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => {
  return (
    <div className="bg-card px-6 py-4 rounded-2xl card-shadow flex items-center gap-4 min-w-[140px]">
      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">{label}</p>
        <p className="text-xl font-display">{value}</p>
      </div>
    </div>
  );
});

const ActivityItem = memo(({ activity }: { activity: Completion }) => {
  return (
    <div className="p-6 flex items-center justify-between hover:bg-primary/5 transition-colors">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center text-xl",
          activity.aiVerificationStatus === VerificationStatus.VERIFIED ? "bg-green-500/10" : "bg-red-500/10"
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
});
