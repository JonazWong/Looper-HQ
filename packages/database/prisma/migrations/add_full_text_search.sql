-- Full-Text Search Enhancement for PublicCase
-- This migration adds PostgreSQL full-text search capabilities to the PublicCase table

-- Add search_vector column if it doesn't exist
ALTER TABLE "PublicCase" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create Chinese text search configuration (using simple configuration for CJK support)
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS chinese (COPY = simple);

-- Create function to update search_vector
CREATE OR REPLACE FUNCTION public_case_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('chinese', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('chinese', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('chinese', coalesce(NEW.category::text, '')), 'C') ||
    setweight(to_tsvector('chinese', coalesce(NEW.court, '')), 'C') ||
    setweight(to_tsvector('chinese', array_to_string(NEW.keywords, ' ')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS public_case_search_vector_trigger ON "PublicCase";

-- Create trigger to automatically update search_vector
CREATE TRIGGER public_case_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "PublicCase"
  FOR EACH ROW
  EXECUTE FUNCTION public_case_search_vector_update();

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS public_case_search_idx ON "PublicCase" USING GIN(search_vector);

-- Update search_vector for existing records
UPDATE "PublicCase" SET search_vector = 
  setweight(to_tsvector('chinese', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('chinese', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('chinese', coalesce(category::text, '')), 'C') ||
  setweight(to_tsvector('chinese', coalesce(court, '')), 'C') ||
  setweight(to_tsvector('chinese', array_to_string(keywords, ' ')), 'D');
