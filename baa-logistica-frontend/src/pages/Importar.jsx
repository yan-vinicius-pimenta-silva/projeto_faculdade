import { useRef, useState } from 'react';
import { FileDown, FileUp } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import excelService from '../services/excelService';

const ENTITIES = [
  {
    key: 'motoristas',
    title: 'Motoristas',
    description: 'Importe ou exporte os dados dos condutores cadastrados.',
  },
  {
    key: 'veiculos',
    title: 'Veículos',
    description: 'Gerencie sua frota via planilhas Excel.',
  },
  {
    key: 'clientes',
    title: 'Clientes',
    description: 'Atualize o cadastro de clientes com dados em massa.',
  },
  {
    key: 'cargas',
    title: 'Cargas',
    description: 'Sincronize protocolos e detalhes logísticos das cargas.',
  },
  {
    key: 'viagens',
    title: 'Viagens',
    description: 'Cadastre ou revise itinerários e status de viagens.',
  },
];

const Importar = () => {
  const [feedback, setFeedback] = useState({});
  const fileInputsRef = useRef({});

  const setLoading = (key, isLoading) => {
    setFeedback((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        loading: isLoading,
        message: '',
        type: '',
        summary: null,
      },
    }));
  };

  const handleExport = async (entity) => {
    setLoading(entity.key, true);

    try {
      const response = await excelService.exportData(entity.key);
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const fileName = extractFileName(response.headers['content-disposition'])
        || `${entity.key}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      downloadBlob(blob, fileName);

      setFeedback((prev) => ({
        ...prev,
        [entity.key]: {
          loading: false,
          type: 'success',
          message: 'Exportação concluída com sucesso.',
          summary: null,
        },
      }));
    } catch (error) {
      const message = error?.response?.data?.message || 'Não foi possível exportar os dados.';
      setFeedback((prev) => ({
        ...prev,
        [entity.key]: {
          loading: false,
          type: 'error',
          message,
          summary: null,
        },
      }));
    }
  };

  const handleTriggerImport = (entityKey) => {
    const input = fileInputsRef.current[entityKey];
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const handleImport = async (entity, event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setLoading(entity.key, true);

    try {
      const result = await excelService.importData(entity.key, file);
      setFeedback((prev) => ({
        ...prev,
        [entity.key]: {
          loading: false,
          type: 'success',
          message: 'Importação concluída com sucesso.',
          summary: {
            inserted: result.inserted || 0,
            updated: result.updated || 0,
            skipped: result.skipped || 0,
          },
        },
      }));
    } catch (error) {
      const message = error?.response?.data?.message || 'Não foi possível importar o arquivo. Verifique o formato e tente novamente.';
      setFeedback((prev) => ({
        ...prev,
        [entity.key]: {
          loading: false,
          type: 'error',
          message,
          summary: null,
        },
      }));
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header__title-group">
          <h1 className="page-title">Importação de dados</h1>
          <p className="page-subtitle">
            Carregue planilhas Excel para atualizar cadastros em lote ou exporte as informações existentes.
          </p>
        </div>
      </div>

      <div className="import-grid">
        {ENTITIES.map((entity) => {
          const state = feedback[entity.key] || {};

          return (
            <Card
              key={entity.key}
              title={entity.title}
              subtitle={entity.description}
              className="import-card"
            >
              <div className="import-card__actions">
                <Button
                  onClick={() => handleExport(entity)}
                  disabled={state.loading}
                >
                  <FileDown size={18} />
                  Exportar Excel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleTriggerImport(entity.key)}
                  disabled={state.loading}
                >
                  <FileUp size={18} />
                  Importar Excel
                </Button>
                <input
                  ref={(node) => {
                    fileInputsRef.current[entity.key] = node;
                  }}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={(event) => handleImport(entity, event)}
                />
              </div>

              {state.message && (
                <div className={`alert ${state.type === 'error' ? 'alert--error' : 'alert--success'}`}>
                  {state.message}
                </div>
              )}

              {state.summary && (
                <ul className="import-card__summary">
                  <li><strong>{state.summary.inserted}</strong> registros inseridos</li>
                  <li><strong>{state.summary.updated}</strong> registros atualizados</li>
                  <li><strong>{state.summary.skipped}</strong> linhas ignoradas</li>
                </ul>
              )}

              <p className="import-card__note">
                Utilize o arquivo exportado como modelo para garantir que os cabeçalhos sejam reconhecidos corretamente.
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const extractFileName = (contentDisposition) => {
  if (!contentDisposition) {
    return '';
  }

  const match = contentDisposition
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().startsWith('filename='));

  if (!match) {
    return '';
  }

  return match.split('=')[1]?.replace(/(^\"|\"$)/g, '') || '';
};

const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default Importar;
