import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  'https://nojcckbxjmhhagtnnijz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vamNja2J4am1oaGFndG5uaWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjgxOTcsImV4cCI6MjA5NDkwNDE5N30.2kKHEeG06xQ3RIu5hHqFU_HCQEd2olTm_hzxYyTRMlA'
);