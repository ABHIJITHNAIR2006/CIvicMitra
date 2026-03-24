import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Pages (to be implemented)
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import Challenges from "./pages/Challenges";
import Leaderboard from "./pages/Leaderboard";
import Events from "./pages/Events";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/challenges" element={user ? <Challenges /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/login" />} />
          <Route path="/events" element={user ? <Events /> : <Navigate to="/login" />} />
          <Route path="/feed" element={user ? <Feed /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/login" />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
