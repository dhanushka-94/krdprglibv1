-- Add company and unit to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS unit TEXT;

-- User category assignments (Programme Managers can upload only to assigned categories)
CREATE TABLE IF NOT EXISTS user_category_assignments (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, category_id)
);

-- User subcategory assignments (Programme Managers can upload only to assigned subcategories)
CREATE TABLE IF NOT EXISTS user_subcategory_assignments (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, subcategory_id)
);

CREATE INDEX IF NOT EXISTS idx_user_category_assignments_user ON user_category_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subcategory_assignments_user ON user_subcategory_assignments(user_id);

ALTER TABLE user_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subcategory_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for user_category_assignments" ON user_category_assignments;
CREATE POLICY "Allow all for user_category_assignments" ON user_category_assignments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for user_subcategory_assignments" ON user_subcategory_assignments;
CREATE POLICY "Allow all for user_subcategory_assignments" ON user_subcategory_assignments FOR ALL USING (true) WITH CHECK (true);
