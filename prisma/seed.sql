-- Sample data for the local Docker database: run with `npm run db:seed`.
-- Safe to re-run: it deletes the rows it created last time (by their fixed ids)
-- and inserts them again. Rows you created yourself are left alone.
-- Emails use example.com and phone numbers use the fictional 555-01xx range.

BEGIN;

-- Only ever seed the local Docker database (Supabase's is named "postgres")
DO $$
BEGIN
  IF current_database() <> 'trc' THEN
    RAISE EXCEPTION 'Refusing to seed database "%": only the local "trc" database can be seeded', current_database();
  END IF;
END
$$;

-- Remove the previous seed (cascades to availability, positions and assignments)
DELETE FROM shifts WHERE id::text LIKE '5eed0000-0000-4000-8000-0000000002%';
DELETE FROM volunteers WHERE id::text LIKE '5eed0000-0000-4000-8000-0000000001%';

INSERT INTO positions (name) VALUES
  ('Receptionist'),
  ('Portal Workshop Assistant'),
  ('French Conversation Circle Leader')
ON CONFLICT (name) DO NOTHING;

INSERT INTO volunteers (id, name, email, phone, languages, notes) VALUES
  ('5eed0000-0000-4000-8000-000000000101', 'Amara Okafor', 'amara.okafor@example.com', '+1 (514) 555-0101', ARRAY['English', 'French']::language[], 'Prefers morning shifts.'),
  ('5eed0000-0000-4000-8000-000000000102', 'Diego Fernández', 'diego.fernandez@example.com', '+1 (514) 555-0102', ARRAY['Spanish', 'English', 'French']::language[], NULL),
  ('5eed0000-0000-4000-8000-000000000103', 'Layla Haddad', 'layla.haddad@example.com', '+1 (514) 555-0103', ARRAY['Arabic', 'French', 'English']::language[], 'Can help translate intake forms.'),
  ('5eed0000-0000-4000-8000-000000000104', 'Olena Kovalenko', 'olena.kovalenko@example.com', '+1 (514) 555-0104', ARRAY['Ukrainian', 'Russian', 'English']::language[], NULL),
  ('5eed0000-0000-4000-8000-000000000105', 'Wei Zhang', 'wei.zhang@example.com', '+1 (514) 555-0105', ARRAY['Mandarin', 'English']::language[], NULL),
  ('5eed0000-0000-4000-8000-000000000106', 'Reza Ahmadi', 'reza.ahmadi@example.com', '+1 (514) 555-0106', ARRAY['Farsi', 'English', 'French']::language[], 'On leave until January.'),
  -- no positions or availability yet
  ('5eed0000-0000-4000-8000-000000000107', 'Sophie Tremblay', 'sophie.tremblay@example.com', '+1 (514) 555-0107', ARRAY['French', 'English']::language[], NULL),
  -- only a name and an email so far, to check how sparse rows display
  ('5eed0000-0000-4000-8000-000000000108', 'Samir Benali', 'samir.benali@example.com', NULL, ARRAY[]::language[], NULL);

INSERT INTO volunteer_positions (volunteer_id, position_id)
SELECT v.volunteer_id::uuid, p.id
FROM (VALUES
  ('5eed0000-0000-4000-8000-000000000101', 'Receptionist'),
  ('5eed0000-0000-4000-8000-000000000101', 'Portal Workshop Assistant'),
  ('5eed0000-0000-4000-8000-000000000102', 'French Conversation Circle Leader'),
  ('5eed0000-0000-4000-8000-000000000103', 'Receptionist'),
  ('5eed0000-0000-4000-8000-000000000104', 'Portal Workshop Assistant'),
  ('5eed0000-0000-4000-8000-000000000105', 'Receptionist'),
  ('5eed0000-0000-4000-8000-000000000105', 'Portal Workshop Assistant'),
  ('5eed0000-0000-4000-8000-000000000106', 'Receptionist'),
  ('5eed0000-0000-4000-8000-000000000106', 'French Conversation Circle Leader')
) AS v (volunteer_id, position_name)
JOIN positions p ON p.name = v.position_name;

-- Minutes from midnight: 540 = 9 AM, 720 = 12 PM, 1020 = 5 PM
INSERT INTO volunteer_availability (volunteer_id, day, start_minute, end_minute) VALUES
  ('5eed0000-0000-4000-8000-000000000101', 'MONDAY', 540, 720),
  ('5eed0000-0000-4000-8000-000000000101', 'WEDNESDAY', 780, 1020),
  ('5eed0000-0000-4000-8000-000000000102', 'TUESDAY', 1080, 1200),
  ('5eed0000-0000-4000-8000-000000000102', 'THURSDAY', 1080, 1200),
  ('5eed0000-0000-4000-8000-000000000103', 'MONDAY', 540, 1020),
  ('5eed0000-0000-4000-8000-000000000103', 'FRIDAY', 540, 720),
  ('5eed0000-0000-4000-8000-000000000104', 'SATURDAY', 600, 840),
  ('5eed0000-0000-4000-8000-000000000105', 'WEDNESDAY', 570, 750),
  ('5eed0000-0000-4000-8000-000000000106', 'THURSDAY', 780, 960);

-- Past shifts (October 2026, Montreal time) so they don't crowd the calendar
INSERT INTO shifts (id, title, start_time, end_time, required_languages, preferred_languages, position_id)
SELECT s.id::uuid, s.title, s.start_time::timestamptz, s.end_time::timestamptz,
       s.required_languages::language[], ARRAY[]::language[], p.id
FROM (VALUES
  ('5eed0000-0000-4000-8000-000000000201', 'Front desk', '2026-10-05 09:00-04', '2026-10-05 12:00-04', '{}', 'Receptionist'),
  ('5eed0000-0000-4000-8000-000000000202', 'Portal workshop', '2026-10-07 13:00-04', '2026-10-07 16:00-04', '{}', 'Portal Workshop Assistant'),
  ('5eed0000-0000-4000-8000-000000000203', 'French conversation circle', '2026-10-08 18:00-04', '2026-10-08 20:00-04', '{French}', 'French Conversation Circle Leader'),
  ('5eed0000-0000-4000-8000-000000000204', 'Front desk', '2026-10-12 09:00-04', '2026-10-12 12:00-04', '{}', 'Receptionist'),
  ('5eed0000-0000-4000-8000-000000000205', 'Portal workshop', '2026-10-14 13:00-04', '2026-10-14 16:00-04', '{}', 'Portal Workshop Assistant')
) AS s (id, title, start_time, end_time, required_languages, position_name)
JOIN positions p ON p.name = s.position_name;

-- Expected counts in the volunteers table (approved = ACCEPTED, refused = REJECTED):
-- Amara 3/1, Diego 1/0, Layla 1/1, Olena 0/2, Wei 0/0 (expired + cancelled), Reza 1/0
INSERT INTO shift_assignments (volunteer_id, shift_id, status, attendance, sent_at, responded_at)
SELECT a.volunteer_id::uuid, a.shift_id::uuid, a.status::assignment_status,
       a.attendance::attendance, sh.start_time - interval '3 days',
       CASE WHEN a.status = 'EXPIRED' THEN NULL ELSE sh.start_time - interval '2 days' END
FROM (VALUES
  ('5eed0000-0000-4000-8000-000000000101', '5eed0000-0000-4000-8000-000000000201', 'ACCEPTED', 'ATTENDED'),
  ('5eed0000-0000-4000-8000-000000000101', '5eed0000-0000-4000-8000-000000000202', 'ACCEPTED', 'ATTENDED'),
  ('5eed0000-0000-4000-8000-000000000101', '5eed0000-0000-4000-8000-000000000204', 'REJECTED', 'UNMARKED'),
  ('5eed0000-0000-4000-8000-000000000101', '5eed0000-0000-4000-8000-000000000205', 'ACCEPTED', 'ATTENDED'),
  ('5eed0000-0000-4000-8000-000000000102', '5eed0000-0000-4000-8000-000000000203', 'ACCEPTED', 'ATTENDED'),
  ('5eed0000-0000-4000-8000-000000000103', '5eed0000-0000-4000-8000-000000000201', 'REJECTED', 'UNMARKED'),
  ('5eed0000-0000-4000-8000-000000000103', '5eed0000-0000-4000-8000-000000000204', 'ACCEPTED', 'NO_SHOW'),
  ('5eed0000-0000-4000-8000-000000000104', '5eed0000-0000-4000-8000-000000000202', 'REJECTED', 'UNMARKED'),
  ('5eed0000-0000-4000-8000-000000000104', '5eed0000-0000-4000-8000-000000000205', 'REJECTED', 'UNMARKED'),
  ('5eed0000-0000-4000-8000-000000000105', '5eed0000-0000-4000-8000-000000000202', 'EXPIRED', 'UNMARKED'),
  ('5eed0000-0000-4000-8000-000000000105', '5eed0000-0000-4000-8000-000000000204', 'CANCELLED_BY_VOLUNTEER', 'UNMARKED'),
  ('5eed0000-0000-4000-8000-000000000106', '5eed0000-0000-4000-8000-000000000203', 'ACCEPTED', 'EXCUSED')
) AS a (volunteer_id, shift_id, status, attendance)
JOIN shifts sh ON sh.id = a.shift_id::uuid;

COMMIT;
