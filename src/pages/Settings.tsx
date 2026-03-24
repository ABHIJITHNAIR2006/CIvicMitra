import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion } from "motion/react";
import { Bell, Shield, User, Moon, Globe, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { UserProfile } from "../types";
import { handleFirestoreError, OperationType } from "../lib/firestore-error-handler";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("ACCOUNT");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid)).catch(e => handleFirestoreError(e, OperationType.GET, `users/${auth.currentUser?.uid}`));
        if (snap && snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching settings profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl">Settings</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 space-y-2">
            <TabButton 
              active={activeTab === "ACCOUNT"} 
              onClick={() => setActiveTab("ACCOUNT")} 
              icon={<User size={20} />} 
              label="Account" 
            />
            <TabButton 
              active={activeTab === "NOTIFICATIONS"} 
              onClick={() => setActiveTab("NOTIFICATIONS")} 
              icon={<Bell size={20} />} 
              label="Notifications" 
            />
            <TabButton 
              active={activeTab === "PRIVACY"} 
              onClick={() => setActiveTab("PRIVACY")} 
              icon={<Shield size={20} />} 
              label="Privacy" 
            />
            <TabButton 
              active={activeTab === "APPEARANCE"} 
              onClick={() => setActiveTab("APPEARANCE")} 
              icon={<Moon size={20} />} 
              label="Appearance" 
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-3xl card-shadow p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              </div>
            ) : (
              <>
                {activeTab === "ACCOUNT" && (
                  <div className="space-y-8">
                    <h3 className="text-2xl">Account Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-text-secondary">Email</label>
                          <input type="email" readOnly value={profile?.email || ""} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-text-secondary" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-text-secondary">Username</label>
                          <input type="text" readOnly value={profile?.username || ""} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-text-secondary" />
                        </div>
                      </div>
                      <div className="pt-8 border-t border-gray-50">
                        <h4 className="text-red-600 font-bold mb-2 flex items-center gap-2">
                          <Trash2 size={18} /> Danger Zone
                        </h4>
                        <p className="text-sm text-text-secondary mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                        <button className="px-6 py-2 border-2 border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "NOTIFICATIONS" && (
                  <div className="space-y-8">
                    <h3 className="text-2xl">Notification Preferences</h3>
                    <div className="space-y-6">
                      <ToggleSetting title="Email Notifications" description="Receive weekly summaries and event reminders via email." defaultChecked />
                      <ToggleSetting title="Push Notifications" description="Get real-time updates on challenge verification and streak alerts." defaultChecked />
                      <ToggleSetting title="Friend Activity" description="Notify me when friends complete challenges or follow me." />
                    </div>
                  </div>
                )}

                {activeTab === "PRIVACY" && (
                  <div className="space-y-8">
                    <h3 className="text-2xl">Privacy Settings</h3>
                    <div className="space-y-6">
                      <ToggleSetting title="Public Profile" description="Allow anyone to view your profile and eco-impact." defaultChecked />
                      <ToggleSetting title="Show on Leaderboard" description="Display your rank and points on the global leaderboard." defaultChecked />
                      <ToggleSetting title="Activity Feed" description="Share your challenge completions to the community feed." defaultChecked />
                    </div>
                  </div>
                )}

                {activeTab === "APPEARANCE" && (
                  <div className="space-y-8">
                    <h3 className="text-2xl">Appearance</h3>
                    <div className="space-y-6">
                      <ToggleSetting title="Dark Mode" description="Switch to a darker color scheme for low-light environments." />
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-text-secondary">Language</label>
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-text-secondary">
                          <Globe size={18} />
                          <span>English (US)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all",
        active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-secondary hover:bg-white hover:text-primary"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ToggleSetting({ title, description, defaultChecked = false }: any) {
  const [enabled, setEnabled] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <h4 className="font-bold">{title}</h4>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={cn(
          "w-12 h-6 rounded-full transition-all relative",
          enabled ? "bg-primary" : "bg-gray-200"
        )}
      >
        <motion.div 
          animate={{ x: enabled ? 24 : 4 }}
          className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}
