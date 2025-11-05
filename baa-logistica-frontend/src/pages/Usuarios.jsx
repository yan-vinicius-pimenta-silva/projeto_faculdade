// ============================================
// src/pages/Usuarios.jsx
// ============================================
import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
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
  const [tableFeedback, setTableFeedback] = useState({ type: '', message: '' });
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    usuario: null
  });
  const [passwordModalData, setPasswordModalData] = useState({
    novaSenha: '',
    confirmarSenha: ''
  });
  const [passwordModalError, setPasswordModalError] = useState('');
  const [passwordModalLoading, setPasswordModalLoading] = useState(false);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    usuario: null,
    targetStatus: true
  });
  const [statusModalError, setStatusModalError] = useState('');
  const [statusModalLoading, setStatusModalLoading] = useState(false);

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
      setTableFeedback({ type: 'error', message });
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

  const openPasswordModal = useCallback((usuario) => {
    setTableFeedback({ type: '', message: '' });
    setPasswordModal({
      isOpen: true,
      usuario
    });
    setPasswordModalData({ novaSenha: '', confirmarSenha: '' });
    setPasswordModalError('');
  }, []);

  const closePasswordModal = useCallback(() => {
    setPasswordModal({ isOpen: false, usuario: null });
    setPasswordModalData({ novaSenha: '', confirmarSenha: '' });
    setPasswordModalError('');
    setPasswordModalLoading(false);
  }, []);

  const handlePasswordModalChange = (event) => {
    const { name, value } = event.target;
    setPasswordModalData((prev) => ({
      ...prev,
      [name]: value
    }));
    setPasswordModalError('');
  };

  const handlePasswordModalSubmit = async (event) => {
    event.preventDefault();

    if (!passwordModal.usuario) {
      setPasswordModalError('Selecione um usuário válido.');
      return;
    }

    if (passwordModalData.novaSenha.length < 6) {
      setPasswordModalError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (passwordModalData.novaSenha !== passwordModalData.confirmarSenha) {
      setPasswordModalError('As senhas informadas não coincidem.');
      return;
    }

    const rawUsuarioId = passwordModal.usuario?.id ?? passwordModal.usuario?.Id;
    const usuarioId = Number(rawUsuarioId);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      setPasswordModalError('Não foi possível identificar o usuário selecionado.');
      return;
    }

    try {
      setPasswordModalLoading(true);
      await usuariosService.updatePassword(usuarioId, passwordModalData.novaSenha);
      await carregarUsuarios();

      const nomeUsuario = passwordModal.usuario?.nome || 'usuário';
      setTableFeedback({
        type: 'success',
        message: `Senha de ${nomeUsuario} atualizada com sucesso.`
      });
      closePasswordModal();
    } catch (error) {
      const message =
        typeof error === 'string'
          ? error
          : error?.response?.data?.message || 'Erro ao atualizar a senha do usuário.';
      setPasswordModalError(message);
    } finally {
      setPasswordModalLoading(false);
    }
  };

  const openStatusModal = useCallback((usuario) => {
    setTableFeedback({ type: '', message: '' });
    setStatusModal({
      isOpen: true,
      usuario,
      targetStatus: !usuario.ativo
    });
    setStatusModalError('');
  }, []);

  const closeStatusModal = useCallback(() => {
    setStatusModal({ isOpen: false, usuario: null, targetStatus: true });
    setStatusModalError('');
    setStatusModalLoading(false);
  }, []);

  const handleConfirmStatusChange = async () => {
    if (!statusModal.usuario) {
      setStatusModalError('Selecione um usuário válido.');
      return;
    }

    const rawUsuarioId = statusModal.usuario?.id ?? statusModal.usuario?.Id;
    const usuarioId = Number(rawUsuarioId);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      setStatusModalError('Não foi possível identificar o usuário selecionado.');
      return;
    }

    try {
      setStatusModalLoading(true);
      await usuariosService.updateStatus(usuarioId, statusModal.targetStatus);
      await carregarUsuarios();

      const nomeUsuario = statusModal.usuario?.nome || 'usuário';
      const actionMessage = statusModal.targetStatus ? 'ativado' : 'desativado';
      setTableFeedback({
        type: 'success',
        message: `Login de ${nomeUsuario} ${actionMessage} com sucesso.`
      });
      closeStatusModal();
    } catch (error) {
      const message =
        typeof error === 'string'
          ? error
          : error?.response?.data?.message || 'Erro ao atualizar status do usuário.';
      setStatusModalError(message);
    } finally {
      setStatusModalLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback({ type: '', message: '' });
      setTableFeedback({ type: '', message: '' });

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

  const columns = useMemo(() => {
    const baseColumns = [
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
        render: (row) => <StatusBadge status={row.ativo ? 'Ativo' : 'Inativo'} />
      }
    ];

    if (isAdmin) {
      baseColumns.push({
        header: 'Ações',
        render: (row) => {
          const isCurrentUser = user?.email && row.email === user.email;

          return (
            <div className="table-actions">
              <Button
                size="sm"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  openPasswordModal(row);
                }}
              >
                Redefinir senha
              </Button>
              <Button
                size="sm"
                variant={row.ativo ? 'danger' : 'success'}
                disabled={isCurrentUser}
                onClick={(event) => {
                  event.stopPropagation();
                  openStatusModal(row);
                }}
              >
                {row.ativo ? 'Desativar login' : 'Ativar login'}
              </Button>
            </div>
          );
        }
      });
    }

    return baseColumns;
  }, [isAdmin, openPasswordModal, openStatusModal, user?.email]);

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
          {tableFeedback.message && (
            <div
              className={`alert ${
                tableFeedback.type === 'success' ? 'alert--success' : 'alert--error'
              }`}
              role="status"
            >
              {tableFeedback.message}
            </div>
          )}

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

      <Modal
        isOpen={passwordModal.isOpen}
        onClose={closePasswordModal}
        title="Redefinir senha do usuário"
        size="sm"
      >
        {passwordModal.usuario && (
          <form onSubmit={handlePasswordModalSubmit} className="form-grid form-grid--two">
            <div className="form-grid__item--span-all">
              <p className="muted-text">
                Defina uma nova senha para <strong>{passwordModal.usuario.nome}</strong>.
              </p>
            </div>

            <Input
              label="Nova senha"
              name="novaSenha"
              type="password"
              value={passwordModalData.novaSenha}
              onChange={handlePasswordModalChange}
              placeholder="Mínimo de 6 caracteres"
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirmar nova senha"
              name="confirmarSenha"
              type="password"
              value={passwordModalData.confirmarSenha}
              onChange={handlePasswordModalChange}
              placeholder="Repita a nova senha"
              required
              autoComplete="new-password"
            />

            {passwordModalError && (
              <div className="form-grid__item--span-all">
                <div className="alert alert--error">⚠️ {passwordModalError}</div>
              </div>
            )}

            <div className="form-grid__item--span-all">
              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={closePasswordModal} disabled={passwordModalLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={passwordModalLoading}>
                  {passwordModalLoading ? 'Salvando...' : 'Salvar nova senha'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={statusModal.isOpen}
        onClose={closeStatusModal}
        title={statusModal.targetStatus ? 'Ativar login do usuário' : 'Desativar login do usuário'}
        size="sm"
      >
        {statusModal.usuario && (
          <div className="form-grid form-grid--two">
            <div className="form-grid__item--span-all">
              <p>
                Confirma que deseja {statusModal.targetStatus ? 'ativar' : 'desativar'} o acesso de
                {' '}
                <strong>{statusModal.usuario.nome}</strong>?
              </p>
            </div>

            {statusModalError && (
              <div className="form-grid__item--span-all">
                <div className="alert alert--error">⚠️ {statusModalError}</div>
              </div>
            )}

            <div className="form-grid__item--span-all">
              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={closeStatusModal} disabled={statusModalLoading}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant={statusModal.targetStatus ? 'success' : 'danger'}
                  onClick={handleConfirmStatusChange}
                  disabled={statusModalLoading}
                >
                  {statusModalLoading
                    ? 'Processando...'
                    : statusModal.targetStatus
                      ? 'Ativar login'
                      : 'Desativar login'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Usuarios;
