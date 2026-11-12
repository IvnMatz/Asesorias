
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './edit.module.css'

const horarios = [
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6',
  'V1', 'V2', 'V3', 'V4', 'V5', 'V6',
  'N1', 'N2', 'N3', 'N4', 'N5', 'N6',
]

export default function EditCourseForm({ curso, materias }) {
  const router = useRouter()

  const [form, setForm] = useState({
    nombre: curso.nombre ?? '',
    rama: curso.rama ?? '',
    descripcion: curso.descripcion ?? '',
    hora: curso.hora ?? '',
    materia_id: curso.materia_id ?? '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (
      !form.nombre.trim() ||
      !form.rama.trim() ||
      !form.descripcion.trim() ||
      !form.hora ||
      !form.materia_id
    ) {
      setError('Completa todos los campos antes de continuar.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/courses/${curso.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          rama: form.rama.trim(),
          descripcion: form.descripcion.trim(),
          hora: form.hora,
          materia_id: form.materia_id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error || 'No fue posible actualizar el curso.'
        )
      }

      router.push(`/course/${curso.id}`)
      router.refresh()

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="nombre">Nombre del curso</label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          value={form.nombre}
          onChange={handleChange}
          maxLength={150}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="rama">Rama</label>
        <input
          id="rama"
          name="rama"
          type="text"
          value={form.rama}
          onChange={handleChange}
          maxLength={100}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          rows={5}
          maxLength={2000}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="hora">Horario</label>
        <select
          id="hora"
          name="hora"
          value={form.hora}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona un horario</option>

          {horarios.map((horario) => (
            <option key={horario} value={horario}>
              {horario}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="materia_id">Materia</label>
        <select
          id="materia_id"
          name="materia_id"
          value={form.materia_id}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona una materia</option>

          {materias.map((materia) => (
            <option key={materia.id} value={materia.id}>
              {materia.nombre}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => router.push(`/course/${curso.id}`)}
          disabled={loading}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}