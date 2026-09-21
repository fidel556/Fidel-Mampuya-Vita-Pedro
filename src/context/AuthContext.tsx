import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loginAsDemo: (role: UserRole) => Promise<void>;
  switchRoleForDemo: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded primary admin from user metadata
const PRIMARY_ADMIN_EMAIL = 'fidelmampuya1@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile from Firestore or create default
  const syncProfile = async (user: User, forceRole?: UserRole) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);

      const isPrimaryAdmin = user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
      const resolvedRole: UserRole = forceRole || (isPrimaryAdmin ? 'admin' : 'user');

      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        // Keep primary admin role intact
        const updatedRole = isPrimaryAdmin ? 'admin' : (forceRole || data.role || 'user');
        const profile: UserProfile = {
          ...data,
          role: updatedRole,
        };
        setUserProfile(profile);
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || 'anonimo@empresa.com',
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuário Remoto',
          role: resolvedRole,
          department: isPrimaryAdmin ? 'Segurança da Informação & TI' : 'Operações Remotas',
          permissions: {
            canQuote: true,
            canApprove: resolvedRole === 'admin',
            canRevokeRealtime: resolvedRole === 'admin',
            canExportReports: true,
            canManageUsers: resolvedRole === 'admin',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn('Sync profile fallback to local memory state:', err);
      // Fallback local memory profile if offline or rules transition
      const isPrimaryAdmin = user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
      setUserProfile({
        uid: user.uid,
        email: user.email || 'usuario@empresa.com',
        displayName: user.displayName || 'Usuário Remoto',
        role: forceRole || (isPrimaryAdmin ? 'admin' : 'user'),
        department: 'Operações',
        permissions: {
          canQuote: true,
          canApprove: (forceRole || (isPrimaryAdmin ? 'admin' : 'user')) === 'admin',
          canRevokeRealtime: (forceRole || (isPrimaryAdmin ? 'admin' : 'user')) === 'admin',
          canExportReports: true,
          canManageUsers: (forceRole || (isPrimaryAdmin ? 'admin' : 'user')) === 'admin',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncProfile(result.user);
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      // If popup was blocked or denied in iframe, alert user friendly guidance
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        throw new Error('O popup de autenticação foi fechado ou bloqueado pelo navegador. Você também pode usar a conta rápida de teste abaixo.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Quick demo switcher for immediate testing and verification
  const loginAsDemo = async (role: UserRole) => {
    setLoading(true);
    const demoEmail = role === 'admin' ? PRIMARY_ADMIN_EMAIL : 'colaborador.remoto@empresa.com';
    const fakeUid = role === 'admin' ? 'demo-admin-uid-01' : 'demo-user-uid-02';
    
    const mockUser = {
      uid: fakeUid,
      email: demoEmail,
      displayName: role === 'admin' ? 'Fidel Mampuya (Admin)' : 'Carlos Mendes (Solicitante)',
      emailVerified: true,
      isAnonymous: false,
    } as unknown as User;

    setCurrentUser(mockUser);
    setUserProfile({
      uid: mockUser.uid,
      email: demoEmail,
      displayName: mockUser.displayName || 'Demo User',
      role,
      department: role === 'admin' ? 'Segurança da Informação & TI' : 'Engenharia de Software',
      permissions: {
        canQuote: true,
        canApprove: role === 'admin',
        canRevokeRealtime: role === 'admin',
        canExportReports: true,
        canManageUsers: role === 'admin',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setLoading(false);
  };

  const switchRoleForDemo = (role: UserRole) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        role,
        permissions: {
          ...userProfile.permissions,
          canApprove: role === 'admin',
          canRevokeRealtime: role === 'admin',
          canManageUsers: role === 'admin',
          canQuote: true,
          canExportReports: true,
        }
      });
    }
  };

  const isAdmin = userProfile?.role === 'admin' || currentUser?.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        signInWithGoogle,
        signOut,
        loginAsDemo,
        switchRoleForDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
