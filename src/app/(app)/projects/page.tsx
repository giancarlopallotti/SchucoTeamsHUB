// src/app/(app)/projects/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    }
  });

  if (isLoading) return <div>Caricamento in corso...</div>;
  if (error) return <div>Errore nel caricamento dei progetti.</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Progetti</h1>
      <ul className="space-y-2">
        {projects?.map((project) => (
          <li key={project.id} className="border p-3 rounded-md">
            <h2 className="font-semibold">{project.name}</h2>
            {project.description && <p className="text-sm text-gray-600">{project.description}</p>}
            <p className="text-xs text-gray-400">Creato il: {new Date(project.created_at).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
