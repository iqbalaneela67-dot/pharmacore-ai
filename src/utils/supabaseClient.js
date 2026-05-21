import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://nojcckbxjmhhagtnnijz.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vamNja2J4am1oaGFndG5uaWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjgxOTcsImV4cCI6MjA5NDkwNDE5N30.2kKHEeG06xQ3RIu5hHqFU_HCQEd2olTm_hzxYyTRMlA';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);