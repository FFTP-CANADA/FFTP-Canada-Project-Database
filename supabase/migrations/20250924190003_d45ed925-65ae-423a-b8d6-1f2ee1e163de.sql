-- Add missing columns to projects table to match the app's Project type
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS governance_type text,
ADD COLUMN IF NOT EXISTS country text CHECK (country IN ('Jamaica', 'Guyana', 'Haiti', 'Honduras', 'Canada')),
ADD COLUMN IF NOT EXISTS city_parish text,
ADD COLUMN IF NOT EXISTS partner_name text,
ADD COLUMN IF NOT EXISTS impact_area text CHECK (impact_area IN ('Food Security', 'Education', 'Housing & Community', 'Health', 'Economic Empowerment', 'Greatest Needs')),
ADD COLUMN IF NOT EXISTS fund_type text CHECK (fund_type IN ('Designated', 'Undesignated')),
ADD COLUMN IF NOT EXISTS is_designated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reported_spend numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS program text;

-- Update existing records to have default values for required fields
UPDATE public.projects 
SET 
  country = 'Jamaica',
  impact_area = 'Food Security',
  fund_type = 'Designated',
  is_designated = false,
  reported_spend = 0,
  start_date = COALESCE(start_date, created_at),
  program = ''
WHERE country IS NULL OR impact_area IS NULL OR fund_type IS NULL;