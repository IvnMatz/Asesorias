
import Link from 'next/link'
import styles from './courses.module.css'

export default function CoursesList({ cursos }) {
  if (!cursos || cursos.length === 0) {
    return (
      <section className={styles.empty}>
        <h2>Aún no tienes cursos</h2>
        <p>
          Cuando crees un curso, aparecerá aquí.
        </p>
      </section>
    )
  }

  return (
    <section className={styles.grid}>
      {cursos.map((curso) => (
        <article key={curso.id} className={styles.card}>
          <div className={styles.cardContent}>
            <span className={styles.branch}>
              {curso.rama || 'Sin categoría'}
            </span>

            <h2>{curso.nombre || 'Curso sin nombre'}</h2>

            <p className={styles.description}>
              {curso.descripcion || 'Sin descripción disponible.'}
            </p>

            <p className={styles.schedule}>
              <strong>Horario:</strong> {curso.hora || 'No especificado'}
            </p>
          </div>

          <div className={styles.actions}>
            <Link
              href={`/course/${curso.id}`}
              className={styles.viewButton}
            >
              Ver curso
            </Link>

            <Link
              href={`/course/${curso.id}/edit`}
              className={styles.editButton}
            >
              Editar curso
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}