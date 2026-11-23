import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import Receipt from '../components/Receipt';
import { useAuth } from '../context/AuthContext';
import { errorMessage, money } from '../utils/format';

const TransactionDetail = () => {
  const { id } = useParams();
  const { user, settings } = useAuth();
  const [sale, setSale] = useState(null);
  const [error, setError] = useState('');
  const currency = settings?.currency || 'KSh';

  const load = async () => {
    const { data } = await api.get(`/sales/${id}`);
    setSale(data);
  };

  useEffect(() => {
    load();
  }, [id]);

  const refund = async () => {
    const reason = window.prompt('Refund reason?');
    if (!reason) return;
    try {
      await api.put(`/sales/${id}/refund`, { reason });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!sale) return <p>Loading transaction…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-3">
        <h2 className="font-semibold">{sale.receiptNumber}</h2>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <p className="capitalize">Status: {sale.status}</p>
        <p>Payment: {sale.paymentMethod}</p>
        <p>Total: {money(sale.total, currency)}</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={`${item.sku}-${item.name}`}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{money(item.unitPrice, currency)}</td>
                <td>{money(item.total, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-3">
          <button className="btn-primary" type="button" onClick={() => window.print()}>
            Print receipt
          </button>
          {user.role === 'admin' && sale.status === 'completed' && (
            <button className="btn-danger" type="button" onClick={refund}>
              Refund
            </button>
          )}
        </div>
      </div>
      <div className="card">
        <Receipt sale={sale} settings={settings} />
      </div>
    </div>
  );
};

export default TransactionDetail;
