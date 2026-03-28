-- Marathon Management App - Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users / Participants table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  category TEXT NOT NULL DEFAULT 'Full Marathon',
  bib_number TEXT UNIQUE,
  checkin_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  finish_time INTERVAL NOT NULL,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_category ON users(category);
CREATE INDEX IF NOT EXISTS idx_users_bib_number ON users(bib_number);
CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_finish_time ON results(finish_time);
CREATE INDEX IF NOT EXISTS idx_results_rank ON results(rank);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Public read access for leaderboard/tracking
CREATE POLICY "Allow public read on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read on results" ON results FOR SELECT USING (true);

-- Service role can insert/update/delete (used by API routes with service role key)
CREATE POLICY "Allow service role full access on users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access on results" ON results
  FOR ALL USING (auth.role() = 'service_role');
