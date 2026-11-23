import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import StockHistory from './pages/StockHistory';
import Sales from './pages/Sales';
import TransactionDetail from './pages/TransactionDetail';
import Reports from './pages/Reports';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import Customers from './pages/Customers';
import Settings from './pages/Settings';

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route element={<ProtectedRoute roles={['admin', 'cashier']} />}>
          <Route path="pos" element={<POS />} />
          <Route path="sales" element={<Sales />} />
          <Route path="sales/:id" element={<TransactionDetail />} />
          <Route path="customers" element={<Customers />} />
        </Route>
        <Route element={<ProtectedRoute roles={['admin', 'stock_manager']} />}>
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="stock-history" element={<StockHistory />} />
        </Route>
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="users/new" element={<UserForm />} />
          <Route path="users/:id" element={<UserForm />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
