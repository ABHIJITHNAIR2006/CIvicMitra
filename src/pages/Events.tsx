import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error-handler";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, MapPin, Users, ArrowRight, Star, Plus, Edit2, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import EventModal from "../components/EventModal";
import { toast } from "react-hot-toast";

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const { isAdmin } = useAuth();

  const fetchEvents = useCallback(async () => {
    try {
      const q = query(collection(db, "events"), orderBy("startDate", "asc"));
      const snap = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.LIST, "events"));
      if (snap) {
        setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    
    try {
      await deleteDoc(doc(db, "events", eventId)).catch(e => handleFirestoreError(e, OperationType.DELETE, `events/${eventId}`));
      toast.success("Event deleted successfully!");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl mb-2">Community Events</h1>
            <p className="text-text-secondary">Join local eco-initiatives and earn bonus points.</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button 
                onClick={handleCreate}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-light transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                <Plus size={20} />
                Create Event
              </button>
            )}
          </div>
        </div>

        {/* Featured Event */}
        <div className="relative h-96 rounded-3xl overflow-hidden card-shadow group cursor-pointer">
          <img 
            src="https://picsum.photos/seed/cleanup/1200/600" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-accent text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Featured</span>
              <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Clean-up Drive</span>
            </div>
            <h2 className="text-4xl md:text-5xl text-white mb-4 max-w-2xl">Juhu Beach Clean-up Drive 2026</h2>
            <div className="flex flex-wrap gap-6 text-white/80 mb-8">
              <div className="flex items-center gap-2">
                <Calendar size={20} />
                <span>March 28, 2026 • 07:00 AM</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={20} />
                <span>Juhu Beach, Mumbai</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={20} />
                <span>124 Joined</span>
              </div>
            </div>
            <button className="w-fit px-8 py-4 bg-white text-primary rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center gap-2">
              Register Now <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-200 rounded-3xl animate-pulse" />)
          ) : events.length > 0 ? (
            events.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                isAdmin={isAdmin}
                onEdit={() => handleEdit(event)}
                onDelete={() => handleDelete(event.id)}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl card-shadow">
              <p className="text-text-secondary">No upcoming events found. Check back later!</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <EventModal 
              event={editingEvent} 
              onClose={() => setIsModalOpen(false)} 
              onSuccess={fetchEvents}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function EventCard({ event, isAdmin, onEdit, onDelete }: { event: any, isAdmin: boolean, onEdit: () => void, onDelete: () => void }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl card-shadow overflow-hidden flex flex-col group"
    >
      <div className="h-48 relative">
        <img src={event.bannerImageUrl || `https://picsum.photos/seed/${event.id}/800/400`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary">
          {event.eventType}
        </div>
        <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Star size={12} /> +{event.bonusPoints} pts
        </div>
        
        {isAdmin && (
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-2 bg-white text-primary rounded-lg shadow-lg hover:bg-primary hover:text-white transition-all"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 bg-white text-red-600 rounded-lg shadow-lg hover:bg-red-600 hover:text-white transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-2xl mb-2">{event.title}</h3>
        <p className="text-text-secondary text-sm line-clamp-2 mb-6 flex-1">{event.description}</p>
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Calendar size={16} className="text-primary" />
            <span>{new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <MapPin size={16} className="text-primary" />
            <span>{event.location?.venueName || 'Online'}</span>
          </div>
        </div>
        <button className="w-full py-3 bg-gray-50 text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition-all">
          View Details
        </button>
      </div>
    </motion.div>
  );
}
