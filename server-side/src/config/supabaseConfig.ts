import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string = 'https://sgycieotwvcrdswrsuck.supabase.co';
const supabaseKey: string = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneWNpZW90d3ZjcmRzd3JzdWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDUyMzgsImV4cCI6MjA2OTk4MTIzOH0.ipulWLzbOIG8gqeTgDWraMbn1XWUgONlYHm9RSPwcz0';

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('Warning: Supabase environment variables are not set. Supabase client will not be available.');
}

export { supabase };
export default supabase; 