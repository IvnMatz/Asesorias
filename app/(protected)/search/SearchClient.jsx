
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from './search.module.css'

export default function SearchClient({ materiaId }) {
  const [searchText, setSearchText] = useState('')
  const [currentQuery, setCurrentQuery] = useState('')
  const [searchStack, setSearchStack] = useState([])

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

 const supabase = useMemo(() => createClient(), [])

  // Ejecuta la búsqueda en Supabase.
  const searchCourses = useCallback(async (query) => {
    setLoading(true)
    setError(null)

    try {
      let request = supabase
        .from('vista_catalogo_cursos')
        .select('*')

      // Si venimos desde una ruta de aprendizaje,
      // limitamos los resultados a esa materia.
      if (materiaId) {
        request = request.eq('materia_id', materiaId)
      }

      const term = query.trim()

      if (term) {
        // Evitamos caracteres que pueden alterar
        // la sintaxis del filtro OR de PostgREST.
        const safeTerm = term.replace(/[(),.]/g, ' ')

        request = request.or(
          `nombre.ilike.%${safeTerm}%,` +
          `rama.ilike.%${safeTerm}%,` +
          `descripcion.ilike.%${safeTerm}%,` +
          `maestro_nombre.ilike.%${safeTerm}%,` +
          `maestro_apellido.ilike.%${safeTerm}%`
        )
      }

      const { data, error } = await request.order(
        'nombre',
        { ascending: true }
      )

      if (error) throw error

      setResults(data || [])
    } catch (err) {
      console.error(err)
      setError('No fue posible realizar la búsqueda.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [materiaId, supabase])

  // Cargar resultados al entrar a la página.
  useEffect(() => {
    searchCourses('')
  }, [searchCourses])

  // Ejecutar una nueva búsqueda.
  async function handleSearch(e) {
    e.preventDefault()

    const query = searchText.trim()

    if (query === currentQuery) return

    // PUSH: guardar la búsqueda anterior.
    setSearchStack(previous => [
      ...previous,
      currentQuery
    ])

    setCurrentQuery(query)

    await searchCourses(query)
  }

  // Recuperar la búsqueda anterior.
  async function handlePreviousSearch() {
    if (searchStack.length === 0) return

    // POP: extraer la última búsqueda de la pila.
    const previousStack = [...searchStack]
    const previousQuery = previousStack.pop()

    setSearchStack(previousStack)
    setSearchText(previousQuery)
    setCurrentQuery(previousQuery)

    await searchCourses(previousQuery)
  }

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h1>Buscar cursos</h1>
        <p>
          Encuentra materias y cursos disponibles en el catálogo.
        </p>
      </header>

      <form
        className={styles.searchForm}
        onSubmit={handleSearch}
      >
        <input
          type="text"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="Buscar materias, cursos o profesores..."
          className={styles.searchInput}
        />

        <button
          type="submit"
          className={styles.searchButton}
          disabled={loading}
        >
          Buscar
        </button>
      </form>

      <div className={styles.historyContainer}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handlePreviousSearch}
          disabled={searchStack.length === 0 || loading}
        >
          ← Volver a última búsqueda
        </button>

        <span className={styles.historyCount}>
          {searchStack.length} búsqueda(s) anterior(es)
        </span>
      </div>

      <div className={styles.resultsHeader}>
        <h2>Resultados</h2>

        {!loading && (
          <span>{results.length} cursos encontrados</span>
        )}
      </div>

      {loading ? (
        <p className={styles.message}>
          Buscando cursos...
        </p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : results.length === 0 ? (
        <p className={styles.message}>
          No se encontraron cursos.
        </p>
      ) : (
        <div className={styles.resultsGrid}>
          {results.map(curso => (
            <article
              key={curso.id}
              className={styles.courseCard}
            >
              <div className={styles.courseInfo}>
                <span className={styles.branch}>
                  {curso.rama || 'Sin rama'}
                </span>

                <h3>{curso.nombre}</h3>

                <p className={styles.description}>
                  {curso.descripcion || 'Sin descripción disponible.'}
                </p>
              </div>

              <div className={styles.teacher}>
                <span>Impartido por</span>
                <strong>
                  {[
                    curso.maestro_nombre,
                    curso.maestro_apellido
                  ].filter(Boolean).join(' ') || 'Profesor no disponible'}
                </strong>
              </div>

              <div className={styles.courseFooter}>
                <span>{curso.hora || 'Horario no disponible'}</span>

                <Link
                  href={`/course/${curso.id}`}
                  className={styles.viewLink}
                >
                  Ver curso →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}