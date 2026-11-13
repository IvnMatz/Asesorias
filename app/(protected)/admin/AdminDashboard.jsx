
import Link from 'next/link'
import styles from './admin.module.css'

function StatCard({ title, value, description }) {
  return (
    <article className={styles.statCard}>
      <p className={styles.statTitle}>{title}</p>
      <strong className={styles.statValue}>{value}</strong>
      <span className={styles.statDescription}>
        {description}
      </span>
    </article>
  )
}

function Ranking({ title, items, valueLabel, valueKey }) {
  return (
    <section className={styles.ranking}>
      <h2>{title}</h2>

      {items.length === 0 ? (
        <p className={styles.empty}>
          Todavía no hay información disponible.
        </p>
      ) : (
        <ol className={styles.rankingList}>
          {items.map((item, index) => (
            <li key={item.id} className={styles.rankingItem}>
              <span className={styles.position}>
                {index + 1}
              </span>

              <span className={styles.itemName}>
                {item.nombre}
              </span>

              <span className={styles.itemValue}>
                {item[valueKey]} {valueLabel}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default function AdminDashboard({ stats }) {
  return (
    <div className={styles.dashboard}>

      {/* Navegación administrativa */}
      <section className={styles.management}>
        <h2>Gestión del sistema</h2>

        <div className={styles.managementGrid}>
          <Link href="/accounts" className={styles.managementCard}>
            <div className={styles.managementIcon}>♙</div>
            <div>
              <h3>Administrar cuentas</h3>
              <p>Crear y administrar usuarios del sistema.</p>
            </div>
            <span className={styles.arrow}>→</span>
          </Link>

          <Link href="/subjects" className={styles.managementCard}>
            <div className={styles.managementIcon}>▤</div>
            <div>
              <h3>Administrar materias</h3>
              <p>Gestionar las materias y sus prerrequisitos.</p>
            </div>
            <span className={styles.arrow}>→</span>
          </Link>
        </div>
      </section>

      {/* Estadísticas generales */}
      <section className={styles.statistics}>
        <h2>Resumen del sistema</h2>

        <div className={styles.statsGrid}>
          <StatCard
            title="Perfiles registrados"
            value={stats.perfiles}
            description="Cuentas con perfil"
          />

          <StatCard
            title="Cursos existentes"
            value={stats.cursos}
            description="Cursos registrados"
          />

          <StatCard
            title="Maestros"
            value={stats.maestros}
            description="Profesores registrados"
          />

          <StatCard
            title="Alumnos"
            value={stats.alumnos}
            description="Estudiantes registrados"
          />
        </div>
      </section>

      {/* Rankings */}
      <section className={styles.rankings}>
        <h2>Actividad del sistema</h2>

        <div className={styles.rankingGrid}>
          <Ranking
            title="Cursos con más inscripciones"
            items={stats.topCursos}
            valueLabel="inscripciones"
            valueKey="inscripciones"
          />

          <Ranking
            title="Maestros con más cursos"
            items={stats.topMaestros}
            valueLabel="cursos"
            valueKey="cursos"
          />
        </div>
      </section>

    </div>
  )
}