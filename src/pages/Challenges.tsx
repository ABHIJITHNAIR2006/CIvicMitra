import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, writeBatch, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { handleFirestoreError, OperationType } from "../lib/firestore-error-handler";
import DashboardLayout from "../layouts/DashboardLayout";
import { Challenge, Category, Difficulty, Role } from "../types";
import { AnimatePresence } from "motion/react";
import { Search, Database, Plus, AlertTriangle } from "lucide-react";
import ChallengeCard from "../components/ChallengeCard";
import ChallengeModal from "../components/ChallengeModal";
import { toast } from "react-hot-toast";

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      if (user.email === "arcadeabhi6@gmail.com") {
        setIsAdmin(true);
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid)).catch(e => handleFirestoreError(e, OperationType.GET, `users/${user.uid}`));
        if (userSnap && userSnap.exists() && userSnap.data().role === Role.ADMIN) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    });

    return () => unsubscribe();
  }, []);

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
    const fetchChallenges = async () => {
      try {
        const snap = await getDocs(collection(db, "challenges")).catch(e => handleFirestoreError(e, OperationType.LIST, "challenges"));
        if (snap) {
          const data = snap.docs.map(d => d.data() as Challenge);
          setChallenges(data);
        }
      } catch (error) {
        console.error("Error fetching challenges:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, []);

  const filteredChallenges = useMemo(() => {
    let filtered = challenges;
    if (selectedCategory !== "ALL") {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }
    if (search) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(search.toLowerCase()) || 
        c.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  }, [search, selectedCategory, challenges]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl">Eco Challenges</h1>
            {isAdmin && challenges.length === 0 && !loading && (
              <button 
                onClick={handleSeedData}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-bold hover:bg-accent/90 transition-all text-sm shadow-md disabled:opacity-50"
              >
                <Database size={16} />
                {seeding ? "Seeding..." : "Seed Data"}
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
              <input
                type="text"
                placeholder="Search challenges..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-primary/10 rounded-xl card-shadow outline-none focus:ring-2 focus:ring-primary text-text-primary"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-card border border-primary/10 rounded-xl card-shadow outline-none focus:ring-2 focus:ring-primary font-bold text-text-primary"
            >
              <option value="ALL">All Categories</option>
              {Object.values(Category).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard 
                key={challenge.challengeId} 
                challenge={challenge} 
                onClick={() => setSelectedChallenge(challenge)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-3xl card-shadow">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-text-secondary opacity-20" size={40} />
            </div>
            <h3 className="text-2xl mb-2">No challenges found</h3>
            <p className="text-text-secondary mb-8">Try adjusting your filters or search terms.</p>
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
