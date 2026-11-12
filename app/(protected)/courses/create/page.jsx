import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import CreateCourseForm from './CreateCourseForm'
import styles from './create.module.css'

export default async function CreateCoursePage() {
  await connection()

  const supabase = await createClient()

  // Verificar sesión
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims()

  const userId = claimsData?.claims?.sub

  if (claimsError || !userId) {
    redirect('/login')
  }

  // Verificar rol
  const { data: isTeacher, error: roleError } =
    await supabase.rpc('has_role', {
      required_role: 'maestro',
    })

  if (roleError) {
    console.error('Error al verificar el rol:', roleError)

    return (
      <main className={styles.container}>
        <p className={styles.error}>
          No fue posible verificar tus permisos.
        </p>
      </main>
    )
  }

  if (!isTeacher) {
    redirect('/home')
  }

  // Obtener materias disponibles
  const { data: materias, error: materiasError } = await supabase
    .from('materias')
    .select('id, nombre')
    .order('nombre', { ascending: true })

  if (materiasError) {
    console.error('Error al obtener materias:', materiasError)

    return (
      <main className={styles.container}>
        <p className={styles.error}>
          No fue posible cargar las materias disponibles.
        </p>
      </main>
    )
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Crear curso</h1>
        <p>Completa la información para registrar un nuevo curso.</p>
      </header>

      <CreateCourseForm materias={materias ?? []} />
    </main>
  )
}