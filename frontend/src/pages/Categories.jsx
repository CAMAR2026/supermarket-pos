import { useEffect, useState } from 'react';
import api from '../api/client';
import { errorMessage } from '../utils/format';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get('/categories');
    setCategories(data);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/categories/${editing}`, { name, description });
      } else {
        await api.post('/categories', { name, description });
      }
      setName('');
      setDescription('');
      setEditing(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <form onSubmit={save} className="card space-y-3">
        <h2 className="font-semibold">{editing ? 'Edit category' : 'Add category'}</h2>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <label className="label">Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        <label className="label">Description</label>
        <textarea className="input" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="btn-primary" type="submit">
          {editing ? 'Update' : 'Create'}
        </button>
      </form>
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th>Products</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c._id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td>{c.productCount}</td>
                <td className="space-x-3 px-4 text-right">
                  <button
                    type="button"
                    className="text-emerald-700"
                    onClick={() => {
                      setEditing(c._id);
                      setName(c.name);
                      setDescription(c.description || '');
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

export default Categories;
