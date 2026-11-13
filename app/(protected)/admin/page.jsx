import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard from './AdminDashboard'
import styles from './admin.module.css'

export default async function AdminPage() {
  await connection()

  const supabase = await createClient()

  // 1. Verificar sesión
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims()

  const userId = claimsData?.claims?.sub

  if (claimsError || !userId) {
    redirect('/login')
  }

  // 2. Verificar rol de administrador
  const { data: isAdmin, error: roleError } =
    await supabase.rpc('has_role', {
      required_role: 'administrador',
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

  if (!isAdmin) {
    redirect('/home')
  }

  // 3. Consultar estadísticas generales
  const [
    profilesResult,
    teachersResult,
    studentsResult,
    coursesResult,
    enrollmentsResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true }),

    supabase
      .from('maestros')
      .select('id', { count: 'exact', head: true }),

    supabase
      .from('alumnos')
      .select('id', { count: 'exact', head: true }),

    supabase
      .from('cursos')
      .select('id, nombre, maestro'),

    supabase
      .from('inscripciones')
      .select('curso'),
  ])

  const errors = [
    profilesResult.error,
    teachersResult.error,
    studentsResult.error,
    coursesResult.error,
    enrollmentsResult.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    console.error('Error al cargar estadísticas:', errors)

    return (
      <main className={styles.container}>
        <h1>Panel de administración</h1>
        <p className={styles.error}>
          No fue posible cargar las estadísticas del sistema.
        </p>
      </main>
    )
  }

  const cursos = coursesResult.data ?? []
  const inscripciones = enrollmentsResult.data ?? []

  // 4. Calcular inscripciones por curso
  const inscripcionesPorCurso = new Map()

  for (const inscripcion of inscripciones) {
    if (!inscripcion.curso) continue

    const current =
      inscripcionesPorCurso.get(inscripcion.curso) ?? 0

    inscripcionesPorCurso.set(
      inscripcion.curso,
      current + 1
    )
  }

  const cursosPorId = new Map(
    cursos.map((curso) => [curso.id, curso])
  )

  const topCursos = [...inscripcionesPorCurso.entries()]
    .map(([cursoId, cantidad]) => {
      const curso = cursosPorId.get(cursoId)

      if (!curso) return null

      return {
        id: curso.id,
        nombre: curso.nombre || 'Curso sin nombre',
        inscripciones: cantidad,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.inscripciones - a.inscripciones)
    .slice(0, 5)

  // 5. Calcular cantidad de cursos por maestro
  const cursosPorMaestro = new Map()

  for (const curso of cursos) {
    if (!curso.maestro) continue

    const current =
      cursosPorMaestro.get(curso.maestro) ?? 0

    cursosPorMaestro.set(curso.maestro, current + 1)
  }

  const topMaestrosIds = [...cursosPorMaestro.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Obtener nombres de los cinco maestros con más cursos
  const idsMaestros = topMaestrosIds.map(([id]) => id)

  let topMaestros = []

  if (idsMaestros.length > 0) {
    const { data: perfilesMaestros, error: profilesError } =
      await supabase
        .from('profiles')
        .select('id, nombre, apellido')
        .in('id', idsMaestros)

    if (profilesError) {
      console.error('Error al obtener nombres de maestros:', profilesError)

      return (
        <main className={styles.container}>
          <h1>Panel de administración</h1>
          <p className={styles.error}>
            No fue posible cargar el ranking de maestros.
          </p>
        </main>
      )
    }

    const perfilesPorId = new Map(
      (perfilesMaestros ?? []).map((perfil) => [
        perfil.id,
        perfil,
      ])
    )

    topMaestros = topMaestrosIds.map(([id, cantidad]) => {
      const perfil = perfilesPorId.get(id)

      return {
        id,
        nombre: perfil
          ? `${perfil.nombre ?? ''} ${perfil.apellido ?? ''}`.trim()
          : 'Maestro sin nombre',
        cursos: cantidad,
      }
    })
  }

  // 6. Construir objeto de estadísticas
  const stats = {
    perfiles: profilesResult.count ?? 0,
    cursos: cursos.length,
    maestros: teachersResult.count ?? 0,
    alumnos: studentsResult.count ?? 0,
    topCursos,
    topMaestros,
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Panel de administración</h1>
        <p>Gestiona los recursos y consulta la actividad del sistema.</p>
      </header>

      <AdminDashboard stats={stats} />
    </main>
  )
}