
'use client'

import { useState } from 'react'
import MainMenu from './mainPage/MainMenu'
import './mainPage/css/login.css'

export default function Login() {
  const [matricula, setMatricula] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [tipo, setTipo] = useState("alumno")
  const [alumno, setAlumno] = useState({})
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

      setAlumno({nombre: resultado.nombre, matricula: resultado.matricula})
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  // Pantalla posterior al inicio de sesión
  if (alumno.nombre != null) {
    return (
      <MainMenu alumno={alumno}/>
    )
  }

  // Formulario de inicio de sesión
  return (
    <main className="login">
      <h1>Iniciar sesión</h1>

      <form onSubmit={iniciarSesion}>
        <select name="tipo" id="tipo" defaultValue={"alumno"} onChange={(e) => setTipo(e.target.value)}>
            <option value="alumno"> Alumno </option>
            <option value="profesor"> Profesor </option>
        </select>
        <label htmlFor="matricula">Matrícula</label>
        <input
          id="matricula"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
          required
          
        />

        <label htmlFor="contraseña">Contraseña</label>
        <input
          id="contraseña"
          
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          required
          type='password'
        />

        <button type="submit" disabled={cargando}>
          {cargando ? 'Validando...' : 'Entrar'}
        </button>

        {error && (
          <p className="loginError" role="alert">{error}</p>
        )}
      </form>
    </main>
  )
}