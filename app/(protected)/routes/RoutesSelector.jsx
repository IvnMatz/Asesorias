'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import styles from './routes.module.css'

export default function RoutesSelector({ materias, prerrequisitos }) {
  const ramas = useMemo(() => {
    return [...new Set(
      materias
        .map(materia => materia.rama)
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b))
  }, [materias])

  const [ramaSeleccionada, setRamaSeleccionada] = useState(
    ramas[0] || ''
  )

  const materiasPorId = useMemo(() => {
    return new Map(materias.map(materia => [materia.id, materia]))
  }, [materias])

  const materiasFiltradas = useMemo(() => {
    return materias.filter(
      materia => materia.rama === ramaSeleccionada
    )
  }, [materias, ramaSeleccionada])

  const prerrequisitosPorMateria = useMemo(() => {
    const mapa = new Map()

    for (const relacion of prerrequisitos) {
      if (!mapa.has(relacion.materia_id)) {
        mapa.set(relacion.materia_id, [])
      }

      mapa.get(relacion.materia_id).push(relacion.prerrequisito_id)
    }

    return mapa
  }, [prerrequisitos])

  return (
    <section className={styles.selectorSection}>
      <div className={styles.selectorContainer}>
        <label htmlFor="rama" className={styles.label}>
          Selecciona una rama académica
        </label>

        <select
          id="rama"
          className={styles.select}
          value={ramaSeleccionada}
          onChange={e => setRamaSeleccionada(e.target.value)}
        >
          {ramas.length === 0 && (
            <option value="">No hay ramas disponibles</option>
          )}

          {ramas.map(rama => (
            <option key={rama} value={rama}>
              {rama}
            </option>
          ))}
        </select>
      </div>

      {materiasFiltradas.length === 0 ? (
        <p className={styles.empty}>
          No hay materias registradas en esta rama.
        </p>
      ) : (
        <div className={styles.routes}>
          {materiasFiltradas.map(materia => {
            const ids = prerrequisitosPorMateria.get(materia.id) || []

            const requisitos = ids
              .map(id => materiasPorId.get(id))
              .filter(Boolean)

            return (
              <article key={materia.id} className={styles.subjectCard}>
                <div className={styles.subjectContent}>
                  <span className={styles.subjectLabel}>
                    Materia
                  </span>

                  <h2>{materia.nombre}</h2>

                  <span className={styles.branch}>
                    {materia.rama}
                  </span>
                </div>

                <div className={styles.dependencies}>
                  <h3>Anteriores</h3>

                  {requisitos.length > 0 ? (
                    <ul className={styles.requirementsList}>
                      {requisitos.map(requisito => (
                        <li key={requisito.id}>
                          <span className={styles.arrow}>←</span>

                          <span>
                            {requisito.nombre}
                            {requisito.rama !== ramaSeleccionada && (
                              <small className={styles.externalBranch}>
                                {requisito.rama}
                              </small>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.noRequirements}>
                      No requiere materias previas.
                    </p>
                  )}
                </div>

                <Link
                  href={`/search?materia=${encodeURIComponent(materia.id)}`}
                  className={styles.viewLink}
                >
                  Ver ofertas de esta materia →
                </Link>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}