// ============================================
// src/pages/Motoristas.jsx
// ============================================
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { motoristasService } from '../services/motoristasService';
import { format } from 'date-fns';
import {
  sanitizeNomeCompleto,
  sanitizeEndereco,
  sanitizeObservacoes,
  sanitizeEmail,
  maskCPF,
  maskCNH,
  maskTelefone,
  formatTelefoneToE164,
  sanitizeCPF,
  sanitizeCNH,
  sanitizeTelefone,
  sanitizeDateInput
} from '../utils/sanitization';
import {
  isValidTelefone
} from '../utils/validators';

// ============================================
// FUNÇÕES UTILITÁRIAS DE FORMATAÇÃO E VALIDAÇÃO
// ============================================

const limparCPF = (value) => sanitizeCPF(value);
const formatarCPF = (value) => maskCPF(value);
const validarCPF = () => ({ valido: true, mensagem: '' });

const limparCNH = (value) => sanitizeCNH(value);
const formatarCNH = (value) => maskCNH(value);
const validarCNH = () => ({ valido: true, mensagem: '' });

const limparTelefone = (value) => sanitizeTelefone(value);
const formatarTelefone = (value) => maskTelefone(value);
const converterParaE164 = (value) => formatTelefoneToE164(value);
const validarTelefone = (telefone) => {
  const valido = isValidTelefone(telefone);
  return {
    valido,
    mensagem: valido ? '' : 'Telefone deve ter DDD válido e 10 ou 11 dígitos'
  };
};

const limparEmail = (email) => sanitizeEmail(email);

// ============================================
// FUNÇÕES UTILITÁRIAS DE E-MAIL
// ============================================

/**
 * Valida e-mail seguindo RFC 5321 / RFC 5322
 */
const validarEmail = (email) => {
  if (!email || email.trim() === '') {
    return { valido: true, mensagem: '' }; // E-mail é opcional
  }

  // Verifica comprimento total (máximo 320 caracteres)
  if (email.length > 320) {
    return { valido: false, mensagem: 'E-mail muito longo (máximo 320 caracteres)' };
  }

  // Separa parte local e domínio
  const partes = email.split('@');
  if (partes.length !== 2) {
    return { valido: false, mensagem: 'E-mail deve conter exatamente um @' };
  }

  const [parteLocal, dominio] = partes;

  // Valida parte local (antes do @) - máximo 64 caracteres
  if (parteLocal.length === 0 || parteLocal.length > 64) {
    return { valido: false, mensagem: 'Parte local do e-mail inválida (máximo 64 caracteres)' };
  }

  // Valida domínio (depois do @) - máximo 255 caracteres
  if (dominio.length === 0 || dominio.length > 255) {
    return { valido: false, mensagem: 'Domínio do e-mail inválido (máximo 255 caracteres)' };
  }

  // Regex para validação de e-mail (padrão RFC)
  const regexEmail = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

  if (!regexEmail.test(email)) {
    return { valido: false, mensagem: 'Formato de e-mail inválido' };
  }

  // Verifica se o domínio tem pelo menos um ponto
  if (!dominio.includes('.')) {
    return { valido: false, mensagem: 'Domínio deve conter pelo menos um ponto' };
  }

  // Verifica se o domínio não começa ou termina com ponto ou hífen
  if (dominio.startsWith('.') || dominio.endsWith('.') || dominio.startsWith('-') || dominio.endsWith('-')) {
    return { valido: false, mensagem: 'Domínio inválido' };
  }

  return { valido: true, mensagem: '' };
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const Motoristas = () => {
  const todayISO = format(new Date(), 'yyyy-MM-dd');
  const [motoristas, setMotoristas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMotorista, setEditingMotorista] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Estado para erros de validação
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cnh: '',
    categoriaCNH: '',
    validadeCNH: '',
    telefone: '',
    email: '',
    endereco: '',
    dataNascimento: '',
    dataAdmissao: todayISO,
    status: 'Ativo',
    observacoes: '',
  });

  useEffect(() => {
    loadMotoristas();
  }, [statusFilter]);

  const loadMotoristas = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const data = await motoristasService.getAll(params);
      setMotoristas(data);
    } catch (error) {
      console.error('Erro ao carregar motoristas:', error);
      alert('Erro ao carregar motoristas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (motorista = null) => {
    if (motorista) {
      setEditingMotorista(motorista);
      setFormData({
        nome: sanitizeNomeCompleto(motorista.nome || ''),
        cpf: maskCPF(motorista.cpf || ''),
        cnh: maskCNH(motorista.cnh || ''),
        categoriaCNH: motorista.categoriaCNH || '',
        validadeCNH: motorista.validadeCNH ? format(new Date(motorista.validadeCNH), 'yyyy-MM-dd') : '',
        telefone: motorista.telefone ? maskTelefone(motorista.telefone) : '',
        email: sanitizeEmail(motorista.email || ''),
        endereco: sanitizeEndereco(motorista.endereco || ''),
        dataNascimento: motorista.dataNascimento ? format(new Date(motorista.dataNascimento), 'yyyy-MM-dd') : '',
        dataAdmissao: motorista.dataAdmissao ? format(new Date(motorista.dataAdmissao), 'yyyy-MM-dd') : '',
        status: motorista.status || 'Ativo',
        observacoes: sanitizeObservacoes(motorista.observacoes || ''),
      });
    } else {
      setEditingMotorista(null);
      setFormData({
        nome: '',
        cpf: '',
        cnh: '',
        categoriaCNH: '',
        validadeCNH: '',
        telefone: '',
        email: '',
        endereco: '',
        dataNascimento: '',
        dataAdmissao: todayISO,
        status: 'Ativo',
        observacoes: '',
      });
    }
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMotorista(null);
    setValidationErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Aplica formatação automática e limites
    if (name === 'cpf') {
      const cpfFormatado = formatarCPF(value);
      setFormData(prev => ({ ...prev, [name]: cpfFormatado }));
      if (validationErrors.cpf) {
        setValidationErrors(prev => ({ ...prev, cpf: '' }));
      }
    } else if (name === 'cnh') {
      const cnhFormatada = formatarCNH(value);
      setFormData(prev => ({ ...prev, [name]: cnhFormatada }));
      if (validationErrors.cnh) {
        setValidationErrors(prev => ({ ...prev, cnh: '' }));
      }
    } else if (name === 'telefone') {
      const telefoneFormatado = formatarTelefone(value);
      setFormData(prev => ({ ...prev, [name]: telefoneFormatado }));
      if (validationErrors.telefone) {
        setValidationErrors(prev => ({ ...prev, telefone: '' }));
      }
    } else if (name === 'nome') {
      const nomeLimpo = sanitizeNomeCompleto(value);
      setFormData(prev => ({ ...prev, [name]: nomeLimpo }));
      if (validationErrors.nome) {
        setValidationErrors(prev => ({ ...prev, nome: '' }));
      }
    } else if (name === 'endereco') {
      const enderecoLimpo = sanitizeEndereco(value);
      setFormData(prev => ({ ...prev, [name]: enderecoLimpo }));
      if (validationErrors.endereco) {
        setValidationErrors(prev => ({ ...prev, endereco: '' }));
      }
    } else if (name === 'email') {
      // Remove caracteres proibidos e limita e-mail a 320 caracteres
      const emailLimpo = limparEmail(value);
      const emailLimitado = emailLimpo.slice(0, 320);
      setFormData(prev => ({ ...prev, [name]: emailLimitado }));
      if (validationErrors.email) {
        setValidationErrors(prev => ({ ...prev, email: '' }));
      }
    } else if (name === 'observacoes') {
      // Limita observações a 150 caracteres e remove HTML/scripts
      const observacoesLimitadas = sanitizeObservacoes(value);
      setFormData(prev => ({ ...prev, [name]: observacoesLimitadas }));
    } else if (name === 'dataNascimento' || name === 'validadeCNH' || name === 'dataAdmissao') {
      const dataLimpa = sanitizeDateInput(value);
      setFormData(prev => ({ ...prev, [name]: dataLimpa }));
      if (validationErrors[name]) {
        setValidationErrors(prev => ({ ...prev, [name]: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      // Limpa erro do campo que está sendo editado
      if (validationErrors[name]) {
        setValidationErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  /**
   * Valida CPF quando o usuário sai do campo
   */
  const handleCPFBlur = () => {
    if (formData.cpf) {
      const resultado = validarCPF(formData.cpf);
      if (!resultado.valido) {
        setValidationErrors(prev => ({ ...prev, cpf: resultado.mensagem }));
      } else {
        setValidationErrors(prev => ({ ...prev, cpf: '' }));
      }
    }
  };

  /**
   * Valida CNH quando o usuário sai do campo
   */
  const handleCNHBlur = () => {
    if (formData.cnh) {
      const resultado = validarCNH(formData.cnh);
      if (!resultado.valido) {
        setValidationErrors(prev => ({ ...prev, cnh: resultado.mensagem }));
      } else {
        setValidationErrors(prev => ({ ...prev, cnh: '' }));
      }
    }
  };

  /**
   * Valida telefone quando o usuário sai do campo
   */
  const handleTelefoneBlur = () => {
    if (formData.telefone) {
      const resultado = validarTelefone(formData.telefone);
      if (!resultado.valido) {
        setValidationErrors(prev => ({ ...prev, telefone: resultado.mensagem }));
      } else {
        setValidationErrors(prev => ({ ...prev, telefone: '' }));
      }
    }
  };

  /**
   * Valida e-mail quando o usuário sai do campo
   */
  const handleEmailBlur = () => {
    if (formData.email) {
      const resultado = validarEmail(formData.email);
      if (!resultado.valido) {
        setValidationErrors(prev => ({ ...prev, email: resultado.mensagem }));
      } else {
        setValidationErrors(prev => ({ ...prev, email: '' }));
      }
    }
  };

  /**
   * Previne a digitação de caracteres inválidos no e-mail
   */
  const handleEmailKeyPress = (e) => {
    const char = e.key;
    // Permite apenas caracteres válidos em e-mails segundo RFC 5322
    const caracteresValidos = /^[a-zA-Z0-9.@!#$%&'*+\-/=?^_`{|}~]$/;

    // Permite teclas de controle (Backspace, Delete, Arrow keys, Tab, etc.)
    if (e.ctrlKey || e.metaKey || e.altKey || char.length > 1) {
      return; // Permite atalhos de teclado e teclas especiais
    }

    // Bloqueia caracteres inválidos
    if (!caracteresValidos.test(char)) {
      e.preventDefault();
    }
  };

  /**
   * Valida todos os campos antes de submeter
   */
  const validarFormulario = () => {
    const erros = {};

    // Valida nome
    if (!formData.nome.trim()) {
      erros.nome = 'Nome é obrigatório';
    }

    // Valida CPF
    if (!formData.cpf) {
      erros.cpf = 'CPF é obrigatório';
    } else {
      const resultadoCPF = validarCPF(formData.cpf);
      if (!resultadoCPF.valido) {
        erros.cpf = resultadoCPF.mensagem;
      }
    }

    // Valida CNH
    if (!formData.cnh.trim()) {
      erros.cnh = 'CNH é obrigatória';
    } else {
      const resultadoCNH = validarCNH(formData.cnh);
      if (!resultadoCNH.valido) {
        erros.cnh = resultadoCNH.mensagem;
      }
    }

    // Valida categoria CNH
    if (!formData.categoriaCNH) {
      erros.categoriaCNH = 'Categoria da CNH é obrigatória';
    }

    // Valida validade CNH
    if (!formData.validadeCNH) {
      erros.validadeCNH = 'Validade da CNH é obrigatória';
    }

    // Valida telefone (opcional, mas se preenchido deve ser válido)
    if (formData.telefone) {
      const resultadoTelefone = validarTelefone(formData.telefone);
      if (!resultadoTelefone.valido) {
        erros.telefone = resultadoTelefone.mensagem;
      }
    }

    // Valida e-mail (opcional, mas se preenchido deve ser válido)
    if (formData.email) {
      const resultadoEmail = validarEmail(formData.email);
      if (!resultadoEmail.valido) {
        erros.email = resultadoEmail.mensagem;
      }
    }

    // Valida data de admissão
    if (!formData.dataAdmissao) {
      erros.dataAdmissao = 'Data de admissão é obrigatória';
    }

    setValidationErrors(erros);
    return Object.keys(erros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valida o formulário antes de enviar
    if (!validarFormulario()) {
      alert('Por favor, corrija os erros no formulário antes de continuar.');
      return;
    }

    try {
      // Prepare data - convert empty strings to null for optional fields
      const submitData = {
        nome: sanitizeNomeCompleto(formData.nome),
        cpf: limparCPF(formData.cpf), // Envia apenas números
        cnh: limparCNH(formData.cnh), // Envia apenas números
        categoriaCNH: formData.categoriaCNH,
        validadeCNH: formData.validadeCNH,
        telefone: formData.telefone ? converterParaE164(formData.telefone) : null, // Formato E.164
        email: formData.email ? sanitizeEmail(formData.email) : null,
        endereco: formData.endereco ? sanitizeEndereco(formData.endereco) : null,
        dataNascimento: formData.dataNascimento || null,
        dataAdmissao: formData.dataAdmissao,
        status: formData.status,
        observacoes: formData.observacoes ? sanitizeObservacoes(formData.observacoes) : null,
      };

      console.log('Dados sendo enviados:', submitData);

      if (editingMotorista) {
        await motoristasService.update(editingMotorista.id, {
          id: editingMotorista.id,
          ...submitData
        });
        alert('Motorista atualizado com sucesso!');
      } else {
        await motoristasService.create(submitData);
        alert('Motorista cadastrado com sucesso!');
      }
      handleCloseModal();
      loadMotoristas();
    } catch (error) {
      console.error('Erro ao salvar motorista:', error);
      console.error('Resposta do erro:', error.response?.data);

      // Show specific error message
      let errorMessage = 'Erro ao salvar motorista';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.title) {
        errorMessage = error.response.data.title;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        errorMessage = Object.keys(errors).map(key =>
          `${key}: ${errors[key].join(', ')}`
        ).join('\n');
      } else if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
      }

      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este motorista?')) {
      try {
        await motoristasService.delete(id);
        alert('Motorista excluído com sucesso!');
        loadMotoristas();
      } catch (error) {
        console.error('Erro ao excluir motorista:', error);
        alert(error.response?.data?.message || 'Erro ao excluir motorista');
      }
    }
  };

  const filteredMotoristas = motoristas.filter(m =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cpf.includes(searchTerm) ||
    m.cnh.includes(searchTerm)
  );

  const columns = [
    { header: 'Nome', accessor: 'nome' },
    {
      header: 'CPF',
      render: (row) => formatarCPF(row.cpf)
    },
    { header: 'CNH', accessor: 'cnh' },
    { header: 'Categoria', accessor: 'categoriaCNH' },
    {
      header: 'Validade CNH',
      render: (row) => row.validadeCNH ? format(new Date(row.validadeCNH), 'dd/MM/yyyy') : '-'
    },
    { header: 'Telefone', accessor: 'telefone' },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Ações',
      render: (row) => (
        <div className="table-actions">
          <button
            type="button"
            onClick={() => handleOpenModal(row)}
            className="table-action table-action--edit"
            aria-label={`Editar motorista ${row.nome}`}
          >
            <Edit size={18} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            className="table-action table-action--delete"
            aria-label={`Excluir motorista ${row.nome}`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header__title-group">
          <h1 className="page-title">Motoristas</h1>
          <p className="page-subtitle">Gestão completa dos condutores da frota</p>
        </div>
        <div className="page-header__actions">
          <Button onClick={() => handleOpenModal()}>
            <Plus size={20} />
            Novo motorista
          </Button>
        </div>
      </div>

      <Card>
        <div className="page-filters">
          <div className="search-field">
            <Search className="search-field__icon" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou CNH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-field__input"
              aria-label="Buscar motoristas"
            />
          </div>
          <Select
            name="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos os Status' },
              { value: 'Ativo', label: 'Ativo' },
              { value: 'Inativo', label: 'Inativo' },
              { value: 'Férias', label: 'Férias' },
            ]}
            placeholder="Filtrar por status"
          />
        </div>
      </Card>

      <Card title="Motoristas cadastrados" subtitle="Acompanhe os profissionais da equipe">
        {loading ? (
          <div className="loading-state">Carregando...</div>
        ) : (
          <Table columns={columns} data={filteredMotoristas} />
        )}
      </Card>

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMotorista ? 'Editar Motorista' : 'Novo Motorista'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid form-grid--two">
            <Input
              label="Nome Completo"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              required
              error={validationErrors.nome}
              maxLength={100}
            />

            <Input
              label="CPF"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              onBlur={handleCPFBlur}
              placeholder="000.000.000-00"
              maxLength={14}
              required
              error={validationErrors.cpf}
            />

            <Input
              label="CNH"
              name="cnh"
              value={formData.cnh}
              onChange={handleInputChange}
              onBlur={handleCNHBlur}
              placeholder="00000000000"
              maxLength={11}
              required
              error={validationErrors.cnh}
            />

            <Select
              label="Categoria CNH"
              name="categoriaCNH"
              value={formData.categoriaCNH}
              onChange={handleInputChange}
              options={[
                { value: 'A', label: 'A' },
                { value: 'B', label: 'B' },
                { value: 'C', label: 'C' },
                { value: 'D', label: 'D' },
                { value: 'E', label: 'E' },
                { value: 'AB', label: 'AB' },
              ]}
              required
              error={validationErrors.categoriaCNH}
            />

            <Input
              label="Validade CNH"
              name="validadeCNH"
              type="date"
              value={formData.validadeCNH}
              onChange={handleInputChange}
              required
              error={validationErrors.validadeCNH}
            />

            <div className="form-field-group">
              <Input
                label="Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                onBlur={handleTelefoneBlur}
                placeholder="(00) 00000-0000"
                maxLength={15}
                error={validationErrors.telefone}
              />
              <p className="form-field__note">Será enviado no formato E.164: +5519999998888</p>
            </div>

            <div className="form-field-group">
              <Input
                label="E-mail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleEmailBlur}
                onKeyPress={handleEmailKeyPress}
                maxLength={320}
                error={validationErrors.email}
              />
              <p className="form-field__note">Apenas caracteres válidos são permitidos</p>
            </div>

            <Input
              label="Data de Nascimento"
              name="dataNascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={handleInputChange}
              error={validationErrors.dataNascimento}
            />

            <Input
              label="Data de Admissão"
              name="dataAdmissao"
              type="date"
              value={formData.dataAdmissao}
              onChange={handleInputChange}
              required
              error={validationErrors.dataAdmissao}
            />

            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={[
                { value: 'Ativo', label: 'Ativo' },
                { value: 'Inativo', label: 'Inativo' },
              ]}
              required
            />
          </div>

          <Input
            label="Endereço"
            name="endereco"
            value={formData.endereco}
            onChange={handleInputChange}
            maxLength={120}
          />

          <div className="form-field">
            <label htmlFor="observacoes" className="form-field__label">
              Observações
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleInputChange}
              rows="3"
              maxLength={150}
              className="form-field__control"
            />
            <p className="form-field__note">
              {formData.observacoes.length}/150 caracteres
            </p>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingMotorista ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Motoristas;