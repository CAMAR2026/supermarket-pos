import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../api/client';
import { errorMessage, formatDate } from '../utils/format';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get('/users');
    setUsers(data);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (user) => {
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.isActive });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link to="/users/new" className="btn-primary">
          <Plus size={16} /> Add user
        </Link>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td>{u.email}</td>
                <td className="capitalize">{u.role.replace('_', ' ')}</td>
                <td>{u.isActive ? 'Active' : 'Inactive'}</td>
                <td>{formatDate(u.createdAt)}</td>
                <td className="space-x-3 px-4 text-right">
                  <Link className="text-emerald-700" to={`/users/${u.id}`}>
                    Edit
                  </Link>
                  <button type="button" className="text-slate-600" onClick={() => toggle(u)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
