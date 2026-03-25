import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { 
  Home, 
  Zap, 
  Trophy, 
  Calendar, 
  Users, 
  User, 
  Settings, 
  LogOut, 
  Bell,
  Menu,
  X,
  Flame,
  ShieldCheck
} from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Role } from "../types";

const baseNavItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Zap, label: "Challenges", path: "/challenges" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: Calendar, label: "Events", path: "/events" },
  { icon: Users, label: "Feed", path: "/feed" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
        const userDoc = await getDoc(doc(db, "users", user.uid)).catch(e => {
          console.error("Admin status check failed:", e);
          return null;
        });
        if (userDoc && userDoc.exists() && userDoc.data().role === Role.ADMIN) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  const navItems = isAdmin 
    ? [...baseNavItems, { icon: ShieldCheck, label: "Admin", path: "/admin" }]
    : baseNavItems;

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Zap className="text-white" size={24} />
          </div>
          <span className="text-2xl font-display font-bold text-primary">CivicMitra</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                location.pathname === item.path
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-text-secondary hover:bg-gray-50 hover:text-primary"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-red-50 hover:text-red-600 transition-all duration-200 mt-auto"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="text-white" size={18} />
          </div>
          <span className="text-xl font-display font-bold text-primary">CivicMitra</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-text-secondary">
            <Bell size={20} />
          </button>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-text-secondary"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-[70] p-6 lg:hidden"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Zap className="text-white" size={18} />
                  </div>
                  <span className="text-xl font-display font-bold text-primary">CivicMitra</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      location.pathname === item.path
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-text-secondary hover:bg-gray-50 hover:text-primary"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-red-50 hover:text-red-600 transition-all duration-200 mt-10 w-full"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:p-8 p-4 pt-20 lg:pt-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
