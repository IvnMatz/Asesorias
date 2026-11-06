'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function solicitarInscripcion(formData) {
  const supabase = await createClient()

  // 1. Verificar sesión
  const { data: auth, error: authError } =
    await supabase.auth.getClaims()

  if (authError || !auth?.claims) {
    redirect('/login')
  }

  const userId = auth.claims.sub
  const cursoId = formData.get('cursoId')

  // 2. Verificar rol
  const { data: esAlumno } = await supabase.rpc('has_role', {
    required_role: 'alumno'
  })

  if (!esAlumno) {
    throw new Error('No tienes permiso para solicitar inscripción.')
  }

  // 3. Crear solicitud
  const { error } = await supabase
    .from('inscripciones')
    .insert({
      alumno: userId,
      curso: cursoId,
      estado: 'pendiente'
    })

  if (error) {
    console.error('Error al solicitar inscripción:', error)
    throw new Error('No fue posible crear la solicitud.')
  }

  // 4. Volver al curso
  redirect(`/curso/${cursoId}`)
}