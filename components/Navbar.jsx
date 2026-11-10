import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import styles from './navbar.module.css'

export default async function Navbar() {
  await connection()

  const supabase = await createClient()

  // Verificar sesión
  const { data: auth, error: authError } =
    await supabase.auth.getClaims()

  if (authError || !auth?.claims) {
    redirect('/login')
  }

  const userId = auth.claims.sub

  // Consultar los roles del usuario
  const [alumno, maestro, administrador] =
    await Promise.all([
      supabase.rpc('has_role', {
        required_role: 'alumno'
      }),
      supabase.rpc('has_role', {
        required_role: 'maestro'
      }),
      supabase.rpc('has_role', {
        required_role: 'administrador'
      })
    ])

  if (alumno.error || maestro.error || administrador.error) {
    console.error('Error al consultar roles:', {
      alumno: alumno.error,
      maestro: maestro.error,
      administrador: administrador.error
    })

    throw new Error('No fue posible determinar el rol del usuario.')
  }

  // Determinar enlaces
  let links = []

  if (alumno.data) {
    links = [
      { label: 'Inicio', href: '/home' },
      { label: 'Mis cursos', href: '/my-courses' }
    ]
  } else if (maestro.data) {
    links = [
      { label: 'Inicio', href: '/home' },
      
      { label: 'Administrar cursos', href: '/courses' },
      { label: 'Mi perfil', href: `/profesor/${userId}` }
    ]
  } else if (administrador.data) {
    links = [
      { label: 'Inicio', href: '/home' },
      { label: 'Administración', href: '/admin' }
    ]
  } else {
    throw new Error('El usuario no tiene un rol válido.')
  }

  return (
    <nav className={styles.navbar}>
      <Link href="/home" className={styles.logo}>
        Asesorías
      </Link>

      <div className={styles.links}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={styles.link}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}