// Small helper to centralize Supabase error handling
export async function run(query) {
  // `query` is the awaited supabase query (e.g. supabase.from('x').select(...))
  const res = await query;
  // supabase returns an object with { data, error }
  const { data, error } = res || {};
  if (error) {
    const err = new Error(error.message || String(error));
    // Preserve Postgres error code for upstream handling (e.g. 23505 = unique_violation)
    err.code = error.code || null;
    err.details = error.details || null;
    throw err;
  }
  return data;
}

export default { run };
