
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const rolesPermitidos = [
  'alumno',
  'maestro',
  'administrador',
];

export async function POST(request) {
  try {
    // 1. Comprobar la sesión
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No has iniciado sesión.' },
        { status: 401 }
      );
    }

    // 2. Comprobar que el usuario sea administrador
    const { data: esAdmin, error: roleError } =
      await supabase.rpc('has_role', {
        required_role: 'administrador',
      });

    if (roleError || !esAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción.' },
        { status: 403 }
      );
    }

    // 3. Validar los datos recibidos
    const body = await request.json();
    const { userId, roleId } = body;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
      typeof userId !== 'string' ||
      !uuidRegex.test(userId) ||
      !Number.isSafeInteger(roleId) ||
      roleId <= 0
    ) {
      return NextResponse.json(
        { error: 'Los datos proporcionados no son válidos.' },
        { status: 400 }
      );
    }

    // 4. Crear cliente administrativo
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

    // 5. Comprobar que el perfil exista
    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {
      return NextResponse.json(
        { error: 'La cuenta seleccionada no existe.' },
        { status: 404 }
      );
    }

    // 6. Comprobar que todavía no tenga un rol
    const { data: existingRole, error: existingRoleError } =
      await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

    if (existingRoleError) throw existingRoleError;

    if (existingRole) {
      return NextResponse.json(
        { error: 'Esta cuenta ya tiene un rol asignado.' },
        { status: 409 }
      );
    }

    // 7. Recuperar y validar el rol solicitado
    const { data: role, error: requestedRoleError } =
      await supabaseAdmin
        .from('roles')
        .select('id, nombre')
        .eq('id', roleId)
        .maybeSingle();

    if (requestedRoleError) throw requestedRoleError;

    if (!role || !rolesPermitidos.includes(role.nombre)) {
      return NextResponse.json(
        { error: 'El rol seleccionado no es válido.' },
        { status: 400 }
      );
    }

    // 8. Comprobar coherencia entre el perfil y el rol
    const [
      { data: alumno, error: alumnoError },
      { data: maestro, error: maestroError },
    ] = await Promise.all([
      supabaseAdmin
        .from('alumnos')
        .select('id')
        .eq('id', userId)
        .maybeSingle(),

      supabaseAdmin
        .from('maestros')
        .select('id')
        .eq('id', userId)
        .maybeSingle(),
    ]);

    if (alumnoError) throw alumnoError;
    if (maestroError) throw maestroError;

    const registroCoherente =
      (role.nombre === 'alumno' && !!alumno && !maestro) ||
      (role.nombre === 'maestro' && !!maestro && !alumno) ||
      (role.nombre === 'administrador' && !alumno && !maestro);

    if (!registroCoherente) {
      return NextResponse.json(
        {
          error: 'El rol seleccionado no coincide con el tipo de registro de la cuenta.',
        },
        { status: 400 }
      );
    }

    // 9. Insertar el rol
    const { error: insertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: role.id,
      });

    if (insertError) {
      // La restricción UNIQUE también protege contra solicitudes simultáneas.
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Esta cuenta ya tiene un rol asignado.' },
          { status: 409 }
        );
      }

      throw insertError;
    }

    return NextResponse.json(
      { message: 'Rol asignado correctamente.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error al asignar rol:', error);

    return NextResponse.json(
      { error: 'No fue posible asignar el rol.' },
      { status: 500 }
    );
  }
}