import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { randomBytes, createHash } from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(request) {
  let userId = null;
  let supabaseAdmin = null;

  try {
    // 1. Verificar la sesión del administrador
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autorizado.' },
        { status: 401 }
      );
    }

    // 2. Verificar el rol de administración
    const { data: isAdmin, error: roleError } = await supabase.rpc(
      'has_role',
      { required_role: 'administrador' }
    );

    if (roleError || !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción.' },
        { status: 403 }
      );
    }

    // 3. Obtener y validar los datos
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const tipoRegistro = body.tipoRegistro;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Correo electrónico no válido.' },
        { status: 400 }
      );
    }

    const tiposPermitidos = [
      'alumno',
      'maestro',
      'administracion',
    ];

    if (!tiposPermitidos.includes(tipoRegistro)) {
      return NextResponse.json(
        { error: 'Tipo de registro no válido.' },
        { status: 400 }
      );
    }

    // 4. Comprobar configuración del servidor
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!supabaseUrl || !secretKey || !siteUrl) {
      console.error('Faltan variables de entorno para crear invitaciones.');

      return NextResponse.json(
        { error: 'Error de configuración del servidor.' },
        { status: 500 }
      );
    }

    const registrationUrl = new URL('/complete-registration', siteUrl);

    // 5. Crear cliente administrativo
    supabaseAdmin = createSupabaseClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // 6. Crear la cuenta en Supabase Auth
    const { data: authData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false,
      });

    if (createError || !authData?.user) {
      console.error('Error al crear usuario:', createError);

      return NextResponse.json(
        { error: 'No fue posible crear la cuenta. Comprueba si el correo ya está registrado.' },
        { status: 400 }
      );
    }

    userId = authData.user.id;

    // 7. Generar token aleatorio y su hash
    const token = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex');

    // 8. Guardar la invitación
    const expiresAt = new Date(
      Date.now() + 48 * 60 * 60 * 1000
    ).toISOString();

    const { error: invitationError } = await supabaseAdmin
      .from('invitaciones')
      .insert({
        user_id: userId,
        email,
        tipo_registro: tipoRegistro,
        estado: 'pendiente',
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    if (invitationError) {
      console.error('Error al guardar invitación:', invitationError);

      // Evitar dejar una cuenta sin invitación
      const { error: deleteError } =
        await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error('No se pudo eliminar la cuenta incompleta:', deleteError);
      }

      return NextResponse.json(
        { error: 'No fue posible registrar la invitación.' },
        { status: 500 }
      );
    }

    // 9. Construir URL para administración
    registrationUrl.searchParams.set('validador', token);

    // 10. Devolver URL
    return NextResponse.json(
      {
        message: 'Invitación creada correctamente.',
        url: registrationUrl.toString(),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error inesperado al crear invitación:', error);

    // Si se creó la cuenta pero falló una operación posterior,
    // intentar eliminarla.
    if (userId && supabaseAdmin) {
      const { error: deleteError } =
        await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error('Error al revertir la creación de cuenta:', deleteError);
      }
    }

    return NextResponse.json(
      { error: 'Ocurrió un error interno al crear la invitación.' },
      { status: 500 }
    );
  }
}