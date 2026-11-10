import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import MyCoursesContent from './coursescont'

export default async function MyCoursesPage() {
  await connection()

  const supabase = await createClient()

  const { data: auth, error: authError } =
    await supabase.auth.getClaims()

  if (authError || !auth?.claims) {
    redirect('/login')
  }

  const userId = auth.claims.sub

  // Verificar rol
  const { data: esAlumno, error: roleError } =
    await supabase.rpc('has_role', {
      required_role: 'alumno'
    })

  if (roleError) {
    console.error('Error al verificar rol:', roleError)
    throw new Error('No fue posible verificar tus permisos.')
  }

  if (!esAlumno) {
    redirect('/home')
  }

  // Consultar inscripciones y cursos relacionados
  const { data: inscripciones, error } = await supabase
    .from('inscripciones')
    .select(`
      id,
      estado,
      curso:cursos!inscripciones_curso_fkey (
        id,
        nombre,
        rama,
        hora,
        descripcion
      )
    `)
    .eq('alumno', userId)

  if (error) {
    console.error('Error al consultar inscripciones:', error)
    throw new Error('No fue posible cargar tus cursos.')
  }

  // Separar por estado
  const cursosInscritos = inscripciones.filter(
    (i) => i.estado === 'aprobada'
  )

  const solicitudesPendientes = inscripciones.filter(
    (i) => i.estado === 'pendiente'
  )

  return (
    <MyCoursesContent
      cursosInscritos={cursosInscritos}
      solicitudesPendientes={solicitudesPendientes}
    />
  )
}