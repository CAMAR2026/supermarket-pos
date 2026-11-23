import { useEffect, useState } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import { errorMessage } from '../utils/format';

const Inventory = () => {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [type, setType] = useState('receive');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    const { data: res } = await api.get('/inventory');
    setData(res);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/inventory/${selected._id}`, {
        type,
        quantity: Number(quantity),
        reason,
      });
      setSelected(null);
      setQuantity('');
      setReason('');
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!data) return <p>Loading inventory…</p>;

  const list =
    filter === 'low' ? data.lowStock : filter === 'out' ? data.outOfStock : data.products;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[
          ['all', 'All stock'],
          ['low', 'Low stock'],
          ['out', 'Out of stock'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-2 text-sm ${
              filter === key ? 'bg-emerald-600 text-white' : 'bg-white ring-1 ring-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Threshold</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p._id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td>{p.sku}</td>
                <td>{p.category?.name}</td>
                <td>{p.quantity}</td>
                <td>{p.lowStockThreshold}</td>
                <td className="px-4 text-right">
                  <button type="button" className="text-emerald-700" onClick={() => setSelected(p)}>
                    Adjust
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={Boolean(selected)} title={`Stock: ${selected?.name || ''}`} onClose={() => setSelected(null)}>
        <form onSubmit={submit} className="space-y-3">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="receive">Receive new stock</option>
            <option value="adjustment">Adjustment (+/-)</option>
          </select>
          <label className="label">Quantity</label>
          <input className="input" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          <label className="label">Reason</label>
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="btn-primary w-full" type="submit">
            Save
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
