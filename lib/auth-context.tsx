'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, isConfigured } from '@/lib/firebase';

// Deterministic colour from uid for guest / real users
function colorFromId(id: string): string {
  const COLORS = [
    '#7c3aed', '#4f46e5', '#0891b2', '#059669',
    '#d97706', '#dc2626', '#db2777', '#0d9488',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export interface AuthUser {
  uid: string;
  name: string;
  initial: string;
  color: string;
  photoURL: string | null;
  isGuest: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: (displayName: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(firebaseUser: User): AuthUser {
  const name = firebaseUser.displayName ?? 'User';
  return {
    uid:       firebaseUser.uid,
    name,
    initial:   name[0].toUpperCase(),
    color:     colorFromId(firebaseUser.uid),
    photoURL:  firebaseUser.photoURL,
    isGuest:   false,
  };
}

const GUEST_KEY = 'ss_guest_user';
const SESSION_COOKIE = '__ss_session';

function setCookie(value: string) {
  document.cookie = `${SESSION_COOKIE}=${value}; path=/; max-age=86400`;
}
function clearCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore guest from sessionStorage
    const raw = sessionStorage.getItem(GUEST_KEY);
    if (raw) {
      try {
        const g = JSON.parse(raw) as AuthUser;
        setUser(g);
        setCookie('guest');
        setLoading(false);
        return;
      } catch { /* ignore */ }
    }

    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const u = toAuthUser(firebaseUser);
        setUser(u);
        setCookie(firebaseUser.uid);
      } else {
        setUser(null);
        clearCookie();
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    if (!isConfigured) {
      alert('Firebase is not configured. Please add your NEXT_PUBLIC_FIREBASE_* env vars to .env.local');
      return;
    }
    const provider = new GoogleAuthProvider();
    const result   = await signInWithPopup(auth, provider);
    const u        = toAuthUser(result.user);
    setUser(u);
    setCookie(result.user.uid);
    // Persist display name if not set
    if (!result.user.displayName) {
      await updateProfile(result.user, { displayName: 'User' });
    }
  };

  const continueAsGuest = (displayName: string) => {
    const uid   = `guest-${Date.now()}`;
    const guest: AuthUser = {
      uid,
      name:    displayName,
      initial: displayName[0].toUpperCase(),
      color:   colorFromId(uid),
      photoURL: null,
      isGuest:  true,
    };
    sessionStorage.setItem(GUEST_KEY, JSON.stringify(guest));
    setCookie('guest');
    setUser(guest);
  };

  const signOut = async () => {
    sessionStorage.removeItem(GUEST_KEY);
    clearCookie();
    if (isConfigured && auth.currentUser) {
      await firebaseSignOut(auth);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, continueAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
