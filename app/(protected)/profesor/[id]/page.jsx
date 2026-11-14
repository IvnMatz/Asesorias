import { notFound, redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import styles from './home.module.css'


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
    <main className={styles.profesorPage}>
  <header className={styles.profesorHeader}>
    <div className={styles.profesorInfo}>
      <span className={styles.profesorBadge}>Profesor</span>

      <h1>
        {profesor.nombre} {profesor.apellido}
      </h1>

      <p className={styles.profesorStats}>
        Cursos impartidos:
        <strong>{profesor.total_cursos}</strong>
      </p>
    </div>
  </header>

  <section className={styles.cursosSection}>
    <div className={styles.sectionHeader}>
      <h2>Cursos del profesor</h2>
      <span>{cursos.length} cursos</span>
    </div>

    {cursosError ? (
      <p className={styles.messageError}>
        No fue posible cargar los cursos.
      </p>
    ) : cursos.length === 0 ? (
      <p className={styles.emptyMessage}>
        Este profesor todavía no tiene cursos disponibles.
      </p>
    ) : (
      <div className={styles.cursosGrid}>
        {cursos.map((curso) => (
          <article
            key={curso.id}
            className={styles.cursoCard}
          >
            <div className={styles.cursoContent}>
              <span className={styles.cursoCategoria}>
                {curso.rama || 'Sin categoría'}
              </span>

              <h3>{curso.nombre}</h3>

              <p className={styles.cursoHorario}>
                <strong>Horario:</strong>{' '}
                {curso.hora || 'Sin horario'}
              </p>

              {curso.descripcion && (
                <p className={styles.cursoDescripcion}>
                  {curso.descripcion}
                </p>
              )}
            </div>

            <Link
              href={`/course/${curso.id}`}
              className={styles.cursoLink}
            >
              Ver curso →
            </Link>
          </article>
        ))}
      </div>
    )}
  </section>
</main>
  )
}