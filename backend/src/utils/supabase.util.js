// Small helper to centralize Supabase error handling
export async function run(query) {
  // `query` is the awaited supabase query (e.g. supabase.from('x').select(...))
  const res = await query;
  // supabase returns an object with { data, error }
  const { data, error } = res || {};
  if (error) {
    // Keep original error message when possible
    throw new Error(error.message || String(error));
  }
  return data;
}

export default { run };
