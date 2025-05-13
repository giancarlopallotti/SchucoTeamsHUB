// src/services/clients.ts
import dbPromise from "@/lib/db";
import type { Client } from "@/types";

export async function getClients(): Promise<Client[]> {
  const db = await dbPromise;
  return db.all("SELECT * FROM clients ORDER BY created_at DESC");
}

export async function getClientById(id: number): Promise<Client | undefined> {
  const db = await dbPromise;
  return db.get("SELECT * FROM clients WHERE id = ?", id);
}

export async function createClient(data: { name: string; email?: string }): Promise<Client> {
  const db = await dbPromise;
  const result = await db.run(
    "INSERT INTO clients (name, email) VALUES (?, ?)",
    data.name,
    data.email || null
  );
  return getClientById(result.lastID);
}

export async function updateClient(id: number, data: { name: string; email?: string }): Promise<void> {
  const db = await dbPromise;
  await db.run(
    "UPDATE clients SET name = ?, email = ? WHERE id = ?",
    data.name,
    data.email || null,
    id
  );
}

export async function deleteClient(id: number): Promise<void> {
  const db = await dbPromise;
  await db.run("DELETE FROM clients WHERE id = ?", id);
}