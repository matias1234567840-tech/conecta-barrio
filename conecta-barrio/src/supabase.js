import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pldicwgkjqqriywvwcsl.supabase.co'
const supabaseKey = 'sb_publishable_Ms5Z185ALro_1gYH747Hpg_5PQS1CZB'

export const supabase = createClient(supabaseUrl, supabaseKey)