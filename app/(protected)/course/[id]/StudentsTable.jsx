
import styles from './course.module.css';

export default function StudentsTable({ students }) {
  if (students.length === 0) {
    return (
      <div className={styles.emptyStudents}>
        Todavía no hay alumnos inscritos en este curso.
      </div>
    );
  }

  function estadoInscripcion(estado) {
    switch (estado) {
      case 'aprobada':
        return 'Aprobada';
      case 'pendiente':
        return 'Pendiente';
      case 'rechazada':
        return 'Rechazada';
      default:
        return 'Desconocido';
    }
  }

  return (
    <div className={styles.studentsTableContainer}>
      <table className={styles.studentsTable}>
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Matrícula</th>
            <th>Estado de inscripción</th>
          </tr>
        </thead>

        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>
                {student.nombre} {student.apellido}
              </td>

              <td>
                {student.matricula || 'Sin matrícula'}
              </td>

              <td>
                <span
                  className={`${styles.status} ${
                    styles[`status_${student.estado}`] || ''
                  }`}
                >
                  {estadoInscripcion(student.estado)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
