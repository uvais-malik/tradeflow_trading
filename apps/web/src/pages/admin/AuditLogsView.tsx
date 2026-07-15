import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  actor: {
    email: string;
    fullName: string;
    role: string;
  };
}

export default function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/audit', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setLogs(await res.json());
        }
      } catch (err) {
        console.error('Error fetching audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token]);

  if (loading) {
    return <div className="p-8 text-gray-400">Loading audit logs...</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Audit Logs</h2>

      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="p-4 font-semibold text-gray-300">Timestamp</th>
                <th className="p-4 font-semibold text-gray-300">Actor</th>
                <th className="p-4 font-semibold text-gray-300">Action</th>
                <th className="p-4 font-semibold text-gray-300">Entity</th>
                <th className="p-4 font-semibold text-gray-300">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-gray-700/50 hover:bg-gray-750">
                  <td className="p-4 text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-200">{log.actor?.email || 'System'}</div>
                    <div className="text-xs text-gray-500">{log.actor?.role}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-300">{log.entityType}</div>
                    <div className="text-xs text-gray-500 font-mono truncate w-32" title={log.entityId}>
                      {log.entityId}
                    </div>
                  </td>
                  <td className="p-4">
                    <pre className="text-xs text-gray-400 bg-gray-900 p-2 rounded max-w-xs overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
