
'use client';

import { useState } from 'react';
import styles from './pending.module.css';

export default function PendingAccountsTable({
  initialAccounts,
  roles,
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');

  async function asignarRol(userId) {
    const roleId = Number(selectedRoles[userId]);

    if (!roleId) {
      setError('Selecciona un rol antes de continuar.');
      return;
    }

    setError('');
    setLoadingId(userId);

    try {
      const response = await fetch('/api/accounts/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          roleId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'No fue posible asignar el rol.'
        );
      }

      // Quitar la cuenta de la tabla
      setAccounts((current) =>
        current.filter((account) => account.id !== userId)
      );

      setSelectedRoles((current) => {
        const updated = { ...current };
        delete updated[userId];
        return updated;
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  function tipoRegistro(account) {
    if (account.es_alumno) return 'Alumno';
    if (account.es_maestro) return 'Maestro';
    return 'Sin registro académico';
  }

  return (
  <section>
    <p className={styles.pendingCount}>
      {accounts.length} cuenta(s) pendiente(s)
    </p>

    {error && (
      <p className={styles.errorMessage} role="alert">
        {error}
      </p>
    )}

    {accounts.length === 0 ? (
      <div className={styles.emptyState}>
        No hay cuentas pendientes de asignación.
      </div>
    ) : (
      <div className={styles.tableContainer}>
        <table className={styles.pendingTable}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Tipo de registro</th>
              <th>Rol</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td className={styles.accountName}>
                  {account.nombre} {account.apellido}
                </td>

                <td className={styles.accountEmail}>
                  {account.email}
                </td>

                <td className={styles.accountType}>
                  {tipoRegistro(account)}
                </td>

                <td>
                  <select
                    className={styles.roleSelect}
                    value={selectedRoles[account.id] || ''}
                    onChange={(e) =>
                      setSelectedRoles((current) => ({
                        ...current,
                        [account.id]: e.target.value,
                      }))
                    }
                    disabled={loadingId === account.id}
                  >
                    <option value="">
                      Seleccionar rol
                    </option>

                    {roles.map((role) => {
                      const compatible =
                        (role.nombre === 'alumno' &&
                          account.es_alumno &&
                          !account.es_maestro) ||
                        (role.nombre === 'maestro' &&
                          account.es_maestro &&
                          !account.es_alumno) ||
                        (role.nombre === 'administración' &&
                          !account.es_alumno &&
                          !account.es_maestro);

                      if (!compatible) return null;

                      return (
                        <option key={role.id} value={role.id}>
                          {role.nombre}
                        </option>
                      );
                    })}
                  </select>
                </td>

                <td>
                  <button
                    className={styles.assignButton}
                    type="button"
                    onClick={() => asignarRol(account.id)}
                    disabled={loadingId !== null}
                  >
                    {loadingId === account.id
                      ? 'Asignando...'
                      : 'Asignar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);
}