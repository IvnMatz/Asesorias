'use client';

import { useState } from 'react';
import styles from './accounts.module.css';

export default function UserInvite() {
  const [email, setEmail] = useState('');
  const [tipoRegistro, setTipoRegistro] = useState('alumno');

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [urlInvitacion, setUrlInvitacion] = useState('');
  const [copiado, setCopiado] = useState(false);

  async function enviarInvitacion(e) {
    e.preventDefault();

    setCargando(true);
    setError('');
    setMensaje('');
    setUrlInvitacion('');
    setCopiado(false);

    try {
      const response = await fetch('/api/accounts/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          tipoRegistro,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'No fue posible crear la invitación.');
      }

      setMensaje(result.message);
      setUrlInvitacion(result.url);

      setEmail('');
      setTipoRegistro('alumno');

    } catch (err) {
      setError(err.message);

    } finally {
      setCargando(false);
    }
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(urlInvitacion);
      setCopiado(true);
    } catch (err) {
      setError('No fue posible copiar el enlace.');
    }
  }

  return (
    <div className={styles.inviteCard}>

      <div className={styles.inviteHeader}>
        <h2>Invitar usuario</h2>
        <p>Crea una cuenta y genera un enlace de registro.</p>
      </div>

      <form
        className={styles.inviteForm}
        onSubmit={enviarInvitacion}
      >

        <div className={styles.formGroup}>
          <label htmlFor="email">Correo electrónico</label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tipoRegistro">Tipo de usuario</label>

          <select
            id="tipoRegistro"
            value={tipoRegistro}
            onChange={(e) => setTipoRegistro(e.target.value)}
            required
          >
            <option value="alumno">Alumno</option>
            <option value="maestro">Maestro</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>

        {error && (
          <p className={styles.errorMessage}>
            {error}
          </p>
        )}

        <button type="submit" disabled={cargando}>
          {cargando ? 'Creando invitación...' : 'Invitar usuario'}
        </button>

      </form>

      {mensaje && (
        <p className={styles.successMessage}>
          {mensaje}
        </p>
      )}

      {urlInvitacion && (
        <div className={styles.formGroup}>
          <label htmlFor="urlInvitacion">
            Enlace de registro
          </label>

          <input
            id="urlInvitacion"
            type="text"
            value={urlInvitacion}
            readOnly
            onFocus={(e) => e.target.select()}
          />

          <button
            type="button"
            onClick={copiarEnlace}
          >
            {copiado ? 'Enlace copiado' : 'Copiar enlace'}
          </button>

          <small>
            Comparte este enlace con el usuario invitado.
            Tiene una vigencia de 48 horas.
          </small>
        </div>
      )}

    </div>
  );
}