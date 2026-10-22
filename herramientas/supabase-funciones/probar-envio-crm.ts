// INACTIVA: era una funcion temporal de prueba (14-oct-2026). Se puede eliminar desde el panel de Supabase.
Deno.serve(() => new Response(JSON.stringify({ error: 'inactiva' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
