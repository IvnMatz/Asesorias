
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request) {
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

    // 3. Validar datos
    const body = await request.json();
    const { materiaId, prerrequisitoId } = body;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
      typeof materiaId !== 'string' ||
      typeof prerrequisitoId !== 'string' ||
      !uuidRegex.test(materiaId) ||
      !uuidRegex.test(prerrequisitoId)
    ) {
      return NextResponse.json(
        { error: 'Los identificadores no son válidos.' },
        { status: 400 }
      );
    }

    if (materiaId === prerrequisitoId) {
      return NextResponse.json(
        { error: 'Una materia no puede ser su propio prerrequisito.' },
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

    // 5. Verificar que ambas materias existan
    const { data: materias, error: materiasError } =
      await supabaseAdmin
        .from('materias')
        .select('id')
        .in('id', [materiaId, prerrequisitoId]);

    if (materiasError) throw materiasError;

    if (materias?.length !== 2) {
      return NextResponse.json(
        { error: 'Una o ambas materias no existen.' },
        { status: 404 }
      );
    }

    // 6. Consultar relaciones actuales
    const { data: relaciones, error: relacionesError } =
      await supabaseAdmin
        .from('materias_relaciones')
        .select('materia_id, prerrequisito_id');

    if (relacionesError) throw relacionesError;

    // 7. Comprobar duplicados
    const duplicada = relaciones.some(
      (relacion) =>
        relacion.materia_id === materiaId &&
        relacion.prerrequisito_id === prerrequisitoId
    );

    if (duplicada) {
      return NextResponse.json(
        { error: 'Esta relación ya existe.' },
        { status: 409 }
      );
    }

    // 8. Comprobar que no se genere un ciclo
    // Las aristas van desde la materia hacia su prerrequisito.
    // Al agregar A -> B, buscamos si B ya puede llegar a A.
    const grafo = new Map();

    for (const relacion of relaciones) {
      if (!grafo.has(relacion.materia_id)) {
        grafo.set(relacion.materia_id, []);
      }

      grafo.get(relacion.materia_id).push(
        relacion.prerrequisito_id
      );
    }

    const visitados = new Set();
    const pendientes = [prerrequisitoId];

    while (pendientes.length > 0) {
      const actual = pendientes.pop();

      if (actual === materiaId) {
        return NextResponse.json(
          {
            error: 'Esta relación generaría un ciclo de prerrequisitos.',
          },
          { status: 409 }
        );
      }

      if (visitados.has(actual)) continue;

      visitados.add(actual);

      const siguientes = grafo.get(actual) || [];
      pendientes.push(...siguientes);
    }

    // 9. Insertar relación
    const { data: nuevaRelacion, error: insertError } =
      await supabaseAdmin
        .from('materias_relaciones')
        .insert({
          materia_id: materiaId,
          prerrequisito_id: prerrequisitoId,
        })
        .select('id, materia_id, prerrequisito_id')
        .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Esta relación ya existe.' },
          { status: 409 }
        );
      }

      throw insertError;
    }

    // 10. Recuperar nombres para actualizar la tabla
    const { data: nombres, error: nombresError } =
      await supabaseAdmin
        .from('materias')
        .select('id, nombre')
        .in('id', [materiaId, prerrequisitoId]);

    if (nombresError) throw nombresError;

    const nombresPorId = new Map(
      nombres.map((materia) => [materia.id, materia.nombre])
    );

    return NextResponse.json(
      {
        message: 'Relación creada correctamente.',
        relacion: {
          ...nuevaRelacion,
          materia: nombresPorId.get(materiaId),
          prerrequisito: nombresPorId.get(prerrequisitoId),
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error al crear relación:', error);

    return NextResponse.json(
      { error: 'No fue posible crear la relación.' },
      { status: 500 }
    );
  }
}
