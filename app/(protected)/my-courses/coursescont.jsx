'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import styles from './my-courses.module.css'

// Convierte el código de horario a un valor numérico
function obtenerValorHora(hora) {
  if (!hora) return null

  const coincidencia = hora.trim().match(/^([MVN])([1-6])$/i)

  if (!coincidencia) return null

  const periodo = coincidencia[1].toUpperCase()
  const numero = Number(coincidencia[2])

  const desplazamiento = {
    M: 0,
    V: 6,
    N: 12
  }

  return desplazamiento[periodo] + numero
}

export default function MyCoursesContent({
  cursosInscritos,
  solicitudesPendientes
}) {
  const [ascendente, setAscendente] = useState(true)

  // Ordenar ambas listas según el horario
  const inscritosOrdenados = useMemo(() => {
    return [...cursosInscritos].sort((a, b) => {
      const horaA = obtenerValorHora(a.curso?.hora)
      const horaB = obtenerValorHora(b.curso?.hora)

      // Los horarios inválidos o vacíos siempre quedan al final
      if (horaA === null && horaB === null) return 0
      if (horaA === null) return 1
      if (horaB === null) return -1

      return ascendente ? horaA - horaB : horaB - horaA
    })
  }, [cursosInscritos, ascendente])

  const pendientesOrdenados = useMemo(() => {
    return [...solicitudesPendientes].sort((a, b) => {
      const horaA = obtenerValorHora(a.curso?.hora)
      const horaB = obtenerValorHora(b.curso?.hora)

      if (horaA === null && horaB === null) return 0
      if (horaA === null) return 1
      if (horaB === null) return -1

      return ascendente ? horaA - horaB : horaB - horaA
    })
  }, [solicitudesPendientes, ascendente])

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Mis cursos</h1>
        <p>Consulta tus cursos y solicitudes de inscripción.</p>
      </header>

      {/* Control de ordenamiento */}
      <div className={styles.sortContainer}>
        <span>Ordenar por horario:</span>

        <button
          type="button"
          onClick={() => setAscendente((actual) => !actual)}
          className={styles.sortButton}
        >
          {ascendente
            ? 'Más temprano primero ↑'
            : 'Más tarde primero ↓'}
        </button>
      </div>

      {/* Cursos aceptados */}
      <section className={styles.section}>
        <h2>Mis cursos inscritos</h2>

        {inscritosOrdenados.length === 0 ? (
          <p className={styles.empty}>
            Todavía no estás inscrito en ningún curso.
          </p>
        ) : (
          <div className={styles.grid}>
            {inscritosOrdenados.map(({ id, curso }) => (
              <article key={id} className={styles.card}>
                <span className={styles.category}>
                  {curso?.rama || 'Sin categoría'}
                </span>

                <h3>{curso?.nombre || 'Curso no disponible'}</h3>

                <p>
                  <strong>Horario:</strong>{' '}
                  {curso?.hora || 'Sin horario'}
                </p>

                {curso?.descripcion && (
                  <p className={styles.description}>
                    {curso.descripcion}
                  </p>
                )}

                {curso && (
                  <Link
                    href={`/course/${curso.id}`}
                    className={styles.link}
                  >
                    Ver curso
                  </Link>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Solicitudes pendientes */}
      <section className={styles.section}>
        <h2>Solicitudes pendientes</h2>

        {pendientesOrdenados.length === 0 ? (
          <p className={styles.empty}>
            No tienes solicitudes pendientes.
          </p>
        ) : (
          <div className={styles.grid}>
            {pendientesOrdenados.map(({ id, curso }) => (
              <article key={id} className={styles.card}>
                <span className={styles.category}>
                  {curso?.rama || 'Sin categoría'}
                </span>

                <h3>{curso?.nombre || 'Curso no disponible'}</h3>

                <p>
                  <strong>Horario:</strong>{' '}
                  {curso?.hora || 'Sin horario'}
                </p>

                <span className={styles.pending}>
                  Solicitud pendiente
                </span>

                {curso && (
                  <Link
                    href={`/curso/${curso.id}`}
                    className={styles.link}
                  >
                    Ver curso
                  </Link>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}