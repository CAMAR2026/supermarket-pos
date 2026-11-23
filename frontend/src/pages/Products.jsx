import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { errorMessage, money } from '../utils/format';

const Products = () => {
  const { settings } = useAuth();
  const currency = settings?.currency || 'KSh';
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = async (q = search) => {
    const { data } = await api.get('/products', { params: q ? { search: q } : {} });
    setProducts(data);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            className="input pl-10"
            placeholder="Search by name, SKU or barcode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(e.target.value)}
          />
        </div>
        <Link to="/products/new" className="btn-primary">
          <Plus size={16} /> Add product
        </Link>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Buy</th>
              <th>Sell</th>
              <th>Qty</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td>{p.sku}</td>
                <td>{p.category?.name}</td>
                <td>{money(p.purchasePrice, currency)}</td>
                <td>{money(p.sellingPrice, currency)}</td>
                <td className={p.quantity <= p.lowStockThreshold ? 'font-semibold text-amber-700' : ''}>
                  {p.quantity}
                </td>
                <td className="space-x-3 px-4 text-right">
                  <Link to={`/products/${p._id}`} className="text-emerald-700">
                    Edit
                  </Link>
                  <button type="button" className="text-rose-600" onClick={() => remove(p._id)}>
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

export default Products;
