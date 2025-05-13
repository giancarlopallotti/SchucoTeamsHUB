// pages/api/teams.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import * as teamsService from '@/services/teams';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const data = await teamsService.getAllTeams();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Missing team name' });
      const newTeam = await teamsService.createTeam(name);
      return res.status(201).json(newTeam);
    }

    if (req.method === 'PUT') {
      const { id, name } = req.body;
      if (!id || !name) return res.status(400).json({ error: 'Missing id or name' });
      await teamsService.updateTeam(id, name);
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      await teamsService.deleteTeam(id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
