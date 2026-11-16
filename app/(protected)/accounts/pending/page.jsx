
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import PendingAccountsTable from './PendingAccountsTable';
import styles from './pending.module.css';

export const runtime = 'nodejs';

export default async function PendingAccountsPage() {
  // 1. Verificar sesión y permisos
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: esAdmin, error: roleError } =
    await supabase.rpc('has_role', {
      required_role: 'administrador',
    });

  if (roleError || !esAdmin) {
    redirect('/home');
  }

  // 2. Cliente administrativo para consultar la vista protegida
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error('Falta la configuración administrativa de Supabase.');
  }

  const supabaseAdmin = createSupabaseClient(
    supabaseUrl,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  // 3. Obtener perfiles sin rol
  const { data: accounts, error: accountsError } =
    await supabaseAdmin
      .from('vista_cuentas_pendientes')
      .select('*')
      .order('nombre', { ascending: true });

  if (accountsError) {
    console.error('Error al consultar cuentas pendientes:', accountsError);
    throw new Error('No fue posible cargar las cuentas pendientes.');
  }

  // 4. Obtener roles disponibles
  const { data: roles, error: rolesError } =
    await supabaseAdmin
      .from('roles')
      .select('id, nombre')
      .in('nombre', ['alumno', 'maestro', 'administrador'])
      .order('nombre');

  if (rolesError) {
    console.error('Error al consultar roles:', rolesError);
    throw new Error('No fue posible cargar los roles.');
  }

  return (
  <main className={styles.pendingPage}>
    <header className={styles.pendingHeader}>
      <h1>Cuentas pendientes</h1>
      <p>
        Administra las cuentas que todavía no tienen un rol asignado.
      </p>
    </header>

    <PendingAccountsTable
      initialAccounts={accounts || []}
      roles={roles || []}
    />
  </main>
);
}