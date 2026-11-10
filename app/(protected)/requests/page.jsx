import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import RequestsQueue from './RequestsQueue'

export default async function RequestsPage() {
  await connection()

  const supabase = await createClient()

  // Verificar sesión
  const { data: auth, error: authError } =
    await supabase.auth.getClaims()

  if (authError || !auth?.claims) {
    redirect('/login')
  }

  const userId = auth.claims.sub

  // Verificar que el usuario sea profesor
  const { data: esMaestro, error: roleError } =
    await supabase.rpc('has_role', {
      required_role: 'maestro'
    })

  if (roleError) {
    throw new Error('No fue posible verificar tus permisos.')
  }

  if (!esMaestro) {
    redirect('/home')
  }

  // Obtener solicitudes de todos los cursos del profesor
  const { data: solicitudes, error } = await supabase
    .from('inscripciones')
    .select(`
      id,
      created_at,
      estado,
      alumno:alumnos!inscripciones_alumno_fkey (
        id,
        matricula,
        perfil:profiles!alumnos_id_fkey (
          nombre,
          apellido
        )
      ),
      curso:cursos!inner (
        id,
        nombre,
        rama,
        hora,
        maestro
      )
    `)
    .eq('estado', 'pendiente')
    .eq('curso.maestro', userId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error(error)
    throw new Error('No fue posible cargar las solicitudes.')
  }

  return <RequestsQueue solicitudes={solicitudes || []} />
}