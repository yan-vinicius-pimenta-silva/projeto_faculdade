// ============================================
// src/components/common/Sidebar.jsx
// ============================================
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  MapPin,
  Building2
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/motoristas', icon: Users, label: 'Motoristas' },
    { path: '/veiculos', icon: Truck, label: 'Veículos' },
    { path: '/cargas', icon: Package, label: 'Cargas' },
    { path: '/viagens', icon: MapPin, label: 'Viagens' },
    { path: '/clientes', icon: Building2, label: 'Clientes' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bg-gray-800 text-white w-64 flex-shrink-0">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-center mb-8">B.A.A Logística</h1>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive(item.path)
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;