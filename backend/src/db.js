import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

let supabase
if (!supabaseKey || !supabaseUrl) {
	console.warn('Warning: SUPABASE_URL or SUPABASE_KEY is not set. Create backend/.env or set environment variables before running the server.')
	const missingErr = () => {
		throw new Error('SUPABASE_URL and SUPABASE_KEY are required. Set them in the environment or create backend/.env')
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