import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export const supabase = createClient(
    "https://zdcryvewjhsccriuzltq.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkY3J5dmV3amhzY2NyaXV6bHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2MzY3NjMsImV4cCI6MjA0NTIxMjc2M30.DTWEDs9DZQD-RD6HbZxn8zezyadmvWQo5Q4QubA0_YY"
);

