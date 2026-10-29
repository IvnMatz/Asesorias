import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const matricula = searchParams.get('matricula')

  if (!matricula) {
    return NextResponse.json(
      { error: 'Falta la matrícula' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('inscripciones')
    .select(`
      curso:cursos (
        nombre,
        hora,
        fecha,
        rama,
        maestro:maestros (
          nombre
        )
      )
    `)
    .eq('matricula', matricula)

  if (error) {
    console.error('Error al consultar inscripciones:', error)

    return NextResponse.json(
      { error: 'No se pudieron obtener las inscripciones' },
      { status: 500 }
    )
  }

  const inscripciones = data.map((registro) => ({
    nombre: registro.curso?.nombre ?? '',
    hora: registro.curso?.hora ?? '',
    fecha: registro.curso?.fecha ?? '',
    rama: registro.curso?.rama ?? '',
    maestro: registro.curso?.maestro?.nombre ?? ''
  }))

  return NextResponse.json(inscripciones)
}