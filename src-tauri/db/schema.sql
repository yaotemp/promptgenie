DROP TABLE IF EXISTS prompt_tags;
DROP TABLE IF EXISTS prompts;

CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  prompt_group_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  is_latest INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  note TEXT,
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prompt_tags (
  prompt_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (prompt_id, tag_id),
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);