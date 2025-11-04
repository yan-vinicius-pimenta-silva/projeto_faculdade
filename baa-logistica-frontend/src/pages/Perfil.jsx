import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import { usuariosService } from '../services/usuariosService';

const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB

const Perfil = () => {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('photo');
  const isAdmin = user?.perfil === 'Admin';

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.avatar || '');
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);

  const [passwordData, setPasswordData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminForm, setAdminForm] = useState({
    usuarioId: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const fetchAdminUsers = useCallback(async () => {
    setAdminUsersLoading(true);
    setAdminError('');
    try {
      const data = await usuariosService.getAll();
      const filtered = user?.email ? data.filter((item) => item.email !== user.email) : data;
      setAdminUsers(filtered);
    } catch (error) {
      const message =
        typeof error === 'string'
          ? error
          : error?.response?.data?.message || 'Erro ao carregar usuários.';
      setAdminError(message);
    } finally {
      setAdminUsersLoading(false);
    }
  }, [user?.email]);

  const userInitials = useMemo(() => {
    if (!user?.nome) return 'U';
    const [first = '', second = ''] = user.nome.split(' ');
    return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
  }, [user?.nome]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(user?.avatar || '');
    }
  }, [user?.avatar, photoFile]);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  useEffect(() => {
    if (
      activeTab === 'admin-password' &&
      isAdmin &&
      adminUsers.length === 0 &&
      !adminUsersLoading &&
      !adminError
    ) {
      fetchAdminUsers();
    }
  }, [activeTab, isAdmin, adminUsers.length, adminUsersLoading, adminError, fetchAdminUsers]);

  const convertFileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Erro ao carregar a imagem.'));
      reader.readAsDataURL(file);
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPhotoError('');
    setPhotoSuccess('');
    setPasswordError('');
    setPasswordSuccess('');
    setAdminError('');
    setAdminSuccess('');
    setAdminForm({ usuarioId: '', novaSenha: '', confirmarSenha: '' });
  };

  const handleAdminFormChange = (event) => {
    const { name, value } = event.target;
    setAdminForm((prev) => ({
      ...prev,
      [name]: value
    }));
    setAdminError('');
    setAdminSuccess('');
  };

  const handleAdminSubmit = async (event) => {
    event.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    if (!adminForm.usuarioId) {
      setAdminError('Selecione um usuário para atualizar a senha.');
      return;
    }

    if (adminForm.novaSenha.length < 6) {
      setAdminError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (adminForm.novaSenha !== adminForm.confirmarSenha) {
      setAdminError('As senhas informadas não coincidem.');
      return;
    }

    setAdminLoading(true);
    try {
      await usuariosService.updatePassword(adminForm.usuarioId, adminForm.novaSenha);
      setAdminSuccess('Senha do usuário atualizada com sucesso!');
      setAdminForm({ usuarioId: '', novaSenha: '', confirmarSenha: '' });
      await fetchAdminUsers();
    } catch (error) {
      const message =
        typeof error === 'string'
          ? error
          : error?.response?.data?.message || 'Erro ao atualizar a senha do usuário.';
      setAdminError(message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    setPhotoError('');
    setPhotoSuccess('');

    if (!file) {
      setPhotoFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('Selecione um arquivo de imagem válido.');
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError('A imagem deve ter no máximo 2 MB.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview((previous) => {
      if (previous && previous.startsWith('blob:')) {
        URL.revokeObjectURL(previous);
      }
      return URL.createObjectURL(file);
    });
  };

  const handlePhotoSubmit = async (event) => {
    event.preventDefault();
    setPhotoError('');
    setPhotoSuccess('');

    if (!photoFile) {
      setPhotoError('Selecione uma imagem para atualizar.');
      return;
    }

    setPhotoLoading(true);
    try {
      const dataUrl = await convertFileToDataUrl(photoFile);
      const response = await authService.atualizarAvatar(dataUrl);
      const updatedAvatar = response?.avatar ?? dataUrl;
      updateUserProfile({ avatar: updatedAvatar });
      setPhotoPreview(updatedAvatar);
      setPhotoFile(null);
      setPhotoSuccess('Foto de perfil atualizada com sucesso!');
    } catch (error) {
      const message = typeof error === 'string' ? error : error?.message;
      setPhotoError(message || 'Não foi possível atualizar a foto de perfil.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handlePhotoReset = () => {
    setPhotoFile(null);
    setPhotoError('');
    setPhotoSuccess('');
    setPhotoPreview(user?.avatar || '');
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value
    }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.novaSenha.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (passwordData.novaSenha !== passwordData.confirmarSenha) {
      setPasswordError('As senhas não coincidem.');
      return;
    }

    if (passwordData.senhaAtual === passwordData.novaSenha) {
      setPasswordError('A nova senha deve ser diferente da atual.');
      return;
    }

    setPasswordLoading(true);

    try {
      await authService.alterarSenha(passwordData.senhaAtual, passwordData.novaSenha);
      setPasswordSuccess('Senha alterada com sucesso!');
      setPasswordData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
    } catch (error) {
      setPasswordError(error || 'Erro ao alterar senha.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header__title-group">
          <h1 className="page-title">Perfil</h1>
          <p className="page-subtitle">Gerencie suas preferências pessoais e mantenha sua conta segura</p>
        </div>
      </div>

      <div className="profile-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={`profile-tab ${activeTab === 'photo' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('photo')}
          aria-selected={activeTab === 'photo'}
        >
          🖼️ Foto de perfil
        </button>
        <button
          type="button"
          role="tab"
          className={`profile-tab ${activeTab === 'password' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('password')}
          aria-selected={activeTab === 'password'}
        >
          🔐 Segurança
        </button>
        {isAdmin && (
          <button
            type="button"
            role="tab"
            className={`profile-tab ${activeTab === 'admin-password' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('admin-password')}
            aria-selected={activeTab === 'admin-password'}
          >
            👥 Administração
          </button>
        )}
      </div>

      {activeTab === 'photo' && (
        <Card
          title="Atualize sua foto"
          subtitle="Escolha uma imagem nítida para que os demais usuários identifiquem você com facilidade"
        >
          <form onSubmit={handlePhotoSubmit} className="profile-photo-form">
            <div className="profile-photo-form__preview" aria-hidden={!photoPreview && !user?.avatar}>
              {photoPreview || user?.avatar ? (
                <img src={photoPreview || user?.avatar} alt="Pré-visualização da foto de perfil" />
              ) : (
                <span className="profile-photo-form__initials">{userInitials}</span>
              )}
            </div>

            <div className="profile-photo-form__controls">
              <Input
                label="Selecione uma nova foto"
                name="avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handlePhotoChange}
              />
              <p className="form-field__note">
                Formatos suportados: PNG, JPG, GIF ou WEBP. Tamanho máximo de 2 MB.
              </p>
            </div>

            {photoError && <div className="alert alert--error">⚠️ {photoError}</div>}
            {photoSuccess && <div className="alert alert--success">✅ {photoSuccess}</div>}

            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={handlePhotoReset} disabled={photoLoading}>
                Descartar alterações
              </Button>
              <Button type="submit" disabled={photoLoading}>
                {photoLoading ? 'Salvando...' : 'Salvar foto'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'password' && (
        <Card
          title="Altere sua senha"
          subtitle="Use uma combinação única e difícil para proteger o acesso à sua conta"
        >
          <form onSubmit={handlePasswordSubmit} className="form-grid form-grid--two">
            <Input
              label="Senha atual"
              name="senhaAtual"
              type="password"
              value={passwordData.senhaAtual}
              onChange={handlePasswordChange}
              placeholder="Informe sua senha atual"
              required
            />

            <Input
              label="Nova senha"
              name="novaSenha"
              type="password"
              value={passwordData.novaSenha}
              onChange={handlePasswordChange}
              placeholder="Mínimo de 6 caracteres"
              required
            />

            <Input
              label="Confirmar nova senha"
              name="confirmarSenha"
              type="password"
              value={passwordData.confirmarSenha}
              onChange={handlePasswordChange}
              placeholder="Repita a nova senha"
              required
            />

            {passwordError && <div className="alert alert--error">⚠️ {passwordError}</div>}
            {passwordSuccess && <div className="alert alert--success">✅ {passwordSuccess}</div>}

            <div className="form-actions">
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? 'Alterando...' : 'Atualizar senha'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'admin-password' && isAdmin && (
        <Card
          title="Redefina senhas de usuários"
          subtitle="Permita que colegas recuperem o acesso de forma segura sem conhecer a senha anterior"
        >
          {adminError && <div className="alert alert--error">⚠️ {adminError}</div>}
          {adminSuccess && <div className="alert alert--success">✅ {adminSuccess}</div>}

          {adminUsersLoading ? (
            <p>Carregando usuários disponíveis...</p>
          ) : adminUsers.length === 0 ? (
            <div className="empty-state">
              <p>Não encontramos outros usuários para atualizar a senha.</p>
              <Button
                type="button"
                variant="secondary"
                onClick={fetchAdminUsers}
                disabled={adminUsersLoading || adminLoading}
              >
                Recarregar lista
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAdminSubmit} className="form-grid form-grid--two">
              <Select
                label="Usuário"
                name="usuarioId"
                value={adminForm.usuarioId}
                onChange={handleAdminFormChange}
                options={adminUsers.map((usuario) => ({
                  value: usuario.id,
                  label: `${usuario.nome} (${usuario.email})`
                }))}
                required
              />

              <Input
                label="Nova senha do usuário"
                name="novaSenha"
                type="password"
                value={adminForm.novaSenha}
                onChange={handleAdminFormChange}
                placeholder="Mínimo de 6 caracteres"
                required
              />

              <Input
                label="Confirmar nova senha"
                name="confirmarSenha"
                type="password"
                value={adminForm.confirmarSenha}
                onChange={handleAdminFormChange}
                placeholder="Repita a nova senha"
                required
              />

              <div className="form-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={fetchAdminUsers}
                  disabled={adminLoading || adminUsersLoading}
                >
                  Recarregar lista
                </Button>
                <Button type="submit" disabled={adminLoading}>
                  {adminLoading ? 'Atualizando...' : 'Atualizar senha do usuário'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
};

export default Perfil;
