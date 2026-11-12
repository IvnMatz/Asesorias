
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import CoursesList from './CoursesList'
import styles from './courses.module.css'

export default async function CoursesPage() {
  await connection()

  const supabase = await createClient()

  // 1. Comprobar que exista una sesión válida
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims()

  const userId = claimsData?.claims?.sub

  if (claimsError || !userId) {
    redirect('/login')
  }

  // 2. Comprobar que el usuario tenga el rol de maestro
  const { data: isTeacher, error: roleError } =
    await supabase.rpc('has_role', {
      required_role: 'maestro',
    })

  if (roleError) {
    console.error('Error al verificar el rol:', roleError)

    return (
      <main className={styles.container}>
        <p className={styles.error}>
          No fue posible verificar los permisos de acceso.
        </p>
      </main>
    )
  }

  if (!isTeacher) {
    redirect('/home')
  }

  // 3. Obtener los cursos asignados al maestro
  const { data: cursos, error: coursesError } = await supabase
    .from('cursos')
    .select('id, nombre, hora, rama, descripcion')
    .eq('maestro', userId)
    .order('created_at', { ascending: false })

  if (coursesError) {
    console.error('Error al obtener los cursos:', coursesError)

    return (
      <main className={styles.container}>
        <h1>Mis cursos</h1>
        <p className={styles.error}>
          No fue posible cargar tus cursos. Inténtalo nuevamente.
        </p>
      </main>
    )
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Mis cursos</h1>
          <p>Administra los cursos que tienes asignados.</p>
        </div>

        <a href="/courses/create" className={styles.createButton}>
          + Crear curso
        </a>
      </header>

      <CoursesList cursos={cursos ?? []} />
    </main>
  )
}