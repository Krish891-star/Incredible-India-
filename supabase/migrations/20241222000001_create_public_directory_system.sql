-- =====================================================
-- PUBLIC DIRECTORY SYSTEM DATABASE SCHEMA
-- Migration: Create public directory system
-- Date: 2024-12-22
-- =====================================================

-- =====================================================
-- 1. CREATE PUBLIC DIRECTORY LISTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public_directory_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  passion_type TEXT NOT NULL CHECK (passion_type IN ('tour_guide', 'hotel_partner')),
  is_visible BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  listing_priority INTEGER DEFAULT 0,
  search_keywords TEXT[],
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, passion_type)
);

-- =====================================================
-- 2. CREATE USER VISIBILITY PREFERENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_visibility_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  show_contact_info BOOLEAN DEFAULT TRUE,
  show_pricing BOOLEAN DEFAULT TRUE,
  show_location BOOLEAN DEFAULT TRUE,
  show_reviews BOOLEAN DEFAULT TRUE,
  custom_bio TEXT,
  featured_images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public_directory_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_visibility_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES FOR PUBLIC DIRECTORY LISTINGS
-- =====================================================

-- Public can view visible listings
DROP POLICY IF EXISTS "Public can view visible directory listings" ON public_directory_listings;
CREATE POLICY "Public can view visible directory listings" ON public_directory_listings
  FOR SELECT USING (is_visible = true);

-- Users can view their own listings
DROP POLICY IF EXISTS "Users can view own directory listings" ON public_directory_listings;
CREATE POLICY "Users can view own directory listings" ON public_directory_listings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own listings
DROP POLICY IF EXISTS "Users can insert own directory listings" ON public_directory_listings;
CREATE POLICY "Users can insert own directory listings" ON public_directory_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
DROP POLICY IF EXISTS "Users can update own directory listings" ON public_directory_listings;
CREATE POLICY "Users can update own directory listings" ON public_directory_listings
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own listings
DROP POLICY IF EXISTS "Users can delete own directory listings" ON public_directory_listings;
CREATE POLICY "Users can delete own directory listings" ON public_directory_listings
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. CREATE RLS POLICIES FOR VISIBILITY PREFERENCES
-- =====================================================

-- Users can manage their own visibility preferences
DROP POLICY IF EXISTS "Users can manage own visibility preferences" ON user_visibility_preferences;
CREATE POLICY "Users can manage own visibility preferences" ON user_visibility_preferences
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 6. CREATE INDEXES FOR SEARCH PERFORMANCE
-- =====================================================

-- Indexes for public_directory_listings
CREATE INDEX IF NOT EXISTS idx_public_directory_listings_user_id ON public_directory_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_public_directory_listings_passion_type ON public_directory_listings(passion_type);
CREATE INDEX IF NOT EXISTS idx_public_directory_listings_visible ON public_directory_listings(is_visible);
CREATE INDEX IF NOT EXISTS idx_public_directory_listings_featured ON public_directory_listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_public_directory_listings_priority ON public_directory_listings(listing_priority DESC);
CREATE INDEX IF NOT EXISTS idx_public_directory_listings_updated ON public_directory_listings(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_public_directory_listings_search_keywords ON public_directory_listings USING GIN(search_keywords);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_public_directory_listings_visible_passion ON public_directory_listings(is_visible, passion_type);
CREATE INDEX IF NOT EXISTS idx_public_directory_listings_visible_featured ON public_directory_listings(is_visible, is_featured);

-- Indexes for user_visibility_preferences
CREATE INDEX IF NOT EXISTS idx_user_visibility_preferences_user_id ON user_visibility_preferences(user_id);

-- =====================================================
-- 7. CREATE FUNCTIONS FOR DIRECTORY MANAGEMENT
-- =====================================================

-- Function to automatically create directory listing when registration is completed
CREATE OR REPLACE FUNCTION create_directory_listing_on_registration()
RETURNS TRIGGER AS $$
DECLARE
  passion_key TEXT;
  registration_complete BOOLEAN;
BEGIN
  -- Determine passion type from the table being updated
  IF TG_TABLE_NAME = 'tour_guides' THEN
    passion_key := 'tour_guide';
    -- Check if tour guide registration is complete (has required fields)
    registration_complete := (
      NEW.full_name IS NOT NULL AND NEW.full_name != '' AND
      NEW.phone IS NOT NULL AND NEW.phone != '' AND
      NEW.experience_years IS NOT NULL AND
      NEW.hourly_rate IS NOT NULL AND
      NEW.specialties IS NOT NULL AND array_length(NEW.specialties, 1) > 0 AND
      NEW.address IS NOT NULL AND NEW.address != ''
    );
  ELSIF TG_TABLE_NAME = 'hotel_partners' THEN
    passion_key := 'hotel_partner';
    -- Check if hotel partner registration is complete (has required fields)
    registration_complete := (
      NEW.company_name IS NOT NULL AND NEW.company_name != '' AND
      NEW.hotel_type IS NOT NULL AND NEW.hotel_type != '' AND
      NEW.address IS NOT NULL AND NEW.address != '' AND
      NEW.amenities IS NOT NULL AND array_length(NEW.amenities, 1) > 0
    );
  ELSE
    RETURN NEW;
  END IF;

  -- Only create/update directory listing if registration is complete
  IF registration_complete THEN
    -- Create or update directory listing
    INSERT INTO public_directory_listings (user_id, passion_type, is_visible, search_keywords)
    VALUES (
      NEW.user_id,
      passion_key,
      true,
      CASE 
        WHEN TG_TABLE_NAME = 'tour_guides' THEN 
          array_cat(
            ARRAY[NEW.full_name, NEW.city, NEW.state],
            COALESCE(NEW.specialties, ARRAY[]::TEXT[])
          )
        WHEN TG_TABLE_NAME = 'hotel_partners' THEN
          array_cat(
            ARRAY[NEW.company_name, NEW.city, NEW.state, NEW.hotel_type],
            COALESCE(NEW.amenities, ARRAY[]::TEXT[])
          )
      END
    )
    ON CONFLICT (user_id, passion_type) 
    DO UPDATE SET
      is_visible = true,
      search_keywords = EXCLUDED.search_keywords,
      last_updated = NOW();
  ELSE
    -- Remove directory listing if registration becomes incomplete
    DELETE FROM public_directory_listings 
    WHERE user_id = NEW.user_id AND passion_type = passion_key;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove directory listing when account is deactivated
CREATE OR REPLACE FUNCTION remove_directory_listing_on_deactivation()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove directory listing when user becomes inactive
  IF OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE public_directory_listings 
    SET is_visible = false, last_updated = NOW()
    WHERE user_id = NEW.user_id;
  -- Restore directory listing when user becomes active again
  ELSIF OLD.is_active = false AND NEW.is_active = true THEN
    UPDATE public_directory_listings 
    SET is_visible = true, last_updated = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CREATE TRIGGERS FOR AUTOMATIC DIRECTORY MANAGEMENT
-- =====================================================

-- Triggers for tour_guides table
DROP TRIGGER IF EXISTS tour_guides_directory_listing_trigger ON tour_guides;
CREATE TRIGGER tour_guides_directory_listing_trigger
  AFTER INSERT OR UPDATE ON tour_guides
  FOR EACH ROW EXECUTE FUNCTION create_directory_listing_on_registration();

-- Triggers for hotel_partners table
DROP TRIGGER IF EXISTS hotel_partners_directory_listing_trigger ON hotel_partners;
CREATE TRIGGER hotel_partners_directory_listing_trigger
  AFTER INSERT OR UPDATE ON hotel_partners
  FOR EACH ROW EXECUTE FUNCTION create_directory_listing_on_registration();

-- Triggers for deactivation handling on tour_guides
DROP TRIGGER IF EXISTS tour_guides_deactivation_trigger ON tour_guides;
CREATE TRIGGER tour_guides_deactivation_trigger
  AFTER UPDATE ON tour_guides
  FOR EACH ROW EXECUTE FUNCTION remove_directory_listing_on_deactivation();

-- Triggers for deactivation handling on hotel_partners
DROP TRIGGER IF EXISTS hotel_partners_deactivation_trigger ON hotel_partners;
CREATE TRIGGER hotel_partners_deactivation_trigger
  AFTER UPDATE ON hotel_partners
  FOR EACH ROW EXECUTE FUNCTION remove_directory_listing_on_deactivation();

-- =====================================================
-- 9. CREATE UTILITY FUNCTIONS FOR DIRECTORY QUERIES
-- =====================================================

-- Function to get public profile data for a user
CREATE OR REPLACE FUNCTION get_public_profile(user_uuid UUID, profile_type TEXT)
RETURNS JSONB AS $$
DECLARE
  profile_data JSONB;
  visibility_prefs RECORD;
BEGIN
  -- Get visibility preferences
  SELECT * INTO visibility_prefs
  FROM user_visibility_preferences
  WHERE user_id = user_uuid;

  -- Get profile data based on type
  IF profile_type = 'tour_guide' THEN
    SELECT jsonb_build_object(
      'id', tg.id,
      'user_id', tg.user_id,
      'full_name', tg.full_name,
      'bio', COALESCE(visibility_prefs.custom_bio, tg.bio),
      'company_name', tg.company_name,
      'hourly_rate', CASE WHEN COALESCE(visibility_prefs.show_pricing, true) THEN tg.hourly_rate ELSE NULL END,
      'experience_years', tg.experience_years,
      'specialties', tg.specialties,
      'languages_spoken', tg.languages_spoken,
      'city', CASE WHEN COALESCE(visibility_prefs.show_location, true) THEN tg.city ELSE NULL END,
      'state', CASE WHEN COALESCE(visibility_prefs.show_location, true) THEN tg.state ELSE NULL END,
      'phone', CASE WHEN COALESCE(visibility_prefs.show_contact_info, true) THEN tg.phone ELSE NULL END,
      'email', CASE WHEN COALESCE(visibility_prefs.show_contact_info, true) THEN tg.email ELSE NULL END,
      'website', tg.website,
      'verified', tg.verified,
      'is_active', tg.is_active
    ) INTO profile_data
    FROM tour_guides tg
    WHERE tg.user_id = user_uuid;
    
  ELSIF profile_type = 'hotel_partner' THEN
    SELECT jsonb_build_object(
      'id', hp.id,
      'user_id', hp.user_id,
      'full_name', hp.full_name,
      'bio', COALESCE(visibility_prefs.custom_bio, hp.bio),
      'company_name', hp.company_name,
      'hotel_type', hp.hotel_type,
      'amenities', hp.amenities,
      'city', CASE WHEN COALESCE(visibility_prefs.show_location, true) THEN hp.city ELSE NULL END,
      'state', CASE WHEN COALESCE(visibility_prefs.show_location, true) THEN hp.state ELSE NULL END,
      'phone', CASE WHEN COALESCE(visibility_prefs.show_contact_info, true) THEN hp.phone ELSE NULL END,
      'email', CASE WHEN COALESCE(visibility_prefs.show_contact_info, true) THEN hp.email ELSE NULL END,
      'website', hp.website,
      'is_verified', hp.is_verified,
      'is_active', hp.is_active
    ) INTO profile_data
    FROM hotel_partners hp
    WHERE hp.user_id = user_uuid;
  END IF;

  RETURN profile_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search directory listings
CREATE OR REPLACE FUNCTION search_directory_listings(
  search_text TEXT DEFAULT NULL,
  passion_filter TEXT DEFAULT NULL,
  location_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  passion_type TEXT,
  profile_data JSONB,
  listing_priority INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pdl.user_id,
    pdl.passion_type,
    get_public_profile(pdl.user_id, pdl.passion_type) as profile_data,
    pdl.listing_priority,
    pdl.last_updated
  FROM public_directory_listings pdl
  WHERE pdl.is_visible = true
    AND (passion_filter IS NULL OR pdl.passion_type = passion_filter)
    AND (search_text IS NULL OR pdl.search_keywords && string_to_array(lower(search_text), ' '))
    AND (location_filter IS NULL OR EXISTS (
      SELECT 1 FROM unnest(pdl.search_keywords) AS keyword
      WHERE lower(keyword) LIKE '%' || lower(location_filter) || '%'
    ))
  ORDER BY pdl.listing_priority DESC, pdl.last_updated DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public_directory_listings TO authenticated;
GRANT ALL ON user_visibility_preferences TO authenticated;