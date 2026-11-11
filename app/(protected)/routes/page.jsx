import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import RoutesSelector from './RoutesSelector'
import styles from './routes.module.css'

export default async function RoutesPage() {
  await connection()

  const supabase = await createClient()

  const [
    { data: materias, error: materiasError },
    { data: prerrequisitos, error: prerrequisitosError }
  ] = await Promise.all([
    supabase
      .from('materias')
      .select('id, nombre, rama')
      .order('nombre'),

    supabase
      .from('materias_relaciones')
      .select('materia_id, prerrequisito_id')
  ])

  if (materiasError || prerrequisitosError) {
    console.error(materiasError || prerrequisitosError)

    return (
      <main className={styles.container}>
        <h1>Rutas de aprendizaje</h1>
        <p className={styles.error}>
          No fue posible cargar las rutas de aprendizaje.
        </p>
      </main>
    )
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Rutas de aprendizaje</h1>
        <p>
          Explora las diferentes ramas académicas y descubre
          qué materias necesitas cursar antes de avanzar.
        </p>
      </header>

      <RoutesSelector
        materias={materias || []}
        prerrequisitos={prerrequisitos || []}
      />
    </main>
  )
}