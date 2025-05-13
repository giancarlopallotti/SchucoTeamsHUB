// pages/api/projects.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '@/services/projects';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const projects = await getProjects();
      return res.status(200).json(projects);
    }

    if (req.method === 'POST') {
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ error: 'Missing project name' });
      const newProject = await createProject({ name, description });
      return res.status(201).json(newProject);
    }

    if (req.method === 'PUT') {
      const { id, name, description } = req.body;
      if (!id || !name) return res.status(400).json({ error: 'Missing id or name' });
      await updateProject(id, { name, description });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await deleteProject(id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
