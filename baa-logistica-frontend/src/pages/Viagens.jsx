// ============================================
// src/pages/Viagens.jsx
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
import { viagensService } from '../services/viagensService';
import { motoristasService } from '../services/motoristasService';
import { veiculosService } from '../services/veiculosService';
import { cargasService } from '../services/cargasService';
import { format } from 'date-fns';

const Viagens = () => {
  const [viagens, setViagens] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingViagem, setEditingViagem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    numeroViagem: '',
    cargaId: '',
    veiculoId: '',
    motoristaId: '',
    dataSaida: '',
    dataPrevisaoChegada: '',
    dataChegadaReal: '',
    kmInicial: '',
    kmFinal: '',
    distanciaPercorrida: '',
    valorFrete: '',
    status: 'Planejada',
    observacoes: '',
  });

  useEffect(() => {
    loadViagens();
    loadResources();
  }, [statusFilter]);

  const loadViagens = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const data = await viagensService.getAll(params);
      setViagens(data);
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
      alert('Erro ao carregar viagens');
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      const [motoristasData, veiculosData, cargasData] = await Promise.all([
        motoristasService.getDisponiveis(),
        veiculosService.getDisponiveis(),
        cargasService.getAll({ status: 'Aguardando' }),
      ]);
      setMotoristas(motoristasData);
      setVeiculos(veiculosData);
      setCargas(cargasData);
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
    }
  };

  const generateNumeroViagem = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `VGM${year}${month}${day}${random}`;
  };

  const handleOpenModal = (viagem = null) => {
    if (viagem) {
      setEditingViagem(viagem);
      setFormData({
        ...viagem,
        dataSaida: viagem.dataSaida ? format(new Date(viagem.dataSaida), 'yyyy-MM-dd\'T\'HH:mm') : '',
        dataPrevisaoChegada: viagem.dataPrevisaoChegada ? format(new Date(viagem.dataPrevisaoChegada), 'yyyy-MM-dd\'T\'HH:mm') : '',
        dataChegadaReal: viagem.dataChegadaReal ? format(new Date(viagem.dataChegadaReal), 'yyyy-MM-dd\'T\'HH:mm') : '',
      });
    } else {
      setEditingViagem(null);
      setFormData({
        numeroViagem: generateNumeroViagem(),
        cargaId: '',
        veiculoId: '',
        motoristaId: '',
        dataSaida: '',
        dataPrevisaoChegada: '',
        dataChegadaReal: '',
        kmInicial: '',
        kmFinal: '',
        distanciaPercorrida: '',
        valorFrete: '',
        status: 'Planejada',
        observacoes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingViagem(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        numeroViagem: formData.numeroViagem,
        cargaId: parseInt(formData.cargaId),
        veiculoId: parseInt(formData.veiculoId),
        motoristaId: parseInt(formData.motoristaId),
        dataSaida: formData.dataSaida || null,
        dataPrevisaoChegada: formData.dataPrevisaoChegada || null,
        dataChegadaReal: formData.dataChegadaReal || null,
        kmInicial: formData.kmInicial ? parseInt(formData.kmInicial) : null,
        kmFinal: formData.kmFinal ? parseInt(formData.kmFinal) : null,
        distanciaPercorrida: formData.distanciaPercorrida ? parseInt(formData.distanciaPercorrida) : null,
        valorFrete: formData.valorFrete ? parseFloat(formData.valorFrete) : null,
        status: formData.status,
        observacoes: formData.observacoes || null,
      };

      console.log('Dados sendo enviados:', submitData);

      if (editingViagem) {
        await viagensService.update(editingViagem.id, { id: editingViagem.id, ...submitData });
        alert('Viagem atualizada com sucesso!');
      } else {
        await viagensService.create(submitData);
        alert('Viagem cadastrada com sucesso!');
      }
      handleCloseModal();
      loadViagens();
      loadResources();
    } catch (error) {
      console.error('Erro ao salvar viagem:', error);
      console.error('Resposta do erro:', error.response?.data);

      let errorMessage = 'Erro ao salvar viagem';
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
    if (window.confirm('Tem certeza que deseja excluir esta viagem?')) {
      try {
        await viagensService.delete(id);
        alert('Viagem excluída com sucesso!');
        loadViagens();
      } catch (error) {
        console.error('Erro ao excluir viagem:', error);
        alert(error.response?.data?.message || 'Erro ao excluir viagem');
      }
    }
  };

  const filteredViagens = viagens.filter(v =>
    v.numeroViagem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.motorista?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.veiculo?.placa || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Nº Viagem', accessor: 'numeroViagem' },
    {
      header: 'Motorista',
      render: (row) => row.motorista?.nome || '-'
    },
    {
      header: 'Veículo',
      render: (row) => row.veiculo?.placa || '-'
    },
    {
      header: 'Carga',
      render: (row) => row.carga?.numeroProtocolo || '-'
    },
    {
      header: 'Origem',
      render: (row) => row.carga?.cidadeColeta || '-'
    },
    {
      header: 'Destino',
      render: (row) => row.carga?.cidadeEntrega || '-'
    },
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
            aria-label={`Editar viagem ${row.numeroViagem}`}
          >
            <Edit size={18} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            className="table-action table-action--delete"
            aria-label={`Excluir viagem ${row.numeroViagem}`}
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
          <h1 className="page-title">Viagens</h1>
          <p className="page-subtitle">Planejamento e acompanhamento das rotas em andamento</p>
        </div>
        <div className="page-header__actions">
          <Button onClick={() => handleOpenModal()}>
            <Plus size={20} />
            Nova viagem
          </Button>
        </div>
      </div>

      <Card>
        <div className="page-filters">
          <div className="search-field">
            <Search className="search-field__icon" size={20} />
            <input
              type="text"
              placeholder="Buscar por número, motorista ou veículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-field__input"
              aria-label="Buscar viagens"
            />
          </div>
          <Select
            name="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos os Status' },
              { value: 'Planejada', label: 'Planejada' },
              { value: 'Em Andamento', label: 'Em Andamento' },
              { value: 'Concluída', label: 'Concluída' },
              { value: 'Cancelada', label: 'Cancelada' },
            ]}
            placeholder="Filtrar por status"
          />
        </div>
      </Card>

      <Card title="Viagens cadastradas" subtitle="Detalhes das movimentações logísticas">
        {loading ? (
          <div className="loading-state">Carregando...</div>
        ) : (
          <Table columns={columns} data={filteredViagens} />
        )}
      </Card>

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingViagem ? 'Editar Viagem' : 'Nova Viagem'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid form-grid--two">
            <Input
              label="Número da Viagem"
              name="numeroViagem"
              value={formData.numeroViagem}
              onChange={handleInputChange}
              required
              disabled={editingViagem !== null}
            />
            <Select
              label="Carga"
              name="cargaId"
              value={formData.cargaId}
              onChange={handleInputChange}
              options={cargas.map(c => ({ value: c.id, label: `${c.numeroProtocolo} - ${c.descricaoCarga}` }))}
              required
            />
            <Select
              label="Veículo"
              name="veiculoId"
              value={formData.veiculoId}
              onChange={handleInputChange}
              options={veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` }))}
              required
            />
            <Select
              label="Motorista"
              name="motoristaId"
              value={formData.motoristaId}
              onChange={handleInputChange}
              options={motoristas.map(m => ({ value: m.id, label: m.nome }))}
              required
            />
            <Input
              label="Data de Saída"
              name="dataSaida"
              type="datetime-local"
              value={formData.dataSaida}
              onChange={handleInputChange}
            />
            <Input
              label="Previsão de Chegada"
              name="dataPrevisaoChegada"
              type="datetime-local"
              value={formData.dataPrevisaoChegada}
              onChange={handleInputChange}
            />
            <Input
              label="Chegada Real"
              name="dataChegadaReal"
              type="datetime-local"
              value={formData.dataChegadaReal}
              onChange={handleInputChange}
            />
            <Input
              label="KM Inicial"
              name="kmInicial"
              type="number"
              value={formData.kmInicial}
              onChange={handleInputChange}
            />
            <Input
              label="KM Final"
              name="kmFinal"
              type="number"
              value={formData.kmFinal}
              onChange={handleInputChange}
            />
            <Input
              label="Distância Percorrida (km)"
              name="distanciaPercorrida"
              type="number"
              value={formData.distanciaPercorrida}
              onChange={handleInputChange}
            />
            <Input
              label="Valor do Frete (R$)"
              name="valorFrete"
              type="number"
              step="0.01"
              value={formData.valorFrete}
              onChange={handleInputChange}
            />
            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={[
                { value: 'Planejada', label: 'Planejada' },
                { value: 'Em Andamento', label: 'Em Andamento' },
                { value: 'Concluída', label: 'Concluída' },
                { value: 'Cancelada', label: 'Cancelada' },
              ]}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="observacoes-viagem" className="form-field__label">
              Observações
            </label>
            <textarea
              id="observacoes-viagem"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleInputChange}
              rows="3"
              className="form-field__control"
            />
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingViagem ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Viagens;