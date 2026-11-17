
'use client';

import { useState } from 'react';
import styles from './subjects.module.css';

export default function SubjectsManager({
  materias,
  initialRelations,
}) {
  const [relaciones, setRelaciones] = useState(initialRelations);
  const [materiaId, setMateriaId] = useState('');
  const [prerrequisitoId, setPrerrequisitoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function crearRelacion(e) {
    e.preventDefault();

    setError('');
    setMensaje('');

    if (!materiaId || !prerrequisitoId) {
      setError('Selecciona ambas materias.');
      return;
    }

    if (materiaId === prerrequisitoId) {
      setError('Una materia no puede ser su propio prerrequisito.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/subjects/relations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materiaId,
          prerrequisitoId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'No fue posible crear la relación.'
        );
      }

      setRelaciones((current) => [
        ...current,
        result.relacion,
      ]);

      setMateriaId('');
      setPrerrequisitoId('');
      setMensaje('Relación creada correctamente.');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function eliminarRelacion(id) {
    setError('');
    setMensaje('');
    setDeletingId(id);

    try {
      const response = await fetch(
        `/api/subjects/relations/${id}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'No fue posible eliminar la relación.'
        );
      }

      setRelaciones((current) =>
        current.filter((relacion) => relacion.id !== id)
      );

      setMensaje('Relación eliminada correctamente.');

    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={styles.subjectsContent}>

      {/* Formulario de creación */}
      <section className={styles.formCard}>
        <h2>Crear relación</h2>

        <p>
          Indica qué materia requiere haber cursado otra previamente.
        </p>

        <form
          className={styles.relationForm}
          onSubmit={crearRelacion}
        >
          <div className={styles.formGroup}>
            <label htmlFor="materia">
              Materia
            </label>

            <select
              id="materia"
              value={materiaId}
              onChange={(e) => setMateriaId(e.target.value)}
              required
            >
              <option value="">
                Seleccionar materia
              </option>

              {materias.map((materia) => (
                <option
                  key={materia.id}
                  value={materia.id}
                >
                  {materia.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="prerrequisito">
              Prerrequisito
            </label>

            <select
              id="prerrequisito"
              value={prerrequisitoId}
              onChange={(e) => setPrerrequisitoId(e.target.value)}
              required
            >
              <option value="">
                Seleccionar prerrequisito
              </option>

              {materias
                .filter((materia) => materia.id !== materiaId)
                .map((materia) => (
                  <option
                    key={materia.id}
                    value={materia.id}
                  >
                    {materia.nombre}
                  </option>
                ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || materias.length < 2}
          >
            {loading ? 'Creando...' : 'Crear relación'}
          </button>
        </form>
      </section>

      {/* Mensajes */}
      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}

      {mensaje && (
        <p className={styles.successMessage} role="status">
          {mensaje}
        </p>
      )}

      {/* Tabla de relaciones */}
      <section className={styles.relationsSection}>
        <div className={styles.relationsHeader}>
          <h2>Relaciones existentes</h2>
          <span>{relaciones.length} relaciones</span>
        </div>

        {relaciones.length === 0 ? (
          <div className={styles.emptyState}>
            Todavía no hay relaciones entre materias.
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.relationsTable}>
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>Prerrequisito</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {relaciones.map((relacion) => (
                  <tr key={relacion.id}>
                    <td>{relacion.materia}</td>

                    <td>{relacion.prerrequisito}</td>

                    <td>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => eliminarRelacion(relacion.id)}
                        disabled={deletingId !== null}
                      >
                        {deletingId === relacion.id
                          ? 'Eliminando...'
                          : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
