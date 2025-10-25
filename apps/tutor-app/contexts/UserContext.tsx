/**
 * User Context
 * 
 * Provides child's name and avatar throughout the app
 * Data persisted from onboarding via localStorage
 */

import { createContext, useContext, ReactNode } from 'react';

export interface UserData {
  name: string;
  avatar: string;
  hasCompletedOnboarding: boolean;
}

interface UserContextType {
  userData: UserData | null;
  updateUserData: (data: Partial<UserData>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  value: UserContextType;
}

export function UserProvider({ children, value }: UserProviderProps) {
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
