// src/app/(app)/clients/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';

interface Client {
  id: number;
  name: string;
  email?: string;
  created_at: string;
}

export default function ClientsPage() {
  const { data: clients, isLoading, error } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Errore nel caricamento clienti');
      return res.json();
    }
  });

  if (isLoading) return <div>Caricamento clienti...</div>;
  if (error) return <div>Errore nel recupero dei dati.</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Clienti</h1>
      <ul className="space-y-2">
        {clients?.map((client) => (
          <li key={client.id} className="border p-3 rounded-md">
            <h2 className="font-semibold">{client.name}</h2>
            {client.email && <p className="text-sm text-gray-600">{client.email}</p>}
            <p className="text-xs text-gray-400">Creato il: {new Date(client.created_at).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}