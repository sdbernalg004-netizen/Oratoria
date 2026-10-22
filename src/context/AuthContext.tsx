import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut, testConnection } from '../lib/firebase';
import { syncUserProfile } from '../services/speechCloudService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  error: null,
  clearError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate connection at boot
    testConnection().catch((err) => console.warn('Firebase test connection:', err));

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        try {
          await syncUserProfile({
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
          });
        } catch (err) {
          console.error('Error syncing profile:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Error al iniciar sesión con Google');
      }
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await logOut();
    } catch (err: any) {
      setError(err.message || 'Error al cerrar sesión');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
