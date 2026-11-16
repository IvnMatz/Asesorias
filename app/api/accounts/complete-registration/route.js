
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(request) {
  let supabaseAdmin;
  let userId = null;
  let invitacionReclamada = false;

  try {
    // 1. Validar los datos recibidos
    const body = await request.json();

    const {
      validador,
      nombre,
      apellido,
      identificador,
      password,
    } = body;

    if (
      typeof validador !== 'string' ||
      !/^[a-f0-9]{64}$/i.test(validador)
    ) {
      return NextResponse.json(
        { error: 'El enlace de invitación no es válido.' },
        { status: 400 }
      );
    }

    if (
      typeof nombre !== 'string' ||
      typeof apellido !== 'string' ||
      !nombre.trim() ||
      !apellido.trim()
    ) {
      return NextResponse.json(
        { error: 'Debes proporcionar tu nombre y apellido.' },
        { status: 400 }
      );
    }

    if (nombre.trim().length > 100 || apellido.trim().length > 100) {
      return NextResponse.json(
        { error: 'El nombre o apellido supera la longitud permitida.' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: 'La contraseña supera la longitud permitida.' },
        { status: 400 }
      );
    }

    if (
      identificador !== undefined &&
      typeof identificador !== 'string'
    ) {
      return NextResponse.json(
        { error: 'El identificador proporcionado no es válido.' },
        { status: 400 }
      );
    }

    const identificadorLimpio =
      typeof identificador === 'string' ? identificador.trim() : '';

    // 2. Configurar el cliente administrativo de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const secretKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !secretKey) {
      throw new Error('Falta la configuración administrativa de Supabase.');
    }

    supabaseAdmin = createSupabaseClient(
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

    // 3. Convertir el token recibido a su hash
    const tokenHash = createHash('sha256')
      .update(validador)
      .digest('hex');

    // 4. Reclamar la invitación de manera atómica.
    // Solo una solicitud puede cambiarla de pendiente a procesando.
    const { data: invitacion, error: claimError } =
      await supabaseAdmin
        .from('invitaciones')
        .update({
          estado: 'procesando',
          processing_at: new Date().toISOString(),
        })
        .eq('token_hash', tokenHash)
        .eq('estado', 'pendiente')
        .gt('expires_at', new Date().toISOString())
        .select('user_id, email, tipo_registro')
        .maybeSingle();

    if (claimError) {
      throw claimError;
    }

    if (!invitacion) {
      return NextResponse.json(
        {
          error: 'La invitación no es válida, ha expirado o ya fue utilizada.',
        },
        { status: 400 }
      );
    }

    userId = invitacion.user_id;
    invitacionReclamada = true;

    // 5. Validar que la cuenta de Auth exista y corresponda
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authData?.user) {
      throw new Error('No fue posible recuperar la cuenta de usuario.');
    }

    const emailAuth = authData.user.email?.toLowerCase();
    const emailInvitacion = invitacion.email?.toLowerCase();

    if (!emailAuth || emailAuth !== emailInvitacion) {
      throw new Error('El correo de la invitación no coincide con la cuenta.');
    }

    // 6. Validar los campos específicos del tipo de usuario
    if (
      ['alumno', 'maestro'].includes(invitacion.tipo_registro) &&
      !identificadorLimpio
    ) {
      return await liberarInvitacionYResponder(
        supabaseAdmin,
        userId,
        'Debes proporcionar tu matrícula o número de empleado.',
        400
      );
    }

    // 7. Crear o actualizar el perfil general
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: userId,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      throw profileError;
    }

    // 8. Crear o actualizar el registro específico
    if (invitacion.tipo_registro === 'alumno') {
      const { error: alumnoError } = await supabaseAdmin
        .from('alumnos')
        .upsert(
          {
            id: userId,
            matricula: identificadorLimpio,
          },
          { onConflict: 'id' }
        );

      if (alumnoError) {
        throw alumnoError;
      }
    } else if (invitacion.tipo_registro === 'maestro') {
      const { error: maestroError } = await supabaseAdmin
        .from('maestros')
        .upsert(
          {
            id: userId,
            num_empleado: identificadorLimpio,
          },
          { onConflict: 'id' }
        );

      if (maestroError) {
        throw maestroError;
      }
    } else if (invitacion.tipo_registro !== 'administracion') {
      throw new Error('El tipo de registro de la invitación no es válido.');
    }

    // 9. Establecer la contraseña y confirmar el correo
    const { error: updateUserError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });

    if (updateUserError) {
      throw updateUserError;
    }

    // 10. Consumir la invitación
    const { data: invitacionCompletada, error: completeError } =
      await supabaseAdmin
        .from('invitaciones')
        .update({
          estado: 'completada',
          completed_at: new Date().toISOString(),
          processing_at: null,
          token_hash: null,
        })
        .eq('user_id', userId)
        .eq('estado', 'procesando')
        .select('user_id')
        .maybeSingle();

    if (completeError || !invitacionCompletada) {
      throw completeError || new Error(
        'No fue posible finalizar la invitación.'
      );
    }

    invitacionReclamada = false;

    return NextResponse.json(
      {
        message: 'Tu registro se completó correctamente.',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error al completar el registro:', error);

    // Si algo falla, permitir que el usuario vuelva a intentarlo
    if (invitacionReclamada && supabaseAdmin && userId) {
      await supabaseAdmin
        .from('invitaciones')
        .update({
          estado: 'pendiente',
          processing_at: null,
        })
        .eq('user_id', userId)
        .eq('estado', 'procesando');
    }

    return NextResponse.json(
      { error: 'No fue posible completar el registro. Inténtalo nuevamente.' },
      { status: 500 }
    );
  }
}

// Libera una invitación cuando hay un error de validación después de reclamarla.
async function liberarInvitacionYResponder(
  supabaseAdmin,
  userId,
  mensaje,
  status
) {
  const { error } = await supabaseAdmin
    .from('invitaciones')
    .update({
      estado: 'pendiente',
      processing_at: null,
    })
    .eq('user_id', userId)
    .eq('estado', 'procesando');

  if (error) {
    console.error('No fue posible liberar la invitación:', error);
  }

  return NextResponse.json({ error: mensaje }, { status });
}