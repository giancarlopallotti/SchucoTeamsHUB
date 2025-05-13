import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.resolve(process.cwd(), "src/data/app_database.db"));

export default db;
