import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';
import BaaLogisticaLoginBackground from '../assets/images/baa-logistica-login-background.jpg';
import BaaLogisticaLogo from '../assets/images/baa-logistica-logo.png';

const Login = () => {
  const [formData, setFormData] = useState({ login: '', senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.login, formData.senha);
      navigate('/');
    } catch (err) {
      setError(err || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `url(${BaaLogisticaLoginBackground})`,
      }}
    >
      <div className="login-box">
        <div className="login-header">
          <div className="logo-title">
            <img
              src={BaaLogisticaLogo}
              alt="B.A.A Logística Logo"
              className="login-logo"
            />
            <h1>B.A.A Logística</h1>
          </div>
          <p>Sistema de Gestão de Cargas e Frota</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login">Login</label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              placeholder="Digite seu login"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              placeholder="Digite sua senha"
              required
            />
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <p><strong>Credenciais padrão:</strong></p>
          <p>Login: <code>admin</code> | Senha: <code>admin123</code></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
