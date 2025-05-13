// src/services/projects.ts
import dbPromise from "@/lib/db";
import type { Project } from "@/types";

export async function getProjects(): Promise<Project[]> {
  const db = await dbPromise;
  return db.all("SELECT * FROM projects ORDER BY created_at DESC");
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  const db = await dbPromise;
  return db.get("SELECT * FROM projects WHERE id = ?", id);
}

export async function createProject(data: { name: string; description?: string }): Promise<Project> {
  const db = await dbPromise;
  const result = await db.run(
    "INSERT INTO projects (name, description) VALUES (?, ?)",
    data.name,
    data.description || null
  );
  return getProjectById(result.lastID);
}

export async function updateProject(id: number, data: { name: string; description?: string }): Promise<void> {
  const db = await dbPromise;
  await db.run(
    "UPDATE projects SET name = ?, description = ? WHERE id = ?",
    data.name,
    data.description || null,
    id
  );
}

export async function deleteProject(id: number): Promise<void> {
  const db = await dbPromise;
  await db.run("DELETE FROM projects WHERE id = ?", id);
}
