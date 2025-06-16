/*
  # Create rules table for fraud detection rules

  1. New Tables
    - `rules`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users) - Links to authenticated user
      - `name` (text) - Rule name
      - `description` (text) - Rule description
      - `category` (text) - Rule category (Behavioral, Payment Method, etc.)
      - `condition` (text) - Rule condition/logic
      - `severity` (text) - Rule severity (low, medium, high)
      - `status` (text) - Rule status (active, inactive, warning)
      - `log_only` (boolean) - Whether rule only logs without blocking
      - `catches` (integer) - Number of fraud cases caught
      - `false_positives` (integer) - Number of false positives
      - `effectiveness` (integer) - Effectiveness percentage
      - `is_deleted` (boolean) - Soft delete flag
      - `created_at` (timestamptz) - When record was created
      - `updated_at` (timestamptz) - When record was last updated

  2. Security
    - Enable RLS on `rules` table
    - Add policies for authenticated users to manage only their own rules
    - Ensure soft-deleted rules are excluded from normal queries

  3. Performance
    - Add indexes for user_id and is_deleted for fast filtering
    - Add trigger for automatic updated_at timestamps
*/

-- Create the rules table
CREATE TABLE IF NOT EXISTS rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Behavioral',
  condition text NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'warning')),
  log_only boolean NOT NULL DEFAULT false,
  catches integer NOT NULL DEFAULT 0,
  false_positives integer NOT NULL DEFAULT 0,
  effectiveness integer NOT NULL DEFAULT 0 CHECK (effectiveness >= 0 AND effectiveness <= 100),
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS - Users can only access their own rules
CREATE POLICY "Users can view own rules"
  ON rules
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Users can insert own rules"
  ON rules
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rules"
  ON rules
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Note: We don't allow DELETE operations, only soft deletes via UPDATE
CREATE POLICY "Users can soft delete own rules"
  ON rules
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rules_user_id ON rules(user_id);
CREATE INDEX IF NOT EXISTS idx_rules_is_deleted ON rules(is_deleted);
CREATE INDEX IF NOT EXISTS idx_rules_user_active ON rules(user_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_rules_status ON rules(status);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_rules_updated_at
  BEFORE UPDATE ON rules
  FOR EACH ROW
  EXECUTE FUNCTION update_rules_updated_at();

-- Insert some sample rules for testing (these will be tied to the first user who signs up)
-- Note: In production, these would be created through the application