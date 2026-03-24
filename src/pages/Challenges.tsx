import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error-handler";
import DashboardLayout from "../layouts/DashboardLayout";
import { Challenge, Category } from "../types";
import { AnimatePresence } from "motion/react";
import { Search } from "lucide-react";
import ChallengeCard from "../components/ChallengeCard";
import ChallengeModal from "../components/ChallengeModal";

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const snap = await getDocs(collection(db, "challenges")).catch(e => handleFirestoreError(e, OperationType.LIST, "challenges"));
        if (snap) {
          const data = snap.docs.map(d => d.data() as Challenge);
          setChallenges(data);
          setFilteredChallenges(data);
        }
      } catch (error) {
        console.error("Error fetching challenges:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, []);

  useEffect(() => {
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
    setFilteredChallenges(filtered);
  }, [search, selectedCategory, challenges]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-4xl">Eco Challenges</h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search challenges..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl card-shadow outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-100 rounded-xl card-shadow outline-none focus:ring-2 focus:ring-primary font-bold"
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard 
                key={challenge.challengeId} 
                challenge={challenge} 
                onClick={() => setSelectedChallenge(challenge)}
              />
            ))}
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
