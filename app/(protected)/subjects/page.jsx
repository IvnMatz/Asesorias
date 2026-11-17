
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import SubjectsManager from './SubjectsManager';
import styles from './subjects.module.css';

export const runtime = 'nodejs';

export default async function SubjectsPage() {
  // 1. Verificar sesión
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Verificar rol administrativo
  const { data: esAdmin, error: roleError } =
    await supabase.rpc('has_role', {
      required_role: 'administrador',
    });

  if (roleError || !esAdmin) {
    redirect('/home');
  }

  // 3. Crear cliente administrativo
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error('Falta la configuración administrativa de Supabase.');
  }

  const supabaseAdmin = createSupabaseClient(
    supabaseUrl,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  // 4. Consultar materias
  const { data: materias, error: materiasError } =
    await supabaseAdmin
      .from('materias')
      .select('id, nombre, rama')
      .order('nombre');

  if (materiasError) {
    console.error('Error al consultar materias:', materiasError);
    throw new Error('No fue posible cargar las materias.');
  }

  // 5. Consultar relaciones
  const { data: relaciones, error: relacionesError } =
    await supabaseAdmin
      .from('materias_relaciones')
      .select('id, materia_id, prerrequisito_id')
      .order('materia_id');

  if (relacionesError) {
    console.error('Error al consultar relaciones:', relacionesError);
    throw new Error('No fue posible cargar las relaciones.');
  }

  // 6. Asociar los nombres de las materias a cada relación
  const materiasPorId = new Map(
    (materias || []).map((materia) => [materia.id, materia])
  );

  const relacionesConNombres = (relaciones || []).map((relacion) => ({
    ...relacion,
    materia: materiasPorId.get(relacion.materia_id)?.nombre || 'Materia desconocida',
    prerrequisito: materiasPorId.get(relacion.prerrequisito_id)?.nombre || 'Materia desconocida',
  }));

  return (
    <main className={styles.subjectsPage}>
      <header className={styles.subjectsHeader}>
        <h1>Relaciones entre materias</h1>
        <p>
          Administra los prerrequisitos que determinan las rutas de aprendizaje.
        </p>
      </header>

      <SubjectsManager
        materias={materias || []}
        initialRelations={relacionesConNombres}
      />
    </main>
  );
}