
'use client'

import { useState } from 'react'

export default function Login() {
  const [matricula, setMatricula] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [alumno, setAlumno] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function iniciarSesion(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const respuesta = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matricula,
          contraseña
        })
      })

      const resultado = await respuesta.json()

      if (!respuesta.ok) {
        setError(resultado.error)
        return
      }

      setAlumno(resultado.nombre)
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  // Pantalla posterior al inicio de sesión
  if (alumno) {
    return (
      <main style={{ padding: '30px' }}>
        <h1>Bienvenido, {alumno}</h1>
      </main>
    )
  }

  // Formulario de inicio de sesión
  return (
    <main style={{
      maxWidth: '320px',
      margin: '100px auto',
      fontFamily: 'Arial'
    }}>
      <h1>Iniciar sesión</h1>

      <form onSubmit={iniciarSesion}>
        <label htmlFor="matricula">Matrícula</label>
        <input
          id="matricula"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
          required
          style={{ display: 'block', width: '100%',
                   margin: '8px 0 16px', padding: '8px',
                   boxSizing: 'border-box' }}
        />

        <label htmlFor="contraseña">Contraseña</label>
        <input
          id="contraseña"
          
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          required
          style={{ display: 'block', width: '100%',
                   margin: '8px 0 16px', padding: '8px',
                   boxSizing: 'border-box' }}
        />

        <button type="submit" disabled={cargando}>
          {cargando ? 'Validando...' : 'Entrar'}
        </button>

        {error && (
          <p style={{ color: 'red' }}>{error}</p>
        )}
      </form>
    </main>
  )
}