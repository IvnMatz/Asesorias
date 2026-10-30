
'use client'

import { useEffect, useState } from 'react'
import './css/ListaCursos.css'

export default function ListaCursos() {
  const [cursos, setCursos] = useState([])
  const [ascendente, setAscendente] = useState(true);
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

//SELECTION SORT
  function ordenarCursos() {
  const copia = [...cursos];

  // Selection Sort
  for (let i = 0; i < copia.length - 1; i++) {
    let indice = i;

    for (let j = i + 1; j < copia.length; j++) {
      if (
        ascendente
          ? copia[j].id < copia[indice].id
          : copia[j].id > copia[indice].id
      ) {
        indice = j;
      }
    }

    // Intercambiar elementos
    [copia[i], copia[indice]] = [copia[indice], copia[i]];
  }

  setCursos(copia);
  setAscendente(!ascendente);
}

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
      <button onClick={ordenarCursos} type="button">
        Ordenar {ascendente ? "↑" : "↓"}
        </button>

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