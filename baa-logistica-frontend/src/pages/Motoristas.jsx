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
import './Motoristas.css';

// ============================================
// FUNÇÕES UTILITÁRIAS DE CPF
// ============================================

/**
 * Remove caracteres não numéricos do CPF
 */
const limparCPF = (cpf) => {
  return cpf.replace(/\D/g, '');
};

/**
 * Formata CPF com máscara: 000.000.000-00
 */
const formatarCPF = (cpf) => {
  const numeros = limparCPF(cpf);

  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`;
};

/**
 * Valida CPF seguindo o algoritmo oficial
 */
const validarCPF = (cpf) => {
  const cpfLimpo = limparCPF(cpf);

  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return { valido: false, mensagem: 'CPF deve conter 11 dígitos' };
  }

  // Verifica se não é uma sequência repetida
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return { valido: false, mensagem: 'CPF não pode ser uma sequência repetida' };
  }

  // Calcula o primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;

  // Verifica o primeiro dígito verificador
  if (digito1 !== parseInt(cpfLimpo.charAt(9))) {
    return { valido: false, mensagem: 'CPF inválido' };
  }

  // Calcula o segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;

  // Verifica o segundo dígito verificador
  if (digito2 !== parseInt(cpfLimpo.charAt(10))) {
    return { valido: false, mensagem: 'CPF inválido' };
  }

  return { valido: true, mensagem: '' };
};

// ============================================
// FUNÇÕES UTILITÁRIAS DE CNH
// ============================================

/**
 * Remove caracteres não numéricos da CNH
 */
const limparCNH = (cnh) => {
  return cnh.replace(/\D/g, '');
};

/**
 * Formata CNH com máscara: 00000000000
 */
const formatarCNH = (cnh) => {
  const numeros = limparCNH(cnh);
  return numeros.slice(0, 11);
};

/**
 * Valida CNH seguindo o algoritmo oficial
 */
const validarCNH = (cnh) => {
  const cnhLimpa = limparCNH(cnh);

  // Verifica se tem 11 dígitos
  if (cnhLimpa.length !== 11) {
    return { valido: false, mensagem: 'CNH deve conter 11 dígitos' };
  }

  // Verifica se não é uma sequência repetida
  if (/^(\d)\1{10}$/.test(cnhLimpa)) {
    return { valido: false, mensagem: 'CNH não pode ser uma sequência repetida' };
  }

  // Calcula o primeiro dígito verificador
  let soma = 0;
  let peso = 9;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cnhLimpa.charAt(i)) * peso;
    peso--;
  }

  let resto = soma % 11;
  let digito1 = resto >= 10 ? 0 : resto;

  // Se resto = 10, soma recebe +2 para o próximo cálculo
  if (resto === 10) {
    soma += 2;
  }

  // Calcula o segundo dígito verificador
  soma = 0;
  peso = 1;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cnhLimpa.charAt(i)) * peso;
    peso++;
  }

  // Adiciona o primeiro dígito verificador
  soma += digito1 * 9;

  resto = soma % 11;
  let digito2 = resto >= 10 ? 0 : resto;

  // Verifica os dígitos verificadores
  if (digito1 !== parseInt(cnhLimpa.charAt(9)) || digito2 !== parseInt(cnhLimpa.charAt(10))) {
    return { valido: false, mensagem: 'CNH inválida' };
  }

  return { valido: true, mensagem: '' };
};

// ============================================
// FUNÇÕES UTILITÁRIAS DE TELEFONE
// ============================================

/**
 * Remove caracteres não numéricos do telefone
 */
const limparTelefone = (telefone) => {
  return telefone.replace(/\D/g, '');
};

/**
 * Formata telefone no padrão brasileiro: +55 (00) 00000-0000
 */
const formatarTelefone = (telefone) => {
  const numeros = limparTelefone(telefone);

  // Remove o +55 se estiver presente no início
  const numerosSemCodigo = numeros.startsWith('55') ? numeros.slice(2) : numeros;

  if (numerosSemCodigo.length <= 2) return numerosSemCodigo;
  if (numerosSemCodigo.length <= 7) return `(${numerosSemCodigo.slice(0, 2)}) ${numerosSemCodigo.slice(2)}`;
  if (numerosSemCodigo.length <= 11) {
    const ddd = numerosSemCodigo.slice(0, 2);
    const numero = numerosSemCodigo.slice(2);
    if (numero.length <= 4) {
      return `(${ddd}) ${numero}`;
    } else if (numero.length <= 8) {
      return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
    } else {
      return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
    }
  }
  return telefone;
};

/**
 * Converte telefone brasileiro para formato E.164: +55DDNNNNNNNNN
 */
const converterParaE164 = (telefone) => {
  const numeros = limparTelefone(telefone);

  // Se já começa com 55, assume que está correto
  if (numeros.startsWith('55') && numeros.length >= 12) {
    return `+${numeros}`;
  }

  // Adiciona o código do Brasil +55
  if (numeros.length >= 10) {
    return `+55${numeros}`;
  }

  return null;
};

/**
 * Valida telefone brasileiro (DDD + número de 8 ou 9 dígitos)
 */
const validarTelefone = (telefone) => {
  if (!telefone || telefone.trim() === '') {
    return { valido: true, mensagem: '' }; // Telefone é opcional
  }

  const numeros = limparTelefone(telefone);

  // Remove +55 se presente
  const numerosSemCodigo = numeros.startsWith('55') ? numeros.slice(2) : numeros;

  // Deve ter 10 (fixo) ou 11 (celular) dígitos
  if (numerosSemCodigo.length < 10 || numerosSemCodigo.length > 11) {
    return { valido: false, mensagem: 'Telefone deve ter 10 ou 11 dígitos (DDD + número)' };
  }

  // DDD deve ser válido (entre 11 e 99)
  const ddd = parseInt(numerosSemCodigo.slice(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { valido: false, mensagem: 'DDD inválido' };
  }

  // Se tem 11 dígitos, deve começar com 9 (celular)
  if (numerosSemCodigo.length === 11) {
    const primeiroDigito = numerosSemCodigo.charAt(2);
    if (primeiroDigito !== '9') {
      return { valido: false, mensagem: 'Celular deve começar com 9' };
    }
  }

  return { valido: true, mensagem: '' };
};

// ============================================
// FUNÇÕES UTILITÁRIAS DE E-MAIL
// ============================================

/**
 * Remove caracteres proibidos do e-mail
 * Permite apenas caracteres válidos segundo RFC 5322:
 * - Letras (a-z, A-Z)
 * - Números (0-9)
 * - Caracteres especiais permitidos: . @ ! # $ % & ' * + - / = ? ^ _ ` { | } ~
 */
const limparEmail = (email) => {
  // Mantém apenas caracteres permitidos em e-mails segundo RFC 5322
  return email.replace(/[^a-zA-Z0-9.@!#$%&'*+\-/=?^_`{|}~]/g, '');
};

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
    dataAdmissao: '',
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
        nome: motorista.nome || '',
        cpf: motorista.cpf || '',
        cnh: motorista.cnh || '',
        categoriaCNH: motorista.categoriaCNH || '',
        validadeCNH: motorista.validadeCNH ? format(new Date(motorista.validadeCNH), 'yyyy-MM-dd') : '',
        telefone: motorista.telefone || '',
        email: motorista.email || '',
        endereco: motorista.endereco || '',
        dataNascimento: motorista.dataNascimento ? format(new Date(motorista.dataNascimento), 'yyyy-MM-dd') : '',
        dataAdmissao: motorista.dataAdmissao ? format(new Date(motorista.dataAdmissao), 'yyyy-MM-dd') : '',
        status: motorista.status || 'Ativo',
        observacoes: motorista.observacoes || '',
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
        dataAdmissao: format(new Date(), 'yyyy-MM-dd'),
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
    } else if (name === 'email') {
      // Remove caracteres proibidos e limita e-mail a 320 caracteres
      const emailLimpo = limparEmail(value);
      const emailLimitado = emailLimpo.slice(0, 320);
      setFormData(prev => ({ ...prev, [name]: emailLimitado }));
      if (validationErrors.email) {
        setValidationErrors(prev => ({ ...prev, email: '' }));
      }
    } else if (name === 'observacoes') {
      // Limita observações a 150 caracteres
      const observacoesLimitadas = value.slice(0, 150);
      setFormData(prev => ({ ...prev, [name]: observacoesLimitadas }));
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
        nome: formData.nome,
        cpf: limparCPF(formData.cpf), // Envia apenas números
        cnh: limparCNH(formData.cnh), // Envia apenas números
        categoriaCNH: formData.categoriaCNH,
        validadeCNH: formData.validadeCNH,
        telefone: formData.telefone ? converterParaE164(formData.telefone) : null, // Formato E.164
        email: formData.email || null,
        endereco: formData.endereco || null,
        dataNascimento: formData.dataNascimento || null,
        dataAdmissao: formData.dataAdmissao,
        status: formData.status,
        observacoes: formData.observacoes || null,
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
        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Motoristas</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={20} className="inline mr-2" />
          Novo Motorista
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou CNH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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

      {/* Tabela */}
      <Card>
        {loading ? (
          <p className="text-center text-gray-500 py-4">Carregando...</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Nome Completo"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
              />
              {validationErrors.nome && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.nome}</p>
              )}
            </div>

            <div>
              <Input
                label="CPF"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                onBlur={handleCPFBlur}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
              {validationErrors.cpf && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.cpf}</p>
              )}
            </div>

            <div>
              <Input
                label="CNH"
                name="cnh"
                value={formData.cnh}
                onChange={handleInputChange}
                onBlur={handleCNHBlur}
                placeholder="00000000000"
                maxLength={11}
                required
              />
              {validationErrors.cnh && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.cnh}</p>
              )}
            </div>

            <div>
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
                ]}
                required
              />
              {validationErrors.categoriaCNH && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.categoriaCNH}</p>
              )}
            </div>

            <div>
              <Input
                label="Validade CNH"
                name="validadeCNH"
                type="date"
                value={formData.validadeCNH}
                onChange={handleInputChange}
                required
              />
              {validationErrors.validadeCNH && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.validadeCNH}</p>
              )}
            </div>

            <div>
              <Input
                label="Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                onBlur={handleTelefoneBlur}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
              {validationErrors.telefone && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.telefone}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Será enviado no formato E.164: +5519999998888</p>
            </div>

            <div>
              <Input
                label="E-mail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleEmailBlur}
                onKeyPress={handleEmailKeyPress}
                maxLength={320}
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Apenas caracteres válidos são permitidos</p>
            </div>

            <Input
              label="Data de Nascimento"
              name="dataNascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={handleInputChange}
            />

            <div>
              <Input
                label="Data de Admissão"
                name="dataAdmissao"
                type="date"
                value={formData.dataAdmissao}
                onChange={handleInputChange}
                required
              />
              {validationErrors.dataAdmissao && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.dataAdmissao}</p>
              )}
            </div>

            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={[
                { value: 'Ativo', label: 'Ativo' },
                { value: 'Inativo', label: 'Inativo' },
                { value: 'Férias', label: 'Férias' },
              ]}
              required
            />
          </div>

          <Input
            label="Endereço"
            name="endereco"
            value={formData.endereco}
            onChange={handleInputChange}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleInputChange}
              rows="3"
              maxLength={150}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.observacoes.length}/150 caracteres
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
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