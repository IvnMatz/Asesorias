import { createClient } from '@/lib/supabase/server'

const horariosPermitidos = [
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6',
  'V1', 'V2', 'V3', 'V4', 'V5', 'V6',
  'N1', 'N2', 'N3', 'N4', 'N5', 'N6',
]

export async function POST(request) {
  try {
    const supabase = await createClient()

    // 1. Verificar sesión
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims()

    const userId = claimsData?.claims?.sub

    if (claimsError || !userId) {
      return Response.json(
        { error: 'No estás autenticado.' },
        { status: 401 }
      )
    }

    // 2. Verificar rol de maestro
    const { data: isTeacher, error: roleError } =
      await supabase.rpc('has_role', {
        required_role: 'maestro',
      })

    if (roleError) {
      console.error('Error al verificar el rol:', roleError)

      return Response.json(
        { error: 'No fue posible verificar tus permisos.' },
        { status: 500 }
      )
    }

    if (!isTeacher) {
      return Response.json(
        { error: 'No tienes permisos para crear cursos.' },
        { status: 403 }
      )
    }

    // 3. Leer y validar los datos
    const body = await request.json()

    const {
      nombre,
      rama,
      descripcion,
      hora,
      materia_id,
    } = body

    if (
      typeof nombre !== 'string' ||
      typeof rama !== 'string' ||
      typeof descripcion !== 'string' ||
      typeof hora !== 'string' ||
      typeof materia_id !== 'string' ||
      !nombre.trim() ||
      !rama.trim() ||
      !descripcion.trim() ||
      !materia_id.trim()
    ) {
      return Response.json(
        { error: 'Los datos proporcionados no son válidos.' },
        { status: 400 }
      )
    }

    if (
      nombre.length > 150 ||
      rama.length > 100 ||
      descripcion.length > 2000
    ) {
      return Response.json(
        { error: 'Uno o más campos exceden la longitud permitida.' },
        { status: 400 }
      )
    }

    if (!horariosPermitidos.includes(hora)) {
      return Response.json(
        { error: 'El horario seleccionado no es válido.' },
        { status: 400 }
      )
    }

    // 4. Comprobar que la materia exista
    const { data: materia, error: materiaError } = await supabase
      .from('materias')
      .select('id')
      .eq('id', materia_id)
      .maybeSingle()

    if (materiaError) {
      console.error('Error al consultar la materia:', materiaError)

      return Response.json(
        { error: 'No fue posible validar la materia.' },
        { status: 500 }
      )
    }

    if (!materia) {
      return Response.json(
        { error: 'La materia seleccionada no existe.' },
        { status: 400 }
      )
    }

    // 5. Insertar el curso
    const { data: curso, error: insertError } = await supabase
      .from('cursos')
      .insert({
        nombre: nombre.trim(),
        rama: rama.trim(),
        descripcion: descripcion.trim(),
        hora,
        materia_id,
        maestro: userId,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error al crear el curso:', insertError)

      return Response.json(
        { error: 'No fue posible registrar el curso.' },
        { status: 500 }
      )
    }

    return Response.json(
      {
        message: 'Curso creado correctamente.',
        id: curso.id,
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error inesperado:', error)

    return Response.json(
      { error: 'Ocurrió un error inesperado.' },
      { status: 500 }
    )
  }
}