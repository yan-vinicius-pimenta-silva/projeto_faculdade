import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair do sistema?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          🚛 B.A.A Logística
        </Link>

        <ul className="navbar-menu">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/motoristas">Motoristas</Link></li>
          <li><Link to="/veiculos">Veículos</Link></li>
          <li><Link to="/clientes">Clientes</Link></li>
          <li><Link to="/cargas">Cargas</Link></li>
          <li><Link to="/viagens">Viagens</Link></li>
        </ul>

        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">👤 {user?.nome || 'Usuário'}</span>
            <span className="user-perfil">{user?.perfil || 'Usuario'}</span>
          </div>
          <div className="user-actions">
            <Link to="/alterar-senha" className="btn-change-password">
              🔑 Alterar Senha
            </Link>
            <button onClick={handleLogout} className="btn-logout">
              🚪 Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;