import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { errorMessage } from '../utils/format';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    phone: '',
    isActive: true,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      api.get(`/users/${id}`).then(({ data }) => {
        setForm({
          name: data.name,
          email: data.email,
          password: '',
          role: data.role,
          phone: data.phone || '',
          isActive: data.isActive,
        });
      });
    }
  }, [id]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form };
      if (id && !payload.password) delete payload.password;
      if (id) await api.put(`/users/${id}`, payload);
      else await api.post('/users', payload);
      navigate('/users');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-xl space-y-4">
      <h2 className="text-lg font-semibold">{id ? 'Edit user' : 'Add user'}</h2>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <label className="label">Name</label>
      <input className="input" name="name" value={form.name} onChange={onChange} required />
      <label className="label">Email</label>
      <input className="input" type="email" name="email" value={form.email} onChange={onChange} required />
      <label className="label">Password {id && '(leave blank to keep)'}</label>
      <input className="input" type="password" name="password" value={form.password} onChange={onChange} required={!id} />
      <label className="label">Role</label>
      <select className="input" name="role" value={form.role} onChange={onChange}>
        <option value="admin">Administrator</option>
        <option value="cashier">Cashier</option>
        <option value="stock_manager">Stock manager</option>
      </select>
      <label className="label">Phone</label>
      <input className="input" name="phone" value={form.phone} onChange={onChange} />
      {id && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={onChange} />
          Active account
        </label>
      )}
      <button className="btn-primary" type="submit">
        Save user
      </button>
    </form>
  );
};

export default UserForm;
