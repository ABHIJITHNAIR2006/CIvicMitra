import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from './firestore-error-handler';

export interface Registration {
  id: string;
  eventId: string;
  eventName: string;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  teamName?: string;
  memberCount: string;
  registeredAt: string;
  userId?: string;
}

export interface Submission {
  id: string;
  userId?: string;
  userEmail: string;
  eventId: string;
  eventName: string;
  fileName: string;
  description: string;
  type: string;
  points: number;
  status: 'Pending' | 'Verified';
  timestamp: string;
  aiVerificationStatus?: string;
  proofUrl?: string;
}

export interface QuizScore {
  id: string;
  userEmail: string;
  score: number;
  timestamp: string;
}

export const useEventData = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen for public participants
    const unsubParticipants = onSnapshot(
      collection(db, "event_participants_public"),
      (snap) => {
        const regs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
        setRegistrations(regs);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "event_participants_public")
    );

    // 2. Listen for completions (publicly visible)
    const unsubCompletions = onSnapshot(
      collection(db, "completions"),
      (snap) => {
        const subs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
        setSubmissions(subs);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "completions")
    );

    // 3. Quiz scores (if needed, though quiz_attempts is used elsewhere)
    const unsubQuiz = onSnapshot(
      collection(db, "quiz_attempts"),
      (snap) => {
        const scores = snap.docs.map(doc => ({ 
          id: doc.id, 
          userEmail: doc.data().userId, // Note: using userId as email placeholder if needed
          score: doc.data().score,
          timestamp: doc.data().submittedAt
        } as QuizScore));
        setQuizScores(scores);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "quiz_attempts")
    );

    setLoading(false);

    return () => {
      unsubParticipants();
      unsubCompletions();
      unsubQuiz();
    };
  }, []);

  const addRegistration = useCallback((reg: Registration) => {
    // No-op for local state, as onSnapshot handles it
  }, []);

  const addSubmission = useCallback((sub: Submission) => {
    // No-op for local state, as onSnapshot handles it
  }, []);

  const addQuizScore = useCallback((score: QuizScore) => {
    // No-op for local state, as onSnapshot handles it
  }, []);

  const getUserPoints = (userId: string) => {
    const subPoints = submissions
      .filter(s => s.userId === userId)
      .reduce((total, s) => total + s.points, 0);
    const quizPoints = quizScores
      .filter(q => q.userEmail === userId) // quiz_attempts uses userId as userEmail in my previous edit
      .reduce((total, q) => total + q.score, 0);
    return subPoints + quizPoints;
  };

  const isUserRegistered = (eventId: string) => {
    return registrations.some(r => r.userId === auth.currentUser?.uid && r.eventId === eventId);
  };

  return {
    registrations,
    submissions,
    quizScores,
    loading,
    addRegistration,
    addSubmission,
    addQuizScore,
    getUserPoints,
    isUserRegistered
  };
};
