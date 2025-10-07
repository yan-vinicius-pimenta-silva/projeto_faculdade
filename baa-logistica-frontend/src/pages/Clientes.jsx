// ============================================
// src/pages/Clientes.jsx
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
import { clientesService } from '../services/clientesService';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    cpf: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    contato: '',
    status: 'Ativo',
  });

  useEffect(() => {
    loadClientes();
  }, [statusFilter]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const data = await clientesService.getAll(params);
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      alert('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData(cliente);
    } else {
      setEditingCliente(null);
      setFormData({
        razaoSocial: '',
        nomeFantasia: '',
        cnpj: '',
        cpf: '',
        telefone: '',
        email: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        contato: '',
        status: 'Ativo',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        razaoSocial: formData.razaoSocial,
        nomeFantasia: formData.nomeFantasia || null,
        cnpj: formData.cnpj || null,
        cpf: formData.cpf || null,
        telefone: formData.telefone || null,
        email: formData.email || null,
        endereco: formData.endereco || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        cep: formData.cep || null,
        contato: formData.contato || null,
        status: formData.status,
      };

      console.log('Dados sendo enviados:', submitData);

      if (editingCliente) {
        await clientesService.update(editingCliente.id, { id: editingCliente.id, ...submitData });
        alert('Cliente atualizado com sucesso!');
      } else {
        await clientesService.create(submitData);
        alert('Cliente cadastrado com sucesso!');
      }
      handleCloseModal();
      loadClientes();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      console.error('Resposta do erro:', error.response?.data);

      let errorMessage = 'Erro ao salvar cliente';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.keys(errors).map(key => `${key}: ${errors[key].join(', ')}`).join('\n');
      }
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await clientesService.delete(id);
        alert('Cliente excluído com sucesso!');
        loadClientes();
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        alert(error.response?.data?.message || 'Erro ao excluir cliente');
      }
    }
  };

  const filteredClientes = clientes.filter(c =>
    c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.nomeFantasia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cnpj || '').includes(searchTerm) ||
    (c.cpf || '').includes(searchTerm)
  );

  const columns = [
    { header: 'Razão Social', accessor: 'razaoSocial' },
    { header: 'Nome Fantasia', accessor: 'nomeFantasia' },
    {
      header: 'CNPJ/CPF',
      render: (row) => row.cnpj || row.cpf || '-'
    },
    { header: 'Cidade', accessor: 'cidade' },
    { header: 'Estado', accessor: 'estado' },
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
        <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={20} className="inline mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ ou CPF..."
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
          <Table columns={columns} data={filteredClientes} />
        )}
      </Card>

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Razão Social"
              name="razaoSocial"
              value={formData.razaoSocial}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Nome Fantasia"
              name="nomeFantasia"
              value={formData.nomeFantasia}
              onChange={handleInputChange}
            />
            <Input
              label="CNPJ"
              name="cnpj"
              value={formData.cnpj}
              onChange={handleInputChange}
              placeholder="00.000.000/0000-00"
            />
            <Input
              label="CPF"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              placeholder="000.000.000-00"
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
              label="Pessoa de Contato"
              name="contato"
              value={formData.contato}
              onChange={handleInputChange}
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

          <div className="mt-4">
            <Input
              label="Endereço"
              name="endereco"
              value={formData.endereco}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Input
              label="Cidade"
              name="cidade"
              value={formData.cidade}
              onChange={handleInputChange}
            />
            <Input
              label="Estado"
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              placeholder="SP"
              maxLength="2"
            />
            <Input
              label="CEP"
              name="cep"
              value={formData.cep}
              onChange={handleInputChange}
              placeholder="00000-000"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingCliente ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Clientes;