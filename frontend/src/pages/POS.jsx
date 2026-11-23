import { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, Search, Trash2 } from 'lucide-react';
import api from '../api/client';
import Modal from '../components/Modal';
import Receipt from '../components/Receipt';
import { useAuth } from '../context/AuthContext';
import { errorMessage, money } from '../utils/format';

const POS = () => {
  const { settings } = useAuth();
  const currency = settings?.currency || 'KSh';
  const searchRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [mpesaReference, setMpesaReference] = useState('');
  const [customer, setCustomer] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sale, setSale] = useState(null);

  const load = async () => {
    const [{ data: productData }, { data: customerData }] = await Promise.all([
      api.get('/products'),
      api.get('/customers'),
    ]);
    setProducts(productData);
    setCustomers(customerData);
  };

  useEffect(() => {
    load();
    searchRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.filter((p) => p.isActive !== false);
    return products.filter((p) => {
      const hay = `${p.name} ${p.sku} ${p.barcode || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, query]);

  const addToCart = (product) => {
    setError('');
    if (product.quantity < 1) {
      setError(`${product.name} is out of stock.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product === product._id);
      if (existing) {
        if (existing.quantity + 1 > product.quantity) {
          setError(`Only ${product.quantity} of ${product.name} available.`);
          return prev;
        }
        return prev.map((item) =>
          item.product === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product: product._id,
          name: product.name,
          sellingPrice: product.sellingPrice,
          stock: product.quantity,
          quantity: 1,
        },
      ];
    });
    setQuery('');
    searchRef.current?.focus();
  };

  const onSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const exact = products.find(
        (p) => p.barcode && p.barcode === query.trim()
      ) || filtered[0];
      if (exact) addToCart(exact);
    }
  };

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product !== id) return item;
          const next = item.quantity + delta;
          if (next > item.stock) return item;
          return { ...item, quantity: next };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const taxRate = settings?.taxRate || 0;
  const tax = Number((((subtotal - discountValue) * taxRate) / 100).toFixed(2));
  const total = Number((subtotal - discountValue + tax).toFixed(2));
  const paid = Number(amountPaid);
  const change = Number.isFinite(paid) ? Math.max(paid - total, 0) : 0;

  const checkout = async () => {
    setError('');
    if (cart.length === 0) return setError('Cart is empty.');
    if (!Number.isFinite(paid) || paid < total) {
      return setError('Amount paid must cover the total.');
    }
    setBusy(true);
    try {
      const { data } = await api.post('/sales', {
        items: cart.map((item) => ({ product: item.product, quantity: item.quantity })),
        discount: discountValue,
        paymentMethod,
        amountPaid: paid,
        mpesaReference,
        customer: customer || null,
      });
      setSale(data);
      setCart([]);
      setDiscount(0);
      setAmountPaid('');
      setMpesaReference('');
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Checkout failed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <section className="card min-h-[70vh]">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            ref={searchRef}
            className="input pl-10"
            placeholder="Search name, SKU or scan barcode…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
          />
        </div>
        <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto lg:grid-cols-3">
          {filtered.map((product) => (
            <button
              key={product._id}
              type="button"
              onClick={() => addToCart(product)}
              className="rounded-xl border border-slate-200 p-3 text-left hover:border-emerald-400 hover:bg-emerald-50"
            >
              {product.image ? (
                <img src={product.image} alt="" className="mb-2 h-16 w-full rounded-lg object-cover" />
              ) : null}
              <p className="font-medium">{product.name}</p>
              <p className="text-xs text-slate-500">{product.sku}</p>
              <p className="mt-2 font-semibold text-emerald-700">
                {money(product.sellingPrice, currency)}
              </p>
              <p className={`text-xs ${product.quantity < 1 ? 'text-rose-600' : 'text-slate-500'}`}>
                {product.quantity} in stock
              </p>
            </button>
          ))}
        </div>
      </section>

      <aside className="card">
        <h2 className="mb-4 font-semibold">Cart</h2>
        {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="space-y-3">
          {cart.length === 0 && <p className="text-sm text-slate-500">Scan or select products.</p>}
          {cart.map((item) => (
            <div key={item.product} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-slate-500">{money(item.sellingPrice, currency)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="btn-secondary px-2 py-1" onClick={() => changeQty(item.product, -1)}>
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <button type="button" className="btn-secondary px-2 py-1" onClick={() => changeQty(item.product, 1)}>
                  <Plus size={14} />
                </button>
              </div>
              <button type="button" className="text-rose-500" onClick={() => changeQty(item.product, -item.quantity)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{money(subtotal, currency)}</span>
          </div>
          <label className="label">Discount ({currency})</label>
          <input className="input" type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          <div className="flex justify-between">
            <span>Tax ({taxRate}%)</span>
            <span>{money(tax, currency)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{money(total, currency)}</span>
          </div>
          <label className="label">Customer</label>
          <select className="input" value={customer} onChange={(e) => setCustomer(e.target.value)}>
            <option value="">Walk-in</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} · {c.phone}
              </option>
            ))}
          </select>
          <label className="label">Payment</label>
          <div className="grid grid-cols-2 gap-2">
            {['cash', 'mpesa'].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`rounded-lg border px-3 py-2 capitalize ${
                  paymentMethod === method ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'
                }`}
              >
                {method === 'mpesa' ? 'M-Pesa' : 'Cash'}
              </button>
            ))}
          </div>
          {paymentMethod === 'mpesa' && (
            <>
              <label className="label">M-Pesa reference</label>
              <input
                className="input"
                value={mpesaReference}
                onChange={(e) => setMpesaReference(e.target.value)}
              />
            </>
          )}
          <label className="label">Amount paid</label>
          <input
            className="input"
            type="number"
            min="0"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
          />
          <div className="flex justify-between font-medium">
            <span>Change</span>
            <span>{money(change, currency)}</span>
          </div>
          <button className="btn-primary mt-2 w-full py-3" onClick={checkout} disabled={busy}>
            {busy ? 'Processing…' : 'Complete sale'}
          </button>
        </div>
      </aside>

      <Modal
        open={Boolean(sale)}
        title="Receipt"
        onClose={() => setSale(null)}
      >
        <Receipt sale={sale} settings={settings} />
        <button className="btn-primary mt-4 w-full" onClick={() => window.print()}>
          Print receipt
        </button>
      </Modal>
    </div>
  );
};

export default POS;
