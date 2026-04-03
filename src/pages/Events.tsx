import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-error-handler";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, MapPin, Users, ArrowRight, Star, Plus, Edit2, Trash2, CheckCircle2, Camera, Trophy as TrophyIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import EventModal from "../components/EventModal";
import { toast } from "react-hot-toast";
import { useEventData, Registration, Submission } from "../lib/event-registration-utils";
import { RegistrationModal, ProofSubmissionModal, ParticipantsList } from "../components/EventFeatures";
import ConfirmModal from "../components/ConfirmModal";

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'leaderboard'>('events');
  const [selectedEventForReg, setSelectedEventForReg] = useState<any>(null);
  const [selectedEventForProof, setSelectedEventForProof] = useState<any>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  
  const { isAdmin, user } = useAuth();
  const { registrations, submissions, addRegistration, addSubmission, isUserRegistered } = useEventData();

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
    try {
      await deleteDoc(doc(db, "events", eventId)).catch(e => handleFirestoreError(e, OperationType.DELETE, `events/${eventId}`));
      toast.success("Event deleted successfully!");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    } finally {
      setEventToDelete(null);
    }
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleRegistrationSuccess = (reg: Registration) => {
    addRegistration(reg);
    setSelectedEventForReg(null);
    toast.success(`✅ You have successfully registered for ${reg.eventName}!`);
  };

  const handleSubmissionSuccess = (sub: Submission) => {
    addSubmission(sub);
    setSelectedEventForProof(null);
    toast.success(`🎉 Proof submitted! You earned +${sub.points} points!`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl mb-2">Community Events</h1>
            <p className="text-text-secondary">Join local eco-initiatives and earn bonus points.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-card p-1 rounded-xl border border-primary/10 flex shadow-sm">
              <button
                onClick={() => setActiveTab('events')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'events' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-secondary hover:text-primary"
                )}
              >
                <Calendar size={18} />
                Events
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'leaderboard' ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-secondary hover:text-primary"
                )}
              >
                <TrophyIcon size={18} />
                Participants
              </button>
            </div>
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

        {activeTab === 'events' ? (
          <>
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
                    userEmail={user?.email || null}
                    isRegistered={isUserRegistered(user?.email || '', event.id)}
                    onEdit={() => handleEdit(event)}
                    onDelete={() => setEventToDelete(event.id)}
                    onRegister={() => setSelectedEventForReg(event)}
                    onSubmitProof={() => setSelectedEventForProof(event)}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-card rounded-3xl card-shadow">
                  <p className="text-text-secondary">No upcoming events found. Check back later!</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-12">
            {events.map(event => (
              <div key={event.id} className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-text-primary">{event.title}</h3>
                    <p className="text-text-secondary text-sm">{new Date(event.startDate).toLocaleDateString()} • {event.location?.venueName || 'Online'}</p>
                  </div>
                </div>
                <ParticipantsList 
                  eventId={event.id}
                  registrations={registrations}
                  submissions={submissions}
                />
              </div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {isModalOpen && (
            <EventModal 
              event={editingEvent} 
              onClose={() => setIsModalOpen(false)} 
              onSuccess={fetchEvents}
            />
          )}
        </AnimatePresence>

        <RegistrationModal
          isOpen={!!selectedEventForReg}
          onClose={() => setSelectedEventForReg(null)}
          event={selectedEventForReg || { id: '', title: '' }}
          userEmail={user?.email || null}
          onSuccess={handleRegistrationSuccess}
        />

        <ProofSubmissionModal
          isOpen={!!selectedEventForProof}
          onClose={() => setSelectedEventForProof(null)}
          event={selectedEventForProof || { id: '', title: '' }}
          userEmail={user?.email || ''}
          onSuccess={handleSubmissionSuccess}
        />

        <ConfirmModal
          isOpen={!!eventToDelete}
          onClose={() => setEventToDelete(null)}
          onConfirm={() => eventToDelete && handleDelete(eventToDelete)}
          title="Delete Event"
          message="Are you sure you want to delete this event? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
        />
      </div>
    </DashboardLayout>
  );
}

function EventCard({ 
  event, 
  isAdmin, 
  userEmail,
  isRegistered,
  onEdit, 
  onDelete,
  onRegister,
  onSubmitProof
}: { 
  event: any, 
  isAdmin: boolean, 
  userEmail: string | null,
  isRegistered: boolean,
  onEdit: () => void, 
  onDelete: () => void,
  onRegister: () => void,
  onSubmitProof: () => void
}) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-card rounded-3xl card-shadow overflow-hidden flex flex-col group"
    >
      <div className="h-48 relative">
        <img src={event.bannerImageUrl || `https://picsum.photos/seed/${event.id}/800/400`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary">
          {event.eventType}
        </div>
        <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Star size={12} /> +{event.bonusPoints} pts
        </div>
        
        {isAdmin && (
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-2 bg-card text-primary rounded-lg shadow-lg hover:bg-primary hover:text-white transition-all"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 bg-card text-red-600 rounded-lg shadow-lg hover:bg-red-600 hover:text-white transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-2xl mb-2 text-text-primary">{event.title}</h3>
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
        
        <div className="space-y-3">
          {isRegistered ? (
            <div className="space-y-3">
              <button 
                disabled
                className="w-full py-3 bg-green-50 text-green-600 rounded-xl font-bold flex items-center justify-center gap-2 border border-green-100"
              >
                <CheckCircle2 size={18} />
                Registered
              </button>
              <button 
                onClick={onSubmitProof}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Camera size={18} />
                Submit Proof to Earn Points
              </button>
            </div>
          ) : (
            <button 
              onClick={onRegister}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              Register for Event
            </button>
          )}
          <button className="w-full py-2 text-text-secondary text-sm font-medium hover:text-primary transition-colors">
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}
