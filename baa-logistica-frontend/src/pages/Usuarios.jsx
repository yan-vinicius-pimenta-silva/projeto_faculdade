// ============================================
// src/pages/Usuarios.jsx
// ============================================
import { useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { usuariosService } from '../services/usuariosService';
import { useAuth } from '../contexts/AuthContext';

const PERFIL_OPTIONS = [
  { value: 'Admin', label: 'Administrador' },
  { value: 'Usuario', label: 'Usuário padrão' }
];

const formatDateTime = (value) => {
  if (!value) {
    return '—';
  }

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

const Usuarios = () => {
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'Admin';

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    login: '',
    senha: '',
    cargo: '',
    perfil: 'Usuario'
  });

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuariosService.getAll();
      setUsuarios(data);
    } catch (error) {
      console.error('Erro ao carregar usuários', error);
      const message = error.response?.data?.message || 'Erro ao carregar usuários';
      setFeedback({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      login: '',
      senha: '',
      cargo: '',
      perfil: 'Usuario'
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback({ type: '', message: '' });

      const payload = {
        nome: formData.nome,
        email: formData.email,
        login: formData.login,
        senha: formData.senha,
        cargo: formData.cargo || null,
        perfil: formData.perfil
      };

      await usuariosService.create(payload);

      setFeedback({ type: 'success', message: 'Usuário criado com sucesso.' });
      resetForm();
      await carregarUsuarios();
    } catch (error) {
      console.error('Erro ao criar usuário', error);

      let message = 'Erro ao criar usuário';
      if (typeof error === 'string') {
        message = error;
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        message = Object.values(errors).flat().join(' ');
      }

      setFeedback({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo(() => [
    { header: 'Nome', accessor: 'nome' },
    { header: 'E-mail', accessor: 'email' },
    { header: 'Login', accessor: 'login' },
    {
      header: 'Perfil',
      render: (row) => (row.perfil === 'Admin' ? 'Administrador' : 'Usuário padrão')
    },
    { header: 'Cargo', accessor: 'cargo' },
    {
      header: 'Criado em',
      render: (row) => formatDateTime(row.dataCriacao)
    },
    {
      header: 'Último acesso',
      render: (row) => formatDateTime(row.dataUltimoAcesso)
    },
    {
      header: 'Status',
      render: (row) => (row.ativo ? 'Ativo' : 'Inativo')
    }
  ], []);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header__title-group">
          <h1 className="page-title">Gestão de Usuários</h1>
          <p className="page-subtitle">
            Cadastre novos acessos administrativos e acompanhe quem está ativo no sistema
          </p>
        </div>
      </div>

      <div className="page-content-stack">
        <Card title="Usuários cadastrados">
          {loading ? (
            <p>Carregando usuários...</p>
          ) : (
            <Table columns={columns} data={usuarios} />
          )}
        </Card>

        <Card title="Cadastrar novo usuário" subtitle="Disponível apenas para administradores">
          {feedback.message && (
            <div
              className={`alert ${
                feedback.type === 'success' ? 'alert--success' : 'alert--error'
              }`}
              role="status"
            >
              {feedback.message}
            </div>
          )}

          {isAdmin ? (
            <form onSubmit={handleSubmit} className="form-grid form-grid--two">
              <Input
                label="Nome completo"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
              />
              <Input
                label="E-mail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Login"
                name="login"
                value={formData.login}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Senha provisória"
                name="senha"
                type="password"
                value={formData.senha}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
              />
              <Input
                label="Cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleInputChange}
                placeholder="Opcional"
              />
              <Select
                label="Perfil de acesso"
                name="perfil"
                value={formData.perfil}
                onChange={handleInputChange}
                options={PERFIL_OPTIONS}
                required
              />
              <div className="form-grid__item--span-all" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar usuário'}
                </Button>
              </div>
            </form>
          ) : (
            <p className="muted-text">
              Apenas administradores podem cadastrar novos usuários.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Usuarios;
