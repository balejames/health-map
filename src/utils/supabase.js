import { createClient } from '@supabase/supabase-js'

// Create a single supabase client
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

// Form Utils
export const formActionDefault = {
  formProcess: false,
  formStatus: 200,
  formErrorMEssage: '',
  formSuccessMessage: '',
}
// Returns the session object, not just true/false
export const isAuthenticated = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error.message)
    return null
  }
  return data.session
}
