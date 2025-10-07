# 📋 Guia de Execução - Sistema B.A.A Logística

## 🎯 Requisitos

- **.NET 8 SDK** - [Download](https://dotnet.microsoft.com/download)
- **Node.js** (v18 ou superior) - [Download](https://nodejs.org/)
- **Editor de código** (Visual Studio Code recomendado)

## 🚀 Passo a Passo para Executar

### 1️⃣ Configurar o Backend (.NET)

```bash
# Navegue até a pasta do projeto
cd BAALogistica

# Restaurar dependências
dotnet restore

# Navegar para a pasta da API
cd BAALogistica.API

# Executar a aplicação
dotnet run
```

**A API estará rodando em:** `http://localhost:5000` ou `https://localhost:5001`

**Swagger/OpenAPI disponível em:** `http://localhost:5000/swagger`

### 2️⃣ Configurar o Frontend (React)

Em outro terminal:

```bash
# Navegue até a pasta do frontend
cd baa-logistica-frontend

# Instalar dependências
npm install

# Executar a aplicação
npm run dev
```

**O Frontend estará rodando em:** `http://localhost:5173`

## 📊 Banco de Dados

O banco de dados SQLite será criado automaticamente na primeira execução em:
```
BAALogistica/BAALogistica.API/baalogistica.db
```

### Dados Iniciais (Seed Data)

O sistema já vem com alguns dados de exemplo:
- 1 Cliente de exemplo
- 1 Motorista ativo
- 1 Veículo disponível

## 🔍 Testando o Sistema

### Via Swagger (Backend)
1. Acesse `http://localhost:5000/swagger`
2. Teste os endpoints diretamente pela interface

### Via Interface (Frontend)
1. Acesse `http://localhost:5173`
2. Navegue pelos menus:
   - **Dashboard**: Visão geral do sistema
   - **Motoristas**: Gerenciar motoristas
   - **Veículos**: Gerenciar frota
   - **Cargas**: Gerenciar cargas
   - **Viagens**: Gerenciar viagens
   - **Clientes**: Gerenciar clientes

## 📁 Estrutura do Projeto

```
BAALogistica/
├── BAALogistica.API/          # API REST
├── BAALogistica.Domain/       # Entidades de domínio
└── BAALogistica.Infrastructure/  # Banco de dados e repositórios

baa-logistica-frontend/
├── src/
│   ├── components/            # Componentes React
│   ├── pages/                 # Páginas principais
│   ├── services/              # Serviços de API
│   └── utils/                 # Utilitários
```

## ⚙️ Configurações Importantes

### Backend - appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=baalogistica.db"
  }
}
```

### Frontend - src/services/api.js
```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});
```

**⚠️ IMPORTANTE:** Se a porta do backend for diferente, ajuste a `baseURL` no arquivo `api.js`

## 🔧 Problemas Comuns

### Erro de CORS
Se houver erro de CORS, verifique se o CORS está configurado no `Program.cs`:
```csharp
app.UseCors("AllowReactApp");
```

### Banco de Dados não Cria
Execute manualmente:
```bash
cd BAALogistica.API
dotnet ef database update
```

### Porta já em Uso
Altere a porta no arquivo `launchSettings.json` (Backend) ou `vite.config.js` (Frontend)

## 📦 Funcionalidades Implementadas

✅ CRUD completo de Motoristas  
✅ CRUD completo de Veículos  
✅ CRUD completo de Cargas  
✅ CRUD completo de Viagens  
✅ CRUD completo de Clientes  
✅ Dashboard com estatísticas  
✅ Filtros e busca  
✅ Validações de dados  
✅ Relacionamentos entre entidades  
✅ Interface responsiva  

## 🎓 Próximos Passos (Melhorias Futuras)

1. **Autenticação e Autorização**
   - Login de usuários
   - Controle de permissões por perfil

2. **Relatórios Avançados**
   - Exportação para PDF/Excel
   - Gráficos mais detalhados

3. **Rastreamento em Tempo Real**
   - Integração com GPS
   - Mapa de localização das viagens

4. **Notificações**
   - Alertas de manutenção preventiva
   - Avisos de CNH vencida

5. **Mobile App**
   - App para motoristas
   - Registro de despesas em viagem

## 📞 Suporte

Para dúvidas sobre o projeto acadêmico, entre em contato com:
- **Professor:** Thiago Giroto Milani
- **Instituição:** Centro Universitário da Fundação Herminio Ometto
- **Curso:** Engenharia da Computação

## 📄 Licença

Projeto acadêmico desenvolvido para a empresa B.A.A Logística como parte da atividade de extensão universitária.

---

**Desenvolvido por:** Alunos do curso de Engenharia da Computação  
**Ano:** 2025  
**Versão:** 1.0.0