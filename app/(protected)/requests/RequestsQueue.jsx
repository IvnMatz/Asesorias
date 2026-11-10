'use client'

import { useMemo, useState, useTransition } from 'react'
import styles from './requests.module.css'
import { actualizarSolicitud } from './actions'

export default function RequestsQueue({ solicitudes: iniciales }) {
  const [solicitudes, setSolicitudes] = useState(iniciales)
  const [isPending, startTransition] = useTransition()
  const [procesando, setProcesando] = useState(null)
  const [mensaje, setMensaje] = useState('')

  // Agrupar solicitudes por curso
  const colas = useMemo(() => {
    const grupos = new Map()

    for (const solicitud of solicitudes) {
      const curso = solicitud.curso

      if (!curso) continue

      if (!grupos.has(curso.id)) {
        grupos.set(curso.id, {
          curso,
          solicitudes: []
        })
      }

      grupos.get(curso.id).solicitudes.push(solicitud)
    }

    return Array.from(grupos.values())
  }, [solicitudes])

  function procesarSolicitud(id, estado) {
    setMensaje('')
    setProcesando(id)

    startTransition(async () => {
      const resultado = await actualizarSolicitud(id, estado)

      if (!resultado.success) {
        setMensaje(resultado.message)
        setProcesando(null)
        return
      }

      // Retirar la solicitud procesada de la cola local
      setSolicitudes(actuales =>
        actuales.filter(solicitud => solicitud.id !== id)
      )

      setProcesando(null)
    })
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Solicitudes de inscripción</h1>
        <p>
          Revisa y administra las solicitudes de tus cursos.
        </p>
      </header>

      {mensaje && (
        <p className={styles.error} role="alert">
          {mensaje}
        </p>
      )}

      {colas.length === 0 ? (
        <div className={styles.empty}>
          <h2>No hay solicitudes pendientes</h2>
          <p>
            Cuando un alumno solicite inscribirse a uno de tus
            cursos, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className={styles.courses}>
          {colas.map(({ curso, solicitudes: cola }) => {
            // peek(): consultar el primer elemento sin retirarlo
            const solicitud = cola[0]

            const alumno = solicitud.alumno
            const perfil = alumno?.perfil

            return (
              <section
                key={curso.id}
                className={styles.courseSection}
              >
                <div className={styles.courseHeader}>
                  <div>
                    <span className={styles.category}>
                      {curso.rama || 'Sin categoría'}
                    </span>

                    <h2>{curso.nombre}</h2>

                    <p>
                      Horario: {curso.hora || 'Sin horario'}
                    </p>
                  </div>

                  <span className={styles.queueCount}>
                    {cola.length} en cola
                  </span>
                </div>

                <article className={styles.requestCard}>
                  <div className={styles.requestInfo}>
                    <span className={styles.position}>
                      Siguiente solicitud
                    </span>

                    <h3>
                      {perfil
                        ? `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim()
                        : 'Alumno'}
                    </h3>

                    <p>
                      <strong>Matrícula:</strong>{' '}
                      {alumno?.matricula || 'No disponible'}
                    </p>

                    <p className={styles.date}>
                      Recibida:{' '}
                      {new Date(solicitud.created_at).toLocaleString(
                        'es-MX',
                        { timeZone: 'America/Monterrey' }
                      )}
                    </p>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.approveButton}
                      disabled={isPending}
                      onClick={() =>
                        procesarSolicitud(solicitud.id, 'aprobada')
                      }
                    >
                      {procesando === solicitud.id
                        ? 'Procesando...'
                        : 'Aprobar'}
                    </button>

                    <button
                      type="button"
                      className={styles.rejectButton}
                      disabled={isPending}
                      onClick={() =>
                        procesarSolicitud(solicitud.id, 'rechazada')
                      }
                    >
                      {procesando === solicitud.id
                        ? 'Procesando...'
                        : 'Rechazar'}
                    </button>
                  </div>
                </article>

                {cola.length > 1 && (
                  <p className={styles.remaining}>
                    Hay {cola.length - 1} solicitud(es) esperando
                    detrás de esta.
                  </p>
                )}
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}