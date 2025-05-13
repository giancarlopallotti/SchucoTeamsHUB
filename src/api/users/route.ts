import { NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import path from "path";

// Percorso assoluto al file .db nella cartella "data"
const dbPath = path.join(process.cwd(), "data", "app_database.db");

export async function GET() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        return reject(NextResponse.json({ error: err.message }, { status: 500 }));
      }
    });

    db.all("SELECT * FROM users", (err, rows) => {
      if (err) {
        reject(NextResponse.json({ error: err.message }, { status: 500 }));
      } else {
        resolve(NextResponse.json(rows));
      }
    });

    db.close();
  });
}
