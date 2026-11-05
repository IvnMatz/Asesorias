
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    redirect('/login')
  }

  const userId = data.claims.sub

  return (
    <main>
      <h1>Inicio</h1>
      <p>Has iniciado sesión correctamente.</p>
      <p>Tu UUID: {userId}</p>
    </main>
  )
}