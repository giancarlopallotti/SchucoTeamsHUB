// src/app/api/teams/route.ts
import { NextResponse } from 'next/server';
import dbPromise from '@/lib/db';

export async function GET() {
  const db = await dbPromise;
  const teams = await db.all('SELECT * FROM teams ORDER BY created_at DESC');
  return NextResponse.json(teams);
}

export async function POST(req: Request) {
  const db = await dbPromise;
  const body = await req.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const result = await db.run(
    'INSERT INTO teams (name) VALUES (?)',
    name
  );

  const newTeam = await db.get('SELECT * FROM teams WHERE id = ?', result.lastID);
  return NextResponse.json(newTeam);
}
