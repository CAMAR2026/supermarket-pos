import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/format';

const Settings = () => {
  const { refreshSettings } = useAuth();
  const [form, setForm] = useState({
    storeName: '',
    address: '',
    phone: '',
    currency: 'KSh',
    taxRate: 0,
    receiptFooter: '',
    lowStockThreshold: 10,
  });
  const [logo, setLogo] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setForm({
        storeName: data.storeName || '',
        address: data.address || '',
        phone: data.phone || '',
        currency: data.currency || 'KSh',
        taxRate: data.taxRate || 0,
        receiptFooter: data.receiptFooter || '',
        lowStockThreshold: data.lowStockThreshold || 10,
      });
    });
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const payload = new FormData();
    Object.entries(form).forEach(([k, v]) => payload.append(k, v));
    if (logo) payload.append('logo', logo);
    try {
      await api.put('/settings', payload);
      await refreshSettings();
      setMessage('Settings saved.');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-2xl space-y-4">
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <label className="label">Supermarket name</label>
      <input className="input" name="storeName" value={form.storeName} onChange={onChange} />
      <label className="label">Business address</label>
      <input className="input" name="address" value={form.address} onChange={onChange} />
      <label className="label">Phone</label>
      <input className="input" name="phone" value={form.phone} onChange={onChange} />
      <label className="label">Currency</label>
      <input className="input" name="currency" value={form.currency} onChange={onChange} />
      <label className="label">Tax rate (%)</label>
      <input className="input" type="number" name="taxRate" value={form.taxRate} onChange={onChange} />
      <label className="label">Low-stock notification threshold</label>
      <input
        className="input"
        type="number"
        name="lowStockThreshold"
        value={form.lowStockThreshold}
        onChange={onChange}
      />
      <label className="label">Receipt footer</label>
      <textarea className="input" name="receiptFooter" value={form.receiptFooter} onChange={onChange} />
      <label className="label">Business logo</label>
      <input className="input" type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])} />
      <button className="btn-primary" type="submit">
        Save settings
      </button>
    </form>
  );
};

export default Settings;
