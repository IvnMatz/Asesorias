
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function DELETE(request, { params }) {
  try {
    // 1. Verificar sesión
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

    // 2. Verificar rol administrativo
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

    // 3. Obtener y validar ID
    const { id } = await params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (typeof id !== 'string' || !uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'El identificador de la relación no es válido.' },
        { status: 400 }
      );
    }

    // 4. Cliente administrativo
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

    // 5. Eliminar relación
    const { data: deletedRelation, error: deleteError } =
      await supabaseAdmin
        .from('materias_relaciones')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();

    if (deleteError) throw deleteError;

    if (!deletedRelation) {
      return NextResponse.json(
        { error: 'La relación no existe o ya fue eliminada.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Relación eliminada correctamente.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error al eliminar relación:', error);

    return NextResponse.json(
      { error: 'No fue posible eliminar la relación.' },
      { status: 500 }
    );
  }
}
