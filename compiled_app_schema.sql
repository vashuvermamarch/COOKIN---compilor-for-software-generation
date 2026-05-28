-- compiled_app_schema.sql
-- AI Generated database script

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "users" (
  "id" INTEGER PRIMARY KEY NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "projects" (
  "id" INTEGER PRIMARY KEY NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "owner_id" INTEGER NOT NULL,
  FOREIGN KEY ("owner_id") REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" INTEGER PRIMARY KEY NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "project_id" INTEGER NOT NULL,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id")
);
