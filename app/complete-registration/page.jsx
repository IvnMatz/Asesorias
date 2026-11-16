import { connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import RegistrationForm from './RegistrationForm';
import styles from './registration.module.css';

import { createHash } from 'node:crypto';

export default async function CompleteRegistration({ searchParams }) {
  await connection();

  // 1. Obtener el token de la URL
  const params = await searchParams;
  const validador = params?.validador;

  // 2. Validar formato del token
  if (
    typeof validador !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(validador)
  ) {
    return (
      <main className={styles.registrationPage}>
        <p>El enlace de invitación no es válido.</p>
      </main>
    );
  }

  // 3. Comprobar configuración administrativa
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    console.error('Faltan variables de entorno de Supabase.');

    return (
      <main className={styles.registrationPage}>
        <p>No fue posible verificar la invitación.</p>
      </main>
    );
  }

  // 4. Crear cliente administrativo
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

  // 5. Calcular el hash del token recibido
  const tokenHash = createHash('sha256')
    .update(validador)
    .digest('hex');

  // 6. Buscar invitación pendiente y vigente
  const { data: invitacion, error } = await supabaseAdmin
    .from('invitaciones')
    .select('email, tipo_registro, estado, expires_at')
    .eq('token_hash', tokenHash)
    .eq('estado', 'pendiente')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error('Error al consultar invitación:', error);

    return (
      <main className={styles.registrationPage}>
        <p>No fue posible verificar tu invitación.</p>
      </main>
    );
  }

  // 7. Si no existe una invitación válida
  if (!invitacion) {
    return (
      <main className={styles.registrationPage}>
        <h1>Invitación no válida</h1>
        <p>
          El enlace puede haber caducado, haber sido utilizado
          o no corresponder a una invitación existente.
        </p>
      </main>
    );
  }

  // 8. Mostrar formulario de registro
  return (
    <RegistrationForm
      tipoRegistro={invitacion.tipo_registro}
      email={invitacion.email}
      validador={validador}
    />
  );
}