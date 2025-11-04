import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';
import BaaLogisticaLogo from '../assets/images/baa-logistica-logo.png';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/motoristas', label: 'Motoristas' },
  { to: '/veiculos', label: 'Veículos' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/cargas', label: 'Cargas' },
  { to: '/viagens', label: 'Viagens' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/usuarios', label: 'Usuários' }
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = (user?.perfil || '').toLowerCase() === 'admin';

  const availableNavLinks = useMemo(() => {
    if (isAdmin) {
      return NAV_LINKS;
    }

    return NAV_LINKS.filter((link) => link.to !== '/usuarios');
  }, [isAdmin]);

  const userInitials = useMemo(() => {
    if (!user?.nome) return 'U';
    const [first = '', second = ''] = user.nome.split(' ');
    const initials = `${first.charAt(0)}${second.charAt(0)}`;
    return initials.trim().toUpperCase() || 'U';
  }, [user?.nome]);

  const userAvatar =
    typeof user?.avatar === 'string' && user.avatar.trim() !== '' ? user.avatar : null;

  const avatarLabel = user?.nome
    ? `Foto de perfil de ${user.nome}`
    : 'Foto de perfil do usuário';

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
          <img
            src={BaaLogisticaLogo}
            alt="B.A.A Logística Logo"
            className="app-navbar__brand-logo"
          />
          <span className="app-navbar__brand-text">B.A.A Logística</span>
        </NavLink>

        <nav className="app-navbar__nav" aria-label="Navegação principal">
          {availableNavLinks.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={Boolean(exact)}
              className={({ isActive }) =>
                ['app-navbar__link', isActive ? 'is-active' : '']
                  .filter(Boolean)
                  .join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="app-navbar__profile">
          <div
            className="app-navbar__avatar"
            role={userAvatar ? undefined : 'img'}
            aria-label={userAvatar ? undefined : avatarLabel}
            title={avatarLabel}
          >
            {userAvatar ? (
              <img src={userAvatar} alt={avatarLabel} />
            ) : (
              <span className="app-navbar__avatar-initials" aria-hidden="true">
                {userInitials}
              </span>
            )}
          </div>
          <div className="app-navbar__user">
            <span className="app-navbar__user-name">{user?.nome || 'Usuário'}</span>
            <span className="app-navbar__user-role">{user?.perfil || 'Usuário'}</span>
          </div>
          <div className="app-navbar__actions">
            <button
              type="button"
              className="app-navbar__logout"
              onClick={handleLogout}
            >
              🚪 Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
