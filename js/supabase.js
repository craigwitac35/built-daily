import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://ruhyfgginfsteqoczcpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1aHlmZ2dpbmZzdGVxb2N6Y3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODUxODcsImV4cCI6MjA4OTI2MTE4N30.vhB5TXEZsouqR2Hj7GSsF4EAy_fG0mx6USAshuKr2Cw';

export const supabase = createClient(supabaseUrl, supabaseKey);
