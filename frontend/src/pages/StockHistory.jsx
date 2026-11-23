import { useEffect, useState } from 'react';
import api from '../api/client';
import { formatDate } from '../utils/format';

const StockHistory = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/inventory/history').then((res) => setRows(res.data));
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th>Product</th>
            <th>Type</th>
            <th>Change</th>
            <th>From → To</th>
            <th>User</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id} className="border-t border-slate-100">
              <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
              <td>{row.product?.name}</td>
              <td className="capitalize">{row.type}</td>
              <td className={row.quantityChange < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                {row.quantityChange > 0 ? `+${row.quantityChange}` : row.quantityChange}
              </td>
              <td>
                {row.previousQuantity} → {row.newQuantity}
              </td>
              <td>{row.user?.name}</td>
              <td>{row.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockHistory;
