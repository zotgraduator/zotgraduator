import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://lgsoszwnwkewajctxsud.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc29zendud2tld2FqY3R4c3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTE5OTYsImV4cCI6MjA2Mzc4Nzk5Nn0.poGzn6fvWJt9uygLSuOtKb7ppDTTR3VYLSXE2Doqlgo";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Make sure to set the environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
