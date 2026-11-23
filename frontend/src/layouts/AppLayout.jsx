import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Warehouse,
  History,
  ReceiptText,
  BarChart3,
  Users,
  UserRound,
  Settings,
  LogOut,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'cashier', 'stock_manager'] },
  { to: '/pos', label: 'POS / Checkout', icon: ShoppingCart, roles: ['admin', 'cashier'] },
  { to: '/products', label: 'Products', icon: Package, roles: ['admin', 'stock_manager'] },
  { to: '/categories', label: 'Categories', icon: Tags, roles: ['admin', 'stock_manager'] },
  { to: '/inventory', label: 'Inventory', icon: Warehouse, roles: ['admin', 'stock_manager'] },
  { to: '/stock-history', label: 'Stock History', icon: History, roles: ['admin', 'stock_manager'] },
  { to: '/sales', label: 'Sales', icon: ReceiptText, roles: ['admin', 'cashier'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/customers', label: 'Customers', icon: UserRound, roles: ['admin', 'cashier'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

const titles = {
  '/': 'Dashboard',
  '/pos': 'Point of Sale',
  '/products': 'Products',
  '/products/new': 'Add Product',
  '/categories': 'Categories',
  '/inventory': 'Inventory',
  '/stock-history': 'Stock History',
  '/sales': 'Sales',
  '/reports': 'Reports',
  '/users': 'Users',
  '/users/new': 'Add User',
  '/customers': 'Customers',
  '/settings': 'Settings',
};

const AppLayout = () => {
  const { user, settings, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title =
    titles[location.pathname] ||
    (location.pathname.startsWith('/products/') ? 'Edit Product' : '') ||
    (location.pathname.startsWith('/sales/') ? 'Transaction' : 'SuperMarket POS');

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="sticky top-0 flex h-screen w-64 flex-col bg-slate-900 text-slate-200">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white">
            <Store size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {settings?.storeName || 'SuperMarket POS'}
            </p>
            <p className="text-xs text-slate-400">Management System</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {links
            .filter((link) => link.roles.includes(user.role))
            .map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'text-slate-300 hover:bg-white/5'
                    }`
                  }
                >
                  <Icon size={18} />
                  {link.label}
                </NavLink>
              );
            })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="mb-3 text-xs capitalize text-slate-400">{user.role.replace('_', ' ')}</p>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur">
          <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {user.role.replace('_', ' ')}
          </span>
        </header>
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
