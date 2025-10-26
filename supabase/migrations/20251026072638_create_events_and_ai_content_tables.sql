/*
  # Create Events and AI Generated Content Tables

  1. New Tables
    - `events`
      - `id` (uuid, primary key) - Unique identifier for each event
      - `user_id` (uuid, foreign key to auth.users) - Owner of the event
      - `event_name` (text) - Name of the event
      - `event_type` (text) - Type of event (conference, wedding, etc.)
      - `description` (text) - Event description
      - `date` (date) - Event date
      - `time` (time) - Event time
      - `location` (text) - Event location/venue
      - `city` (text) - City where event is held
      - `venue_type` (text) - Type of venue
      - `audience_size` (integer) - Expected number of attendees
      - `duration` (text) - Event duration
      - `created_at` (timestamptz) - When the event was created
      - `updated_at` (timestamptz) - When the event was last updated
    
    - `ai_generated_content`
      - `id` (uuid, primary key) - Unique identifier for AI content
      - `event_id` (uuid, foreign key to events) - Associated event
      - `user_id` (uuid, foreign key to auth.users) - Owner of the content
      - `content_type` (text) - Type of content (event_plan, email, social_media, etc.)
      - `prompt` (text) - The prompt used to generate the content
      - `generated_content` (jsonb) - The AI-generated content
      - `metadata` (jsonb) - Additional metadata
      - `created_at` (timestamptz) - When the content was generated
      - `updated_at` (timestamptz) - When the content was last updated

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Users can only read/write their own events and AI content
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name text NOT NULL DEFAULT '',
  event_type text NOT NULL DEFAULT '',
  description text DEFAULT '',
  date date,
  time time,
  location text DEFAULT '',
  city text DEFAULT '',
  venue_type text DEFAULT '',
  audience_size integer DEFAULT 0,
  duration text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_generated_content table
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL DEFAULT 'event_plan',
  prompt text DEFAULT '',
  generated_content jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;

-- Policies for events table
CREATE POLICY "Users can view their own events"
  ON events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for ai_generated_content table
CREATE POLICY "Users can view their own AI content"
  ON ai_generated_content FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI content"
  ON ai_generated_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI content"
  ON ai_generated_content FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI content"
  ON ai_generated_content FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);
CREATE INDEX IF NOT EXISTS events_created_at_idx ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_generated_content_event_id_idx ON ai_generated_content(event_id);
CREATE INDEX IF NOT EXISTS ai_generated_content_user_id_idx ON ai_generated_content(user_id);
CREATE INDEX IF NOT EXISTS ai_generated_content_content_type_idx ON ai_generated_content(content_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_generated_content_updated_at ON ai_generated_content;
CREATE TRIGGER update_ai_generated_content_updated_at
  BEFORE UPDATE ON ai_generated_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
