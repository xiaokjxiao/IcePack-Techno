import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import 'expo-sqlite/localStorage/install';

const supabaseUrl = "https://eeupytfnzfnzimapkoqh.supabase.co"
const supabasePublishableKey = "sb_publishable_KoQ415Jui0l7JQduGqlh1g_YerCIblB"

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})