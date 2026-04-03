import { useState, useEffect } from 'react';

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
}

export interface Submission {
  id: string;
  userEmail: string;
  eventId: string;
  eventName: string;
  fileName: string;
  description: string;
  type: string;
  points: number;
  status: 'Pending' | 'Verified';
  timestamp: string;
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

  useEffect(() => {
    const savedRegs = localStorage.getItem('event_registrations');
    const savedSubs = localStorage.getItem('event_submissions');
    const savedQuiz = localStorage.getItem('quiz_scores');
    if (savedRegs) setRegistrations(JSON.parse(savedRegs));
    if (savedSubs) setSubmissions(JSON.parse(savedSubs));
    if (savedQuiz) setQuizScores(JSON.parse(savedQuiz));
  }, []);

  const addRegistration = (reg: Registration) => {
    const newRegs = [...registrations, reg];
    setRegistrations(newRegs);
    localStorage.setItem('event_registrations', JSON.stringify(newRegs));
  };

  const addSubmission = (sub: Submission) => {
    const newSubs = [...submissions, sub];
    setSubmissions(newSubs);
    localStorage.setItem('event_submissions', JSON.stringify(newSubs));
  };

  const addQuizScore = (score: QuizScore) => {
    const newScores = [...quizScores, score];
    setQuizScores(newScores);
    localStorage.setItem('quiz_scores', JSON.stringify(newScores));
  };

  const getUserPoints = (email: string) => {
    const subPoints = submissions
      .filter(s => s.userEmail === email)
      .reduce((total, s) => total + s.points, 0);
    const quizPoints = quizScores
      .filter(q => q.userEmail === email)
      .reduce((total, q) => total + q.score, 0);
    return subPoints + quizPoints;
  };

  const isUserRegistered = (email: string, eventId: string) => {
    return registrations.some(r => r.email === email && r.eventId === eventId);
  };

  return {
    registrations,
    submissions,
    quizScores,
    addRegistration,
    addSubmission,
    addQuizScore,
    getUserPoints,
    isUserRegistered
  };
};
