
'use client'

import { useEffect, useState } from 'react'
import './css/ListaCursos.css'

export default function ListaCursos() {
  const [cursos, setCursos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function obtenerCursos() {
      try {
        const respuesta = await fetch('/api/cursos', {
          signal: controller.signal
        })

        const resultado = await respuesta.json()

        if (!respuesta.ok) {
          throw new Error(
            resultado.error || 'Error al cargar los cursos'
          )
        }

        setCursos(resultado)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Error de conexión')
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false)
        }
      }
    }

    obtenerCursos()

    return () => controller.abort()
  }, [])

  if (cargando) {
    return <p className="cursos-mensaje">Cargando cursos...</p>
  }

  if (error) {
    return (
      <p className="cursos-error" role="alert">
        {error}
      </p>
    )
  }

  if (cursos.length === 0) {
    return (
      <p className="cursos-mensaje">
        No hay cursos disponibles.
      </p>
    )
  }

  return (
    <section className="cursos-container">
      <h1 className="cursos-titulo">Cursos disponibles</h1>

      <div className="cursos-grid">
        {cursos.map((curso, index) => (
          <article
            className="curso-card"
            key={`${curso.nombre}-${index}`}
          >
            <h2 className="curso-nombre">{curso.nombre}</h2>

            <div className="curso-datos">
              <p>
                <span>Horario:</span> {curso.hora}
              </p>

              <p>
                <span>Fecha:</span> {curso.fecha}
              </p>

              <p>
                <span>Rama:</span> {curso.rama}
              </p>

              <p>
                <span>Maestro:</span> {curso.maestro}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}