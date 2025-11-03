import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import authService from '../services/authService';

const AlterarSenha = () => {
  const [formData, setFormData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (formData.novaSenha.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (formData.novaSenha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.senhaAtual === formData.novaSenha) {
      setError('A nova senha deve ser diferente da atual');
      return;
    }

    setLoading(true);

    try {
      await authService.alterarSenha(formData.senhaAtual, formData.novaSenha);
      setSuccess('Senha alterada com sucesso! Redirecionando...');

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header__title-group">
          <h1 className="page-title">Alterar senha</h1>
          <p className="page-subtitle">Mantenha sua conta protegida com uma credencial segura</p>
        </div>
      </div>

      <Card title="Atualize sua senha" subtitle="Informe a senha atual e escolha uma nova combinação">
        <form onSubmit={handleSubmit} className="form-grid form-grid--two">
          <Input
            label="Senha atual"
            name="senhaAtual"
            type="password"
            value={formData.senhaAtual}
            onChange={handleChange}
            placeholder="Digite sua senha atual"
            required
            autoFocus
          />

          <Input
            label="Nova senha"
            name="novaSenha"
            type="password"
            value={formData.novaSenha}
            onChange={handleChange}
            placeholder="Mínimo de 6 caracteres"
            required
          />

          <Input
            label="Confirmar nova senha"
            name="confirmarSenha"
            type="password"
            value={formData.confirmarSenha}
            onChange={handleChange}
            placeholder="Repita a nova senha"
            required
          />

          {error && <div className="alert alert--error">⚠️ {error}</div>}
          {success && <div className="alert alert--success">✅ {success}</div>}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate('/')} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Alterando...' : 'Alterar senha'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AlterarSenha;