import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ujkqzetpxfwpiyhvpmxu.supabase.co'
const supabaseKey = 'sb_publishable_5QIlGHeLjWspZOPXi6_cMA_maJvoDns'

export const supabase = createClient(supabaseUrl, supabaseKey)
