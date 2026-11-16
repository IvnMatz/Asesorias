
'use client';

import { useState } from 'react';
import styles from './registration.module.css';

export default function RegistrationForm({
  tipoRegistro,
  email,
  validador,
}) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [identificador, setIdentificador] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function completarRegistro(e) {
    e.preventDefault();

    setError('');

    // 1. Validaciones locales
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!nombre.trim() || !apellido.trim()) {
      setError('Debes completar tu nombre y apellido.');
      return;
    }

    if (
      (tipoRegistro === 'alumno' || tipoRegistro === 'maestro') &&
      !identificador.trim()
    ) {
      setError('Debes introducir tu identificador.');
      return;
    }

    setCargando(true);

    try {
      // 2. Enviar los datos al servidor
      const response = await fetch('/api/accounts/complete-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validador,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          identificador: identificador.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'No fue posible completar el registro.'
        );
      }

      // 3. Registro completado
      window.location.href = '/login?message=registration_completed';

    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  }

  return (
    <main className={styles.registrationPage}>
      <div className={styles.registrationCard}>

        <div className={styles.registrationHeader}>
          <h1>Completar registro</h1>
          <p>
            Introduce tus datos para activar tu cuenta.
          </p>
        </div>

        <form
          className={styles.registrationForm}
          onSubmit={completarRegistro}
        >

          {/* Correo asociado a la invitación */}
          <div className={styles.formGroup}>
            <label htmlFor="email">Correo electrónico</label>

            <input
              id="email"
              type="email"
              value={email}
              readOnly
            />
          </div>

          {/* Nombre */}
          <div className={styles.formGroup}>
            <label htmlFor="nombre">Nombre</label>

            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              maxLength={100}
              required
            />
          </div>

          {/* Apellido */}
          <div className={styles.formGroup}>
            <label htmlFor="apellido">Apellido</label>

            <input
              id="apellido"
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Tu apellido"
              maxLength={100}
              required
            />
          </div>

          {/* Identificador según tipo de usuario */}
          {tipoRegistro === 'alumno' && (
            <div className={styles.formGroup}>
              <label htmlFor="identificador">Matrícula</label>

              <input
                id="identificador"
                type="text"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="Tu matrícula"
                maxLength={50}
                required
              />
            </div>
          )}

          {tipoRegistro === 'maestro' && (
            <div className={styles.formGroup}>
              <label htmlFor="identificador">
                Número de empleado
              </label>

              <input
                id="identificador"
                type="text"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="Tu número de empleado"
                maxLength={50}
                required
              />
            </div>
          )}

          {tipoRegistro === 'administrador' && (
            <p className={styles.infoMessage}>
              Tu cuenta tendrá el tipo de usuario Administración.
            </p>
          )}

          {/* Contraseña */}
          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crea una contraseña"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>

          {/* Confirmar contraseña */}
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">
              Confirmar contraseña
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>

          {/* Mensajes */}
          {error && (
            <p className={styles.errorMessage}>
              {error}
            </p>
          )}

          {/* Enviar */}
          <button
            type="submit"
            disabled={cargando}
          >
            {cargando
              ? 'Completando registro...'
              : 'Completar registro'}
          </button>

        </form>
      </div>
    </main>
  );
}