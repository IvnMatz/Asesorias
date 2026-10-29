import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export async function POST(request) {
  try {
    const { matricula, contraseña } = await request.json()

    if (!matricula || !contraseña) {
      return NextResponse.json(
        { error: 'Completa todos los campos' },
        { status: 400 }
      )
    }

    const { data: alumno, error } = await supabase
      .from('alumnos')
      .select('matricula, nombre, passw')
      .eq('matricula', matricula)
      .maybeSingle()

    if (error) {
      console.error(error)

      return NextResponse.json(
        { error: 'Error al consultar la base de datos' },
        { status: 500 }
      )
    }
    // DEMO: compara contraseñas en texto plano.
    // No uses este método en una aplicación real.
    if (!alumno || alumno.passw !== contraseña) {
      return NextResponse.json(
        { error: 'Matrícula o contraseña incorrectas' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      nombre: alumno.nombre
    })
  } catch {
    return NextResponse.json(
      { error: 'Solicitud inválida' },
      { status: 400 }
    )
  }
}