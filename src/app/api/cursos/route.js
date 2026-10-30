import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export async function GET() {
  const { data, error } = await supabase
    .from('cursos')
    .select(`
      id,
      nombre,
      hora,
      fecha,
      rama,
      maestro:maestros (
        nombre
      )
    `)
    

  if (error) {
    console.error('Error al consultar cursos:', error)

    return NextResponse.json(
      { error: 'No se pudieron obtener los cursos' },
      { status: 500 }
    )
  }

  const cursos = data.map((curso) => ({
    id: curso.id,
    nombre: curso.nombre,
    hora: curso.hora,
    fecha: curso.fecha,
    rama: curso.rama,
    maestro: curso.maestro?.nombre ?? 'Sin asignar'
  }))

  return NextResponse.json(cursos)
}