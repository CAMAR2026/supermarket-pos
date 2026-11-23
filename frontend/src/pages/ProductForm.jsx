import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { errorMessage } from '../utils/format';

const empty = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  purchasePrice: '',
  sellingPrice: '',
  quantity: 0,
  unit: 'pcs',
  lowStockThreshold: 10,
};

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const isEdit = Boolean(id);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
    if (id) {
      api.get(`/products/${id}`).then(({ data }) => {
        setForm({
          name: data.name,
          sku: data.sku,
          barcode: data.barcode || '',
          category: data.category?._id || data.category,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          quantity: data.quantity,
          unit: data.unit || 'pcs',
          lowStockThreshold: data.lowStockThreshold,
        });
      });
    }
  }, [id]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (isEdit && key === 'quantity') return;
      payload.append(key, value);
    });
    if (image) payload.append('image', image);

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/products');
    } catch (err) {
      setError(errorMessage(err, 'Could not save product.'));
    }
  };

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-3xl space-y-4">
      <h2 className="text-lg font-semibold">{isEdit ? 'Edit product' : 'Add product'}</h2>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Product name</label>
          <input className="input" name="name" value={form.name} onChange={onChange} required />
        </div>
        <div>
          <label className="label">SKU</label>
          <input className="input" name="sku" value={form.sku} onChange={onChange} required />
        </div>
        <div>
          <label className="label">Barcode</label>
          <input className="input" name="barcode" value={form.barcode} onChange={onChange} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" name="category" value={form.category} onChange={onChange} required>
            <option value="">Select</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Purchase price (KSh)</label>
          <input className="input" type="number" name="purchasePrice" value={form.purchasePrice} onChange={onChange} required />
        </div>
        <div>
          <label className="label">Selling price (KSh)</label>
          <input className="input" type="number" name="sellingPrice" value={form.sellingPrice} onChange={onChange} required />
        </div>
        {!isEdit && (
          <div>
            <label className="label">Opening quantity</label>
            <input className="input" type="number" name="quantity" value={form.quantity} onChange={onChange} />
          </div>
        )}
        <div>
          <label className="label">Low-stock threshold</label>
          <input
            className="input"
            type="number"
            name="lowStockThreshold"
            value={form.lowStockThreshold}
            onChange={onChange}
          />
        </div>
        <div>
          <label className="label">Unit</label>
          <input className="input" name="unit" value={form.unit} onChange={onChange} />
        </div>
        <div>
          <label className="label">Product image</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        </div>
      </div>
      {isEdit && (
        <p className="text-sm text-slate-500">
          Quantity is updated from Inventory so stock history stays accurate.
        </p>
      )}
      <div className="flex gap-3">
        <button className="btn-primary" type="submit">
          Save product
        </button>
        <button className="btn-secondary" type="button" onClick={() => navigate('/products')}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
