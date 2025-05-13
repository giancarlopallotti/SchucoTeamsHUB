// src/components/layout/header.tsx
"use client";

import React from "react";
import { useUser } from "@/contexts/user-provider";

export function Header() {
  const { user, login } = useUser();

  return (
    <header className="flex items-center justify-between bg-white p-4 border-b">
      <h1 className="text-2xl font-semibold">{user ? `Benvenuto, ${user.name}!` : "Benvenuto!"}</h1>
      {!user && (
        <button
          onClick={() => login("AMMINISTRATORE")}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Simula Login
        </button>
      )}
    </header>
  );
}
