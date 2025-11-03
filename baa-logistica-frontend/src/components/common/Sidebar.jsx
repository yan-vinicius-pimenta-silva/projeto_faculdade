import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  MapPin,
  Building2
} from 'lucide-react';
import BaaLogisticaLogo from '../../assets/images/baa-logistica-logo.png';

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
    <aside
      className="bg-gray-800 text-white w-64 flex-shrink-0 min-h-screen relative z-20 shadow-lg"
    >
      <div className="p-5 flex flex-col items-center border-b border-gray-700">
        <img
          src={BaaLogisticaLogo}
          alt="B.A.A Logística Logo"
          className="w-14 h-auto mb-2 rounded-md bg-gray-700 p-1"
        />
        <h1 className="text-xl font-bold text-center leading-tight">
          B.A.A Logística
        </h1>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-150 ${isActive(item.path)
                    ? 'bg-blue-600 text-white shadow'
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
    </aside>
  );
};

export default Sidebar;
