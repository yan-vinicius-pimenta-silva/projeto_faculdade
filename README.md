# 📋 Guia de Execução - Sistema B.A.A Logística

## 🎯 Requisitos

- **.NET 8 SDK** - [Download](https://dotnet.microsoft.com/download)
- **Node.js** (v18 ou superior) - [Download](https://nodejs.org/)
- **Editor de código** (Visual Studio Code recomendado)

## 🚀 Passo a Passo para Executar

### 1️⃣ Configurar o Backend (.NET)

```bash
# Navegue até a pasta do backend
cd baa-logistica-backend/BAALogistica.API

# Restaurar dependências (primeira vez)
dotnet restore

# Executar a aplicação em HTTP (desenvolvimento)
dotnet run --launch-profile http

# OU em HTTPS (produção)
dotnet run --launch-profile https
```

**A API estará rodando em:**
- HTTP: `http://localhost:5165`
- HTTPS: `https://localhost:7094`

**Swagger/OpenAPI disponível em:** `http://localhost:5165/swagger`

### 2️⃣ Configurar o Frontend (React + Vite)

Em outro terminal:

```bash
# Navegue até a pasta do frontend
cd baa-logistica-frontend

# Instalar dependências (primeira vez)
npm install

# Executar a aplicação
npm run dev
```

**O Frontend estará rodando em:** `http://localhost:5173`

## 🔐 Autenticação

O sistema possui autenticação completa com JWT (JSON Web Token).

### Credenciais Padrão

Na primeira execução, um usuário administrador é criado automaticamente:

- **Login:** `admin`
- **Senha:** `admin123`
- **Perfil:** Admin

### Endpoints de Autenticação

- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter dados do usuário logado
- `POST /api/auth/alterar-senha` - Alterar senha

### Fluxo de Autenticação

1. Usuário faz login com credenciais
2. Sistema retorna um token JWT válido por 8 horas
3. Token é armazenado no localStorage
4. Token é enviado automaticamente em todas as requisições
5. Rotas protegidas só são acessíveis com token válido

## 📊 Banco de Dados

O banco de dados SQLite será criado automaticamente na primeira execução em:
```
baa-logistica-backend/BAALogistica.API/baalogistica.db
```

### Dados Iniciais (Seed Data)

O sistema já vem com alguns dados de exemplo:
- **1 Usuário Admin** (login: admin, senha: admin123)
- **1 Cliente de exemplo**
- **1 Motorista ativo**
- **1 Veículo disponível**

## 🔍 Testando o Sistema

### Via Swagger (Backend)

1. Acesse `http://localhost:5165/swagger`
2. Primeiro faça login usando o endpoint `/api/auth/login`
3. Copie o token retornado
4. Clique em "Authorize" no Swagger
5. Cole o token no formato: `Bearer {seu-token}`
6. Agora pode testar os endpoints protegidos

### Via Interface (Frontend)

1. Acesse `http://localhost:5173`
2. Você será redirecionado automaticamente para a tela de login
3. Entre com as credenciais padrão (admin/admin123)
4. Navegue pelos menus:
   - **Dashboard**: Visão geral do sistema
   - **Motoristas**: Gerenciar motoristas
   - **Veículos**: Gerenciar frota
   - **Clientes**: Gerenciar clientes
   - **Cargas**: Gerenciar cargas
   - **Viagens**: Gerenciar viagens
5. Use o botão "🔑 Alterar Senha" para mudar sua senha
6. Use o botão "🚪 Sair" para fazer logout

## 📁 Estrutura do Projeto

```
baa-logistica-backend/
├── BAALogistica.API/               # API REST
│   ├── Controllers/                # Controladores da API
│   │   ├── AuthController.cs       # Autenticação
│   │   ├── MotoristasController.cs
│   │   ├── VeiculosController.cs
│   │   └── ...
│   ├── DTOs/                       # Data Transfer Objects
│   └── Program.cs                  # Configuração da aplicação
├── BAALogistica.Domain/            # Entidades de domínio
│   └── Entities/
│       ├── Usuario.cs              # Entidade de usuário
│       ├── Motorista.cs
│       └── ...
└── BAALogistica.Infrastructure/    # Banco de dados
    └── Data/
        └── AppDbContext.cs         # Contexto do EF Core

baa-logistica-frontend/
├── src/
│   ├── components/                 # Componentes React
│   │   ├── Navbar.jsx              # Barra de navegação
│   │   └── PrivateRoute.jsx        # Proteção de rotas
│   ├── contexts/
│   │   └── AuthContext.jsx         # Contexto de autenticação
│   ├── pages/                      # Páginas principais
│   │   ├── Login.jsx               # Tela de login
│   │   ├── Dashboard.jsx           # Dashboard principal
│   │   ├── AlterarSenha.jsx        # Alterar senha
│   │   ├── Motoristas.jsx
│   │   └── ...
│   ├── services/                   # Serviços de API
│   │   ├── api.js                  # Configuração Axios
│   │   ├── authService.js          # Serviço de autenticação
│   │   └── motoristasService.js
│   └── App.jsx                     # Rotas da aplicação
└── .env.development                # Variáveis de ambiente
```

## ⚙️ Configurações Importantes

### Backend - appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=baalogistica.db"
  },
  "Jwt": {
    "Key": "ChaveSecretaSuperSegura123!@#MinhaAPIBAALogistica2024",
    "Issuer": "BAALogisticaAPI",
    "Audience": "BAALogisticaApp"
  }
}
```

### Frontend - .env.development
```env
VITE_API_URL=http://localhost:5165/api
```

**⚠️ IMPORTANTE:** Se a porta do backend for diferente, ajuste a `VITE_API_URL`

### Frontend - src/services/api.js
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5165/api',
});

// O token é adicionado automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🔧 Problemas Comuns

### 1. Erro de CORS
**Sintoma:** Erro "blocked by CORS policy"

**Solução:** Verifique se o CORS está configurado no `Program.cs`:
```csharp
app.UseCors(); // Deve vir ANTES de app.UseHttpsRedirection()
```

### 2. Erro de Autenticação (401 Unauthorized)
**Sintoma:** Requisições retornam erro 401

**Soluções:**
- Verifique se fez login corretamente
- Verifique se o token está sendo enviado (veja no DevTools > Network > Headers)
- Token pode ter expirado (válido por 8 horas)

### 3. Banco de Dados não Cria
**Sintoma:** Erro ao acessar o banco

**Solução:**
```bash
cd BAALogistica.API
# Deletar o banco antigo
del baalogistica.db
# Rodar novamente - será criado automaticamente
dotnet run --launch-profile http
```

### 4. Frontend não conecta na API
**Sintoma:** Erro de conexão, status 0

**Soluções:**
- Verifique se a API está rodando
- Confirme a porta correta no `.env.development`
- Verifique se não está com HTTPS redirection ativo

### 5. Pacotes NuGet com erro de versão
**Sintoma:** Erro de incompatibilidade de versão

**Solução:**
```bash
cd BAALogistica.API
dotnet remove package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.10
```

## 📦 Funcionalidades Implementadas

### ✅ Sistema de Autenticação
- [x] Login com usuário e senha
- [x] JWT Token (válido por 8 horas)
- [x] Rotas protegidas
- [x] Logout
- [x] Alterar senha
- [x] Perfis de usuário (Admin, Usuario, Operador)
- [x] Redirecionamento automático para login

### ✅ Gestão de Motoristas
- [x] CRUD completo (Create, Read, Update, Delete)
- [x] Validação de CPF e CNH únicos
- [x] Validação de CNH vencida
- [x] Filtros por status e busca
- [x] Listagem de motoristas disponíveis

### ✅ Gestão de Veículos
- [x] CRUD completo
- [x] Controle de status (Disponível, Em Viagem, Manutenção)
- [x] Registro de manutenções
- [x] Validação de placa única

### ✅ Gestão de Cargas
- [x] CRUD completo
- [x] Vínculo com clientes
- [x] Histórico de status
- [x] Número de protocolo único

### ✅ Gestão de Viagens
- [x] CRUD completo
- [x] Vínculo motorista + veículo + carga
- [x] Controle de status
- [x] Registro de despesas
- [x] Cálculo de valores

### ✅ Gestão de Clientes
- [x] CRUD completo
- [x] Validação de CNPJ/CPF
- [x] Histórico de cargas

### ✅ Interface
- [x] Dashboard com estatísticas
- [x] Design moderno e responsivo
- [x] Feedback visual de ações
- [x] Filtros e buscas
- [x] Validações em tempo real

## 🎓 Arquitetura e Tecnologias

### Backend
- **Framework:** ASP.NET Core 8.0
- **ORM:** Entity Framework Core
- **Banco de Dados:** SQLite
- **Autenticação:** JWT (JSON Web Token)
- **Hash de Senha:** BCrypt
- **Documentação:** Swagger/OpenAPI

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Roteamento:** React Router v6
- **HTTP Client:** Axios
- **Gerenciamento de Estado:** Context API
- **Estilização:** CSS Modules

### Padrões e Boas Práticas
- Clean Architecture
- Repository Pattern
- Dependency Injection
- DTOs (Data Transfer Objects)
- RESTful API
- SPA (Single Page Application)

## 🚀 Próximos Passos (Melhorias Futuras)

1. **Gestão de Usuários (Admin)**
   - [ ] CRUD de usuários
   - [ ] Controle de permissões granular
   - [ ] Registro de atividades (logs)

2. **Relatórios Avançados**
   - [ ] Exportação para PDF/Excel
   - [ ] Gráficos mais detalhados
   - [ ] Relatórios customizáveis

3. **Rastreamento em Tempo Real**
   - [ ] Integração com GPS
   - [ ] Mapa de localização das viagens
   - [ ] Previsão de chegada

4. **Notificações**
   - [ ] Alertas de manutenção preventiva
   - [ ] Avisos de CNH vencida
   - [ ] Notificações push

5. **Mobile App**
   - [ ] App para motoristas
   - [ ] Registro de despesas em viagem
   - [ ] Check-in/Check-out

6. **Integrações**
   - [ ] API de cálculo de rotas (Google Maps)
   - [ ] Integração com ERP
   - [ ] API de consulta de veículos (DETRAN)

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
**Versão:** 2.0.0 (com Sistema de Autenticação)

## 🎯 Changelog

### v2.0.0 - Sistema de Autenticação
- ✅ Implementado sistema completo de login/logout
- ✅ JWT para sessões seguras
- ✅ Rotas protegidas no frontend
- ✅ Alteração de senha
- ✅ Perfis de usuário

### v1.0.0 - Versão Inicial
- ✅ CRUD de todas as entidades
- ✅ Interface responsiva
- ✅ Dashboard com estatísticas
```

---

## ✅ Alterações Principais:

1. ✅ **Adicionada seção de Autenticação** com credenciais padrão
2. ✅ **Portas corretas** (5165 para HTTP, 7094 para HTTPS)
3. ✅ **Endpoints de autenticação** documentados
4. ✅ **Fluxo de autenticação** explicado
5. ✅ **Estrutura de pastas atualizada** com novos arquivos
6. ✅ **Problemas comuns de autenticação** adicionados
7. ✅ **Funcionalidades de auth marcadas como implementadas**
8. ✅ **Tecnologias de autenticação** (JWT, BCrypt) listadas
9. ✅ **Changelog** com versão 2.0.0
10. ✅ **Instruções de teste via Swagger** com autenticação

📝🚀
