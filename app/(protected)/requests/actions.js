'use server'

import { createClient } from '@/lib/supabase/server'

export async function actualizarSolicitud(id, nuevoEstado) {
  if (!id || !['aceptada', 'rechazada'].includes(nuevoEstado)) {
    return {
      success: false,
      message: 'Datos de solicitud inválidos.'
    }
  }

  const supabase = await createClient()

  // Verificar sesión
  const { data: auth, error: authError } =
    await supabase.auth.getClaims()

  if (authError || !auth?.claims) {
    return {
      success: false,
      message: 'Tu sesión no es válida.'
    }
  }

  // Verificar rol
  const { data: esMaestro, error: roleError } =
    await supabase.rpc('has_role', {
      required_role: 'maestro'
    })

  if (roleError || !esMaestro) {
    return {
      success: false,
      message: 'No tienes permisos para realizar esta acción.'
    }
  }

  // Actualizar únicamente si todavía está pendiente
  const { data, error } = await supabase
    .from('inscripciones')
    .update({ estado: nuevoEstado })
    .eq('id', id)
    .eq('estado', 'pendiente')
    .select('id')
    .maybeSingle()

  if (error) {
    console.error(error)

    return {
      success: false,
      message: 'No fue posible actualizar la solicitud.'
    }
  }

  if (!data) {
    return {
      success: false,
      message: 'La solicitud ya fue procesada o no está disponible.'
    }
  }

  return {
    success: true,
    message: nuevoEstado === 'aceptada'
      ? 'Solicitud aceptada.'
      : 'Solicitud rechazada.'
  }
}