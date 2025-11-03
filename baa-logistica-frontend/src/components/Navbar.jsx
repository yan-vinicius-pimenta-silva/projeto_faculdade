import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/motoristas', label: 'Motoristas' },
  { to: '/veiculos', label: 'Veículos' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/cargas', label: 'Cargas' },
  { to: '/viagens', label: 'Viagens' },
  { to: '/usuarios', label: 'Usuários' }
];

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
    <header className="app-navbar">
      <div className="app-navbar__inner">
        <NavLink to="/" className="app-navbar__brand">
          <span className="app-navbar__brand-icon">🚛</span>
          <span className="app-navbar__brand-text">B.A.A Logística</span>
        </NavLink>

        <nav className="app-navbar__nav" aria-label="Navegação principal">
          {NAV_LINKS.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={Boolean(exact)}
              className={({ isActive }) =>
                ['app-navbar__link', isActive ? 'is-active' : ''].filter(Boolean).join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="app-navbar__profile">
          <div className="app-navbar__user">
            <span className="app-navbar__user-name">{user?.nome || 'Usuário'}</span>
            <span className="app-navbar__user-role">{user?.perfil || 'Usuário'}</span>
          </div>
          <div className="app-navbar__actions">
            <NavLink to="/alterar-senha" className="app-navbar__action">
              🔑 Alterar Senha
            </NavLink>
            <button type="button" className="app-navbar__logout" onClick={handleLogout}>
              🚪 Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
