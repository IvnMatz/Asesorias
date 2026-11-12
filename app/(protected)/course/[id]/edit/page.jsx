
import { redirect, notFound } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import EditCourseForm from './EditCourseForm'
import styles from './edit.module.css'

export default async function EditCoursePage({ params }) {
  await connection()

  const { id } = await params
  const supabase = await createClient()

  // 1. Verificar sesión
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims()

  const userId = claimsData?.claims?.sub

  if (claimsError || !userId) {
    redirect('/login')
  }

  // 2. Verificar rol de maestro
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

  // 3. Obtener el curso, comprobando que pertenezca al maestro
  const { data: curso, error: courseError } = await supabase
    .from('cursos')
    .select('id, nombre, rama, descripcion, hora, materia_id')
    .eq('id', id)
    .eq('maestro', userId)
    .maybeSingle()

  if (courseError) {
    console.error('Error al obtener el curso:', courseError)

    return (
      <main className={styles.container}>
        <p className={styles.error}>
          No fue posible cargar la información del curso.
        </p>
      </main>
    )
  }

  if (!curso) {
    notFound()
  }

  // 4. Obtener materias disponibles
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
        <h1>Editar curso</h1>
        <p>Modifica la información del curso.</p>
      </header>

      <EditCourseForm
        curso={curso}
        materias={materias ?? []}
      />
    </main>
  )
}