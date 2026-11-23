import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate, money } from '../utils/format';

const downloadCsv = (filename, rows) => {
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const Reports = () => {
  const { settings } = useAuth();
  const currency = settings?.currency || 'KSh';
  const [period, setPeriod] = useState('daily');
  const [report, setReport] = useState(null);

  const load = async (nextPeriod = period) => {
    const { data } = await api.get('/reports/sales', { params: { period: nextPeriod } });
    setReport(data);
  };

  useEffect(() => {
    load('daily');
  }, []);

  const exportCsv = () => {
    if (!report) return;
    downloadCsv(`sales-${period}.csv`, [
      ['Receipt', 'Date', 'Cashier', 'Payment', 'Total'],
      ...report.sales.map((s) => [
        s.receiptNumber,
        formatDate(s.createdAt),
        s.cashier?.name,
        s.paymentMethod,
        s.total,
      ]),
    ]);
  };

  if (!report) return <p>Loading reports…</p>;

  return (
    <div id="print-area" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPeriod(p);
                load(p);
              }}
              className={`rounded-full px-4 py-2 text-sm capitalize ${
                period === p ? 'bg-emerald-600 text-white' : 'bg-white ring-1 ring-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" type="button" onClick={exportCsv}>
            Export CSV
          </button>
          <button className="btn-primary" type="button" onClick={() => window.print()}>
            Print / PDF
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">Revenue</p>
          <p className="text-2xl font-semibold">{money(report.totalRevenue, currency)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Transactions</p>
          <p className="text-2xl font-semibold">{report.transactionCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Tax collected</p>
          <p className="text-2xl font-semibold">{money(report.totalTax, currency)}</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Best-selling products</h2>
          <ul className="space-y-2 text-sm">
            {report.bestSellers.slice(0, 8).map((p) => (
              <li key={p.name} className="flex justify-between">
                <span>
                  {p.name} · {p.quantity} sold
                </span>
                <span>{money(p.revenue, currency)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="mb-3 font-semibold">Cashier performance</h2>
          <ul className="space-y-2 text-sm">
            {report.cashierPerformance.map((c) => (
              <li key={c.name} className="flex justify-between">
                <span>
                  {c.name} · {c.transactions} sales
                </span>
                <span>{money(c.revenue, currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Reports;
