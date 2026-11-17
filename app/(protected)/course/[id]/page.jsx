
import { redirect, notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { solicitarInscripcion } from './actions';
import StudentsTable from './StudentsTable';

import styles from './course.module.css';

export default async function CursoPage({ params }) {
  const { id } = await params;

  const supabase = await createClient();

  // 1. Comprobar sesión
  const {
    data: auth,
    error: authError,
  } = await supabase.auth.getClaims();

  if (authError || !auth?.claims) {
    redirect('/login');
  }

  const userId = auth.claims.sub;

  // 2. Consultar curso
  const { data: curso, error } = await supabase
    .from('vista_catalogo_cursos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !curso) {
    notFound();
  }

  // 3. Comprobar roles
  const [
    { data: esAlumno },
    { data: esMaestro },
  ] = await Promise.all([
    supabase.rpc('has_role', {
      required_role: 'alumno',
    }),

    supabase.rpc('has_role', {
      required_role: 'maestro',
    }),
  ]);

  // 4. Comprobar si el maestro es propietario del curso
  const esMaestroPropietario =
    esMaestro && curso.maestro_id === userId;

  // 5. Consultar inscripción del alumno
  let inscripcion = null;

  if (esAlumno) {
    const { data, error: inscripcionError } = await supabase
      .from('inscripciones')
      .select('estado')
      .eq('alumno', userId)
      .eq('curso', id)
      .maybeSingle();

    if (inscripcionError) {
      console.error('Error al consultar inscripción:', inscripcionError);
    }

    inscripcion = data;
  }

  // 6. Consultar alumnos del curso, únicamente para su maestro
  let students = [];

  if (esMaestroPropietario) {
    const { data: inscripciones, error: studentsError } =
      await supabase
        .from('inscripciones')
        .select('id, alumno, estado')
        .eq('curso', id)
        .order('id');

    if (studentsError) {
      console.error('Error al consultar alumnos:', studentsError);
    } else if (inscripciones?.length > 0) {
      const alumnoIds = [
        ...new Set(inscripciones.map((item) => item.alumno)),
      ];

      // Obtener perfiles y matrículas
      const [
        { data: perfiles, error: perfilesError },
        { data: alumnos, error: alumnosError },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, nombre, apellido')
          .in('id', alumnoIds),

        supabase
          .from('alumnos')
          .select('id, matricula')
          .in('id', alumnoIds),
      ]);

      if (perfilesError || alumnosError) {
        console.error(
          'Error al consultar información de alumnos:',
          perfilesError || alumnosError
        );
      } else {
        const perfilesMap = new Map(
          (perfiles || []).map((perfil) => [perfil.id, perfil])
        );

        const alumnosMap = new Map(
          (alumnos || []).map((alumno) => [alumno.id, alumno])
        );

        students = inscripciones.map((inscripcion) => {
          const perfil = perfilesMap.get(inscripcion.alumno);
          const alumno = alumnosMap.get(inscripcion.alumno);

          return {
            id: inscripcion.id,
            nombre: perfil?.nombre || 'Sin nombre',
            apellido: perfil?.apellido || '',
            matricula: alumno?.matricula || null,
            estado: inscripcion.estado,
          };
        });
      }
    }
  }

  // 7. Renderizar página
  return (
    <main className={styles.coursePage}>
      <section className={styles.courseInfo}>
        <h1>{curso.nombre}</h1>

        <p>
          <strong>Rama:</strong>{' '}
          {curso.rama || 'Sin categoría'}
        </p>

        <p>
          <strong>Maestro:</strong>{' '}
          {curso.maestro_nombre
            ? `${curso.maestro_nombre} ${curso.maestro_apellido ?? ''}`
            : 'No asignado'}
        </p>

        <p>
          <strong>Horario:</strong>{' '}
          {curso.hora || 'Sin horario'}
        </p>

        <p>
          <strong>Descripción:</strong>{' '}
          {curso.descripcion || 'Sin descripción'}
        </p>

        {/* Contenido exclusivo para alumnos */}
        {esAlumno && (
          <section className={styles.enrollmentSection}>
            {!inscripcion ? (
              <form action={solicitarInscripcion}>
                <input
                  type="hidden"
                  name="cursoId"
                  value={curso.id}
                />

                <button type="submit">
                  Inscribir
                </button>
              </form>
            ) : inscripcion.estado === 'pendiente' ? (
              <p>Solicitud pendiente</p>
            ) : inscripcion.estado === 'aprobada' ? (
              <p>Inscrito</p>
            ) : (
              <p>Solicitud rechazada</p>
            )}
          </section>
        )}
      </section>

      {/* Contenido exclusivo para el maestro propietario */}
      {esMaestroPropietario && (
        <section className={styles.studentsSection}>
          <header className={styles.studentsHeader}>
            <h2>Alumnos del curso</h2>
            <p>
              Consulta los alumnos que han solicitado inscripción
              y el estado de sus solicitudes.
            </p>
          </header>

          <StudentsTable students={students} />
        </section>
      )}
    </main>
  );
}
