import { GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { handleFirestoreError, OperationType } from "./firestore-error-handler";
import { Role } from "../types";

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Check if user profile exists
  const userDoc = await getDoc(doc(db, "users", user.uid));
  
  if (!userDoc.exists()) {
    // Create user profile if it doesn't exist
    const isAdmin = user.email === "arcadeabhi6@gmail.com";
    const username = user.email?.split('@')[0] || `user_${user.uid.slice(0, 5)}`;
    const fullName = user.displayName || "Eco Warrior";

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      username: username,
      email: user.email,
      fullName: fullName,
      avatarUrl: user.photoURL,
      city: "Unknown",
      country: "Unknown",
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      level: 1,
      experiencePoints: 0,
      role: isAdmin ? Role.ADMIN : Role.USER,
      createdAt: new Date().toISOString()
    }).catch(e => handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}`));

    // Create public profile
    await setDoc(doc(db, "users_public", user.uid), {
      uid: user.uid,
      username: username,
      fullName: fullName,
      avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      totalPoints: 0,
      currentStreak: 0,
      level: 1
    }).catch(e => handleFirestoreError(e, OperationType.CREATE, `users_public/${user.uid}`));
  }

  return user;
};
