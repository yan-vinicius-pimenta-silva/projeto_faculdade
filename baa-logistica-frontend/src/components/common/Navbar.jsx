// ============================================
// src/components/common/Navbar.jsx
// ============================================
import { Bell, User } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Sistema de Gestão de Cargas e Frota
        </h2>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} />
          </button>
          <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            <User size={20} />
            <span className="text-sm font-medium">Usuário</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;