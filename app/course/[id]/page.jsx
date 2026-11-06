import { redirect, notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { solicitarInscripcion } from './actions'

export default async function CursoPage({ params }) {

  const { id } = await params
  const supabase = await createClient()

  // 1. Comprobar sesión
  const { data: auth, error: authError } =
    await supabase.auth.getClaims()

  if (authError || !auth?.claims) {
    redirect('/login')
  }

  const userId = auth.claims.sub 

  // 2. Consultar curso
  const { data: curso, error } = await supabase
    .from('vista_catalogo_cursos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !curso) {
    notFound()
  }

  // 3. Comprobar si es alumno
  const { data: esAlumno } = await supabase.rpc('has_role', {
    required_role: 'alumno'
  })

  if (!esAlumno) {
    throw new Error('No tienes permiso para solicitar inscripción.')
  }
  // 4. Consultar inscripción, solo si es alumno
  let inscripcion = null
 
  if (esAlumno) {
    const { data } = await supabase
      .from('inscripciones')
      .select('estado')
      .eq('alumno', userId)
      .eq('curso', id)
      .maybeSingle()

    inscripcion = data
    
  }

  return (
    <main>
      <h1>{curso.nombre}</h1>

      <p>
        <strong>Rama:</strong> {curso.rama || 'Sin categoría'}
      </p>

      <p>
        <strong>Maestro:</strong>{' '}
        {curso.maestro_nombre
          ? `${curso.maestro_nombre} ${curso.maestro_apellido ?? ''}`
          : 'No asignado'}
      </p>

      <p>
        <strong>Horario:</strong> {curso.hora || 'Sin horario'}
      </p>

      <p>
        <strong>Descripción:</strong>{' '}
        {curso.descripcion || 'Sin descripción'}
      </p>

      {/* 5. Contenido según el rol y estado */}
      {esAlumno && (
        <section>
          {!inscripcion ? (
            <form action={solicitarInscripcion}>
              <input
                type="hidden"
                name="cursoId"
                value={curso.id}
              />

              <button type="submit">
                Inscribir
              </button>
            </form>
          ) : inscripcion.estado === 'pendiente' ? (
            <p>Solicitud pendiente</p>
          ) : inscripcion.estado === 'aprobada' ? (
            <p>Inscrito</p>
          ) : (
            <p>Solicitud rechazada</p>
          )}
        </section>
      )}
    </main>
  )
}