'use client'

import { useEffect, useState } from 'react'

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
    <table>
      <thead>
        <tr>
          <th>Curso</th>
          <th>Hora</th>
          <th>Fecha</th>
          <th>Rama</th>
          <th>Maestro</th>
        </tr>
      </thead>

      <tbody>
        {inscripciones.map((inscripcion, index) => (
          <tr key={`${inscripcion.nombre}-${index}`}>
            <td>{inscripcion.nombre}</td>
            <td>{inscripcion.hora}</td>
            <td>{inscripcion.fecha}</td>
            <td>{inscripcion.rama}</td>
            <td>{inscripcion.maestro}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}