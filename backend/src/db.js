import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tcwiwwjdujufcfnvctvo.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY

let supabase
if (!supabaseKey) {
	console.warn('Warning: SUPABASE_KEY is not set. Create backend/.env from .env.example or set SUPABASE_KEY in the environment before running the server.')
	// Export a minimal stub that fails with a clear message when used.
	const missingErr = () => {
		throw new Error('SUPABASE_KEY is required. Set SUPABASE_KEY environment variable or create backend/.env from .env.example')
	}
	supabase = {
		from() {
			missingErr()
		}
	}
} else {
	supabase = createClient(supabaseUrl, supabaseKey)
}

export default supabase
export { supabase }