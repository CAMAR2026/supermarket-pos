import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Package, ReceiptText, ShoppingBag, Users } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate, money } from '../utils/format';

const Stat = ({ icon: Icon, label, value }) => (
  <div className="card flex items-center gap-4">
    <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
      <Icon size={22} />
    </div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { settings } = useAuth();
  const [data, setData] = useState(null);
  const currency = settings?.currency || 'KSh';

  useEffect(() => {
    api.get('/reports/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-slate-500">Loading dashboard…</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat icon={ShoppingBag} label="Total sales" value={money(data.totalRevenue, currency)} />
        <Stat icon={Package} label="Total products" value={data.totalProducts} />
        <Stat icon={ReceiptText} label="Transactions" value={data.totalTransactions} />
        <Stat icon={Users} label="Registered users" value={data.totalUsers} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold">Daily sales (7 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(v) => money(v, currency)} />
                <Bar dataKey="total" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h2 className="mb-4 font-semibold">Monthly sales</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(v) => money(v, currency)} />
                <Bar dataKey="total" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={18} className="text-amber-500" />
              Low-stock alerts
            </h2>
            <Link to="/inventory" className="text-sm text-emerald-700">
              View inventory
            </Link>
          </div>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-slate-500">All products are above threshold.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.lowStock.map((p) => (
                <li key={p._id} className="flex items-center justify-between py-2 text-sm">
                  <span>{p.name}</span>
                  <span className="font-semibold text-amber-700">{p.quantity} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent transactions</h2>
            <Link to="/sales" className="text-sm text-emerald-700">
              View sales
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {data.recent.map((sale) => (
              <li key={sale._id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{sale.receiptNumber}</p>
                  <p className="text-slate-500">{formatDate(sale.createdAt)}</p>
                </div>
                <span className="font-semibold">{money(sale.total, currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
