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

const Motoristas = () => {
  const [motoristas, setMotoristas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMotorista, setEditingMotorista] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMotorista(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data - convert empty strings to null for optional fields
      const submitData = {
        nome: formData.nome,
        cpf: formData.cpf,
        cnh: formData.cnh,
        categoriaCNH: formData.categoriaCNH,
        validadeCNH: formData.validadeCNH,
        telefone: formData.telefone || null,
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
    { header: 'CPF', accessor: 'cpf' },
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
            <Input
              label="Nome Completo"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              required
            />
            <Input
              label="CPF"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              placeholder="000.000.000-00"
              required
            />
            <Input
              label="CNH"
              name="cnh"
              value={formData.cnh}
              onChange={handleInputChange}
              required
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
              ]}
              required
            />
            <Input
              label="Validade CNH"
              name="validadeCNH"
              type="date"
              value={formData.validadeCNH}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleInputChange}
              placeholder="(00) 00000-0000"
            />
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <Input
              label="Data de Nascimento"
              name="dataNascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={handleInputChange}
            />
            <Input
              label="Data de Admissão"
              name="dataAdmissao"
              type="date"
              value={formData.dataAdmissao}
              onChange={handleInputChange}
              required
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
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