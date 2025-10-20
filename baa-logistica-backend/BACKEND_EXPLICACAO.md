# Explicação do Projeto BAALogistica - Backend .NET

## 🎯 Visão Geral do Projeto

Este é um projeto **ASP.NET Core Web API** (.NET 8.0) que segue a **arquitetura em camadas** (Clean Architecture), dividido em três projetos principais:

1. **BAALogistica.API** - Camada de Apresentação (Web API)
2. **BAALogistica.Domain** - Camada de Domínio (Regras de negócio)
3. **BAALogistica.Infrastructure** - Camada de Infraestrutura (Acesso a dados)

---

## 📁 BAALogistica.API - Explicação Detalhada

Este é o **ponto de entrada** da aplicação, responsável por expor os endpoints da API REST que serão consumidos pelo frontend React.

### **Estrutura de Pastas e Arquivos:**

#### **📂 Controllers** 
Contém os controladores da API que definem os endpoints HTTP:

- **AuthController.cs** - Autenticação (login, registro, alteração de senha)
- **CargasController.cs** - CRUD de cargas/encomendas
- **ClientesController.cs** - Gerenciamento de clientes
- **DashboardController.cs** - Dados consolidados para dashboard
- **MotoristasController.cs** - Gerenciamento de motoristas
- **VeiculosController.cs** - Gerenciamento de veículos
- **ViagensController.cs** - Controle de viagens/rotas

#### **📂 DTOs** (Data Transfer Objects)
Objetos usados para transferir dados entre frontend e backend:

- **AlterarSenhaRequest.cs** - Dados para alterar senha
- **LoginRequest.cs** - Credenciais de login (email/senha)
- **LoginResponse.cs** - Resposta do login (token JWT, dados do usuário)

#### **📂 Properties**
- **launchsettings.json** - Configurações de execução do projeto (portas, ambiente, etc.)

#### **📂 bin / obj**
Pastas de build do .NET (artefatos compilados e temporários)

#### **📄 Arquivos de Configuração:**

- **appsettings.json** - Configurações gerais (connection string, JWT, etc.)
- **appsettings.Development.json** - Configurações específicas do ambiente de desenvolvimento
- **BAALogistica.API.csproj** - Arquivo de projeto .NET (dependências, target framework)
- **BAALogistica.API.http** - Arquivo para testar endpoints HTTP (usado no Visual Studio/VS Code)

#### **📄 Arquivos Principais:**

- **Program.cs** - Ponto de entrada da aplicação, onde configura-se:
  - Injeção de dependências
  - Middleware
  - CORS
  - Autenticação JWT
  - Swagger/OpenAPI
  - Entity Framework

- **baalogistica.db** - Banco de dados SQLite local

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────┐
│   Frontend (React)                  │
│   - Interfaces do usuário           │
└──────────────┬──────────────────────┘
               │ HTTP/REST
┌──────────────▼──────────────────────┐
│   BAALogistica.API                  │
│   - Controllers (Endpoints)         │
│   - DTOs                            │
│   - Autenticação/Autorização        │
└──────────────┬──────────────────────┘
               │ Usa
┌──────────────▼──────────────────────┐
│   BAALogistica.Domain               │
│   - Entidades (Models)              │
│   - Interfaces (Contratos)          │
│   - Regras de negócio               │
└──────────────┬──────────────────────┘
               │ Implementado por
┌──────────────▼──────────────────────┐
│   BAALogistica.Infrastructure       │
│   - DbContext (Entity Framework)    │
│   - Repositórios                    │
│   - Migrations                      │
└─────────────────────────────────────┘
```

---

## 🔑 Funcionalidades Principais

Pelo que vejo nos Controllers, o sistema gerencia:

✅ **Autenticação** - Login com JWT  
✅ **Clientes** - Cadastro e gestão de clientes  
✅ **Motoristas** - Controle de motoristas  
✅ **Veículos** - Gestão de frota  
✅ **Cargas** - Gerenciamento de mercadorias  
✅ **Viagens** - Controle de rotas e entregas  
✅ **Dashboard** - Indicadores e métricas  

---

## 📊 Tecnologias Identificadas

- **.NET 8.0** - Framework principal
- **ASP.NET Core Web API** - Para criar a API REST
- **Entity Framework Core** - ORM para acesso ao banco
- **SQLite** - Banco de dados (arquivo .db)
- **JWT** - Autenticação baseada em tokens
- **Swagger/OpenAPI** - Documentação da API

---


