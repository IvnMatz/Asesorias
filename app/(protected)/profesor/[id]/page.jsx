import { notFound, redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'


export default async function ProfesorPage({ params }) {
  await connection()

  const { id } = await params
  const supabase = await createClient()

  // Verificar sesión
  const { data: auth, error: authError } =
    await supabase.auth.getClaims()

  if (authError || !auth?.claims) {
    redirect('/login')
  }

  // Consultar perfil del profesor
  const { data: profesor, error: profesorError } =
    await supabase
      .from('vista_catalogo_profesores')
      .select('*')
      .eq('id', id)
      .single()

  if (profesorError || !profesor) {
    notFound()
  }

  // Consultar cursos impartidos
  const { data: cursos, error: cursosError } =
    await supabase
      .from('vista_catalogo_cursos')
      .select('*')
      .eq('maestro_id', id)
      .order('created_at', { ascending: false })

  if (cursosError) {
    console.error('Error al obtener cursos:', cursosError)
  }

  return (
    <main>
      <header>
        <h1>
          {profesor.nombre} {profesor.apellido}
        </h1>

        <p>Profesor</p>

        <p>
          Cursos impartidos: {profesor.total_cursos}
        </p>
      </header>

      <section>
        <h2>Cursos del profesor</h2>

        {cursosError ? (
          <p>No fue posible cargar los cursos.</p>
        ) : cursos.length === 0 ? (
          <p>Este profesor todavía no tiene cursos disponibles.</p>
        ) : (
          <div>
            {cursos.map((curso) => (
              <article key={curso.id}>
                <h3>{curso.nombre}</h3>

                <p>
                  {curso.rama || 'Sin categoría'}
                </p>

                <p>
                  Horario: {curso.hora || 'Sin horario'}
                </p>

                {curso.descripcion && (
                  <p>{curso.descripcion}</p>
                )}

                <Link href={`/curso/${curso.id}`}>
                  Ver curso
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}