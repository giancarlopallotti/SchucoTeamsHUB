// src/app/(app)/teams/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';

interface Team {
  id: number;
  name: string;
  created_at: string;
}

export default function TeamsPage() {
  const {
    data: teams,
    isLoading,
    error,
  } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('/api/teams');
      if (!res.ok) throw new Error('Errore nel caricamento dei team');
      return res.json();
    },
  });

  if (isLoading) return <div>Caricamento team...</div>;
  if (error instanceof Error) return <div style={{ color: 'red' }}>Errore: {error.message}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Team</h1>
      <ul className="space-y-2">
        {teams?.map((team) => (
          <li key={team.id} className="border p-3 rounded-md">
            <h2 className="font-semibold">{team.name}</h2>
            <p className="text-xs text-gray-400">
              Creato il: {new Date(team.created_at).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}