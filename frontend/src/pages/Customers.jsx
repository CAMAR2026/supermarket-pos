import { useEffect, useState } from 'react';
import api from '../api/client';
import { errorMessage } from '../utils/format';

const empty = { name: '', phone: '', email: '', address: '', notes: '' };

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get('/customers');
    setCustomers(data);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) await api.put(`/customers/${editing}`, form);
      else await api.post('/customers', form);
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    await api.delete(`/customers/${id}`);
    load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
      <form onSubmit={save} className="card space-y-3">
        <h2 className="font-semibold">{editing ? 'Edit customer' : 'Add customer'}</h2>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <textarea className="input" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button className="btn-primary" type="submit">
          Save
        </button>
      </form>
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c._id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.email}</td>
                <td className="space-x-3 px-4 text-right">
                  <button
                    type="button"
                    className="text-emerald-700"
                    onClick={() => {
                      setEditing(c._id);
                      setForm({
                        name: c.name,
                        phone: c.phone,
                        email: c.email || '',
                        address: c.address || '',
                        notes: c.notes || '',
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="text-rose-600" onClick={() => remove(c._id)}>
                    Delete
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

export default Customers;
