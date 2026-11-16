import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import UserInvite from './UserInvite';
import styles from './accounts.module.css';

export default async function AccountsPage() {
  await connection();

  const supabase = await createClient();

  // Comprobar sesión
  const { data: { claims }, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claims) {
    redirect('/login');
  }

  // Comprobar rol de administrador
  const { data: isAdmin, error: roleError } =
    await supabase.rpc('has_role', {
      required_role: 'administrador',
    });

  if (roleError) {
    return (
      <main className={styles.accountsPage}>
        <h1>Administración de cuentas</h1>
        <p>No fue posible verificar tus permisos.</p>
      </main>
    );
  }

  if (!isAdmin) {
    redirect('/home');
  }

  return (
    <main className={styles.accountsPage}>
      <header className={styles.accountsHeader}>
        <h1>Administración de cuentas</h1>
        <p>
          Invita nuevos usuarios y administra las cuentas
          de la plataforma.
        </p>
      </header>

      <section className={styles.inviteSection}>
        <UserInvite />
      </section>

      {/* Aquí agregaremos UserTable en la siguiente etapa */}
    </main>
  );
}