import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate, money } from '../utils/format';

const Sales = () => {
  const { settings } = useAuth();
  const currency = settings?.currency || 'KSh';
  const [sales, setSales] = useState([]);
  const [receipt, setReceipt] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    const { data } = await api.get('/sales', { params: { receipt, from, to } });
    setSales(data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="card grid gap-3 md:grid-cols-4">
        <input
          className="input"
          placeholder="Receipt number"
          value={receipt}
          onChange={(e) => setReceipt(e.target.value)}
        />
        <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="btn-primary" type="button" onClick={load}>
          Filter
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Receipt</th>
              <th>Date</th>
              <th>Cashier</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale._id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{sale.receiptNumber}</td>
                <td>{formatDate(sale.createdAt)}</td>
                <td>{sale.cashier?.name}</td>
                <td className="capitalize">{sale.paymentMethod}</td>
                <td className="capitalize">{sale.status}</td>
                <td>{money(sale.total, currency)}</td>
                <td className="px-4 text-right">
                  <Link className="text-emerald-700" to={`/sales/${sale._id}`}>
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
