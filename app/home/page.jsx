
import { redirect } from 'next/navigation'
import Link from "next/link";
import { createClient } from '@/lib/supabase/server'
import styles from './home.module.css'


export default async function HomePage() {
  
  const supabase = await createClient()

  // 1. Verificar sesión
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    redirect('/login')
  }

  const userId = data.claims.sub

  // 2. Obtener cursos
  const { data: cursos, error: cursosError } = await supabase
    .from('vista_catalogo_cursos')
    .select('*')
    .order('created_at', { ascending: false })

  // 3. Manejar errores
  if (cursosError) {
    console.error('Error al obtener cursos:', cursosError)
  }

  // 4. Mostrar catálogo
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Catálogo de cursos</h1>
        <p>Explora los cursos disponibles.</p>
      </header>

      <p>Tu UUID: {userId}</p>

      {cursosError ? (
        <p>No fue posible cargar los cursos.</p>
      ) : cursos.length === 0 ? (
        <p>No hay cursos registrados actualmente.</p>
      ) : (
        <section className={styles.grid}>
          {cursos.map((curso) => (
            <article key={curso.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.rama}>
                  {curso.rama || 'Sin categoría'}
                </span>

                <h2>{curso.nombre}</h2>
              </div>

              <div className={styles.info}>
                <p>
                  <strong>Maestro:</strong>{' '}
                  {curso.maestro_nombre
                    ? `${curso.maestro_nombre} ${curso.maestro_apellido ?? ''}`
                    : 'No asignado'}
                </p>

                <p>
                  <strong>Horario:</strong> {curso.hora || 'Sin horario'}
                </p>
              </div>

              {curso.descripcion && (
                <p className={styles.description}>
                  {curso.descripcion}
                </p>
              )}

              <Link href={`/course/${curso.id}`} className={styles.link}>
                Ver curso
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}