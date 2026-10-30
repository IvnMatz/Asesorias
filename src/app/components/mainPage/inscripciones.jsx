'use client'

import { useEffect, useState } from 'react'
import './css/ListaCursos.css'

export default function TablaInscripciones({ matricula }) {
  const [inscripciones, setInscripciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!matricula) {
      setInscripciones([])
      setCargando(false)
      return
    }

    const controller = new AbortController()

    async function obtenerInscripciones() {
      setCargando(true)
      setError('')

      try {
        const respuesta = await fetch(
          `/api/inscripciones?matricula=${encodeURIComponent(matricula)}`,
          { signal: controller.signal }
        )

        const resultado = await respuesta.json()

        if (!respuesta.ok) {
          throw new Error(
            resultado.error || 'Error al obtener las inscripciones'
          )
        }

        setInscripciones(resultado)
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

    obtenerInscripciones()

    return () => controller.abort()
  }, [matricula])

  if (cargando) {
    return <p>Cargando inscripciones...</p>
  }

  if (error) {
    return <p role="alert">Error: {error}</p>
  }

  if (inscripciones.length === 0) {
    return <p>No hay inscripciones para esta matrícula.</p>
  }

  return (
  <div className="cursos-container">
    <div className="cursos-grid">
      {inscripciones.map((inscripcion, index) => (
        <div
          className="curso-card"
          key={`${inscripcion.nombre}-${index}`}
        >
          <h3 className='curso-nombre'>{inscripcion.nombre}</h3>
          <div className='curso-datos'>
          <p>
            <strong>Hora:</strong> {inscripcion.hora}
          </p>

          <p>
            <strong>Fecha:</strong> {inscripcion.fecha}
          </p>

          <p>
            <strong>Rama:</strong> {inscripcion.rama}
          </p>

          <p>
            <strong>Maestro:</strong> {inscripcion.maestro}
          </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
}