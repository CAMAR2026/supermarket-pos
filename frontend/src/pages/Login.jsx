import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/format';

const Login = () => {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@supermarket.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err, 'Unable to sign in.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500">
            <Store />
          </div>
          <span className="text-lg font-semibold">SuperMarket POS</span>
        </div>
        <div>
          <h2 className="max-w-md text-4xl font-semibold leading-tight">
            Sell faster. Track stock. Know your numbers.
          </h2>
          <p className="mt-4 max-w-md text-slate-300">
            A computerized checkout and inventory system for supermarket owners, cashiers and stock
            managers.
          </p>
        </div>
        <p className="text-sm text-slate-500">Kenyan Shillings · Desktop-first checkout</p>
      </div>
      <div className="grid place-items-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Use your staff account to continue.</p>
          {error && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}
          <label className="label mt-6">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="label mt-4">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn-primary mt-6 w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="mt-6 text-xs text-slate-400">
            Demo: admin@supermarket.com / admin123 · cashier@supermarket.com / cashier123 ·
            stock@supermarket.com / stock123
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
