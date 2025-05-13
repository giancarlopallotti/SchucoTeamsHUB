// src/contexts/user-provider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "SUPERVISOR" | "AMMINISTRATORE" | "TECNICO" | "";

interface User {
  id: number;
  name: string;
  role: UserRole;
}

interface UserContextValue {
  user: User | null;
  isLoading: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    // Simulo fetch utente autenticato da cookie/localStorage
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = (role: UserRole) => {
    const u = { id: 1, name: "Utente", role };
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be inside UserProvider");
  return ctx;
}
