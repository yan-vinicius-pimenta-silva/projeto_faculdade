# 🚚 B.A.A Logística – Sistema de Gestão de Transporte

Um sistema acadêmico completo para gestão de cargas, frota e operações logísticas. O projeto é composto por uma **API ASP.NET Core 8** e um **frontend React + Vite**, entregando autenticação com JWT, dashboards operacionais e fluxos administrativos para motoristas, veículos, clientes, cargas e viagens.

## 📚 Sumário

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Pré-requisitos](#-pré-requisitos)
- [Guia Rápido de Execução](#-guia-rápido-de-execução)
  - [Backend (.NET)](#backend-net)
  - [Frontend (React)](#frontend-react)
- [Configuração de Ambiente](#-configuração-de-ambiente)
- [Banco de Dados e Seed](#-banco-de-dados-e-seed)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Principais Funcionalidades](#-principais-funcionalidades)
- [Endpoints Essenciais](#-endpoints-essenciais)
- [Testes e Qualidade](#-testes-e-qualidade)
- [Resolução de Problemas](#-resolução-de-problemas)
- [Créditos e Licença](#-créditos-e-licença)

## 🎯 Visão Geral

- **Objetivo:** apoiar operações da empresa fictícia B.A.A Logística com cadastros completos, planejamento de viagens e acompanhamento de cargas.
- **Usuários-alvo:** equipes administrativas e operacionais com perfis diferenciados (Admin e Usuário).
- **Autenticação:** JWT com expiração de 8 horas, armazenamento no `localStorage` e rotas protegidas no frontend.

> Na primeira execução o projeto já está pronto para uso: basta subir a API, iniciar o frontend e autenticar com as credenciais padrão listadas abaixo.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────┐
│ Frontend (React + Vite)            │
│ - Interface SPA                    │
│ - Context API para autenticação    │
│ - Axios para comunicação REST      │
└──────────────┬──────────────────────┘
               │ HTTP/JSON
┌──────────────▼──────────────────────┐
│ BAALogistica.API (ASP.NET Core)     │
│ - Controllers RESTful               │
│ - Swagger/OpenAPI                   │
│ - Autenticação + Autorização JWT   │
└──────────────┬──────────────────────┘
               │ Usa
┌──────────────▼──────────────────────┐
│ Domain & Infrastructure (.NET)     │
│ - Entidades e Regras de Negócio    │
│ - EF Core + SQLite                 │
│ - Seed inicial completo            │
└─────────────────────────────────────┘
```

## 🧰 Tecnologias Utilizadas

### Backend

- ASP.NET Core 8 (Web API)
- Entity Framework Core + SQLite
- JWT Bearer Authentication
- BCrypt para hash de senha
- Swagger/OpenAPI para documentação

### Frontend

- React 18 com Vite
- React Router DOM v6
- Context API para sessão
- Axios para chamadas HTTP
- Tailwind CSS + CSS Modules
- Lucide Icons e date-fns

## ✅ Pré-requisitos

| Tecnologia | Versão recomendada    | Download                                                               |
| ---------- | --------------------- | ---------------------------------------------------------------------- |
| .NET SDK   | 8.x                   | [dotnet.microsoft.com/download](https://dotnet.microsoft.com/download) |
| Node.js    | >= 18                 | [nodejs.org](https://nodejs.org/)                                      |
| npm        | incluído com Node     | –                                                                      |
| Editor     | VS Code (recomendado) | [code.visualstudio.com](https://code.visualstudio.com/)                |

> **Dica:** em ambientes Windows, execute o terminal como administrador para permitir que o SQLite crie o arquivo `baalogistica.db` sem restrições de permissão.

## ⚡ Guia Rápido de Execução

Abra dois terminais separados – um para o backend e outro para o frontend.

### Backend (.NET)

```bash
cd baa-logistica-backend/BAALogistica.API

dotnet restore         # instala dependências

dotnet run --launch-profile http   # executa em http://localhost:5165
# ou: dotnet run --launch-profile https  -> https://localhost:7094
```

A API expõe o Swagger em `http://localhost:5165/swagger`.

### Frontend (React)

```bash
cd baa-logistica-frontend

npm install    # instala dependências
npm run dev    # roda em http://localhost:5173
```

O Vite exibirá um QR code e URLs alternativas caso deseje testar em dispositivos móveis na mesma rede.

## 🛠️ Configuração de Ambiente

| Variável/AppSetting                   | Descrição                         | Default                                                 | Onde configurar                                                                   |
| ------------------------------------- | --------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `ConnectionStrings:DefaultConnection` | Caminho do SQLite                 | `baalogistica.db`                                       | `appsettings.json` ou variável de ambiente `ConnectionStrings__DefaultConnection` |
| `Jwt:Key`                             | Chave secreta para assinar tokens | `ChaveSecretaSuperSegura123!@#MinhaAPIBAALogistica2024` | `appsettings.*.json` ou `Jwt__Key`                                                |
| `Jwt:Issuer`                          | Emissor válido                    | `BAALogisticaAPI`                                       | `Jwt__Issuer`                                                                     |
| `Jwt:Audience`                        | Audiência válida                  | `BAALogisticaApp`                                       | `Jwt__Audience`                                                                   |

Para ambientes produtivos, substitua os valores padrão via variáveis de ambiente antes de publicar a API. O ASP.NET Core já converte `:` em `__` automaticamente.

## 🗄️ Banco de Dados e Seed

- O SQLite é criado automaticamente ao iniciar a API (`EnsureCreated`).
- Dados iniciais garantem uma experiência pronta para demonstração:
  - **Usuário Admin:** login `admin` / senha `admin123`
  - **Usuário Operacional:** login `usuario` / senha `usuario123`
  - Cliente, motorista, veículo, carga e viagem de exemplo
- Para resetar o banco local basta excluir os arquivos `baalogistica.db` e `baalogistica.db-wal` na pasta `BAALogistica.API` e reiniciar a aplicação.

## 🧾 Scripts Disponíveis

### Backend

- `dotnet restore` – instala dependências.
- `dotnet run --launch-profile http|https` – executa a API.
- `dotnet watch run` – hot reload (caso tenha o .NET SDK completo instalado).

### Frontend

- `npm run dev` – modo desenvolvimento com hot reload.
- `npm run build` – build de produção em `dist/`.
- `npm run preview` – serve o build gerado.
- `npm run lint` – análise estática com ESLint.

## 🗂️ Estrutura do Projeto

```
projeto_faculdade/
├── README.md                     # Este guia
├── baa-logistica-backend/
│   ├── BAALogistica.API/         # Web API (Controllers, DTOs, Program.cs)
│   ├── BAALogistica.Domain/      # Entidades e regras de negócio
│   └── BAALogistica.Infrastructure/  # DbContext, configurações EF Core e seed
└── baa-logistica-frontend/
    ├── src/                      # Páginas, componentes, hooks e serviços Axios
    ├── public/                   # Assets estáticos
    └── vite.config.js            # Configuração do bundler
```

## 🚀 Principais Funcionalidades

- Autenticação com JWT (login, logout, alteração de senha)
- Gestão de usuários (cadastro, redefinição de senha, ativação/desativação)
- CRUD completo de clientes, motoristas, veículos e cargas
- Planejamento de viagens com vínculo motorista + veículo + carga
- Registro de despesas de viagem e histórico de status das cargas
- Dashboard com indicadores operacionais
- Interface responsiva com feedback visual e filtros

## 🔗 Endpoints Essenciais

| Método                      | Rota                                                                               | Descrição                                             |
| --------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `POST`                      | `/api/auth/login`                                                                  | Autentica usuário e retorna JWT                       |
| `GET`                       | `/api/auth/me`                                                                     | Retorna dados do usuário logado                       |
| `POST`                      | `/api/auth/alterar-senha`                                                          | Permite troca de senha pelo próprio usuário           |
| `GET`                       | `/api/usuarios`                                                                    | Lista usuários (necessário token e perfil autorizado) |
| `POST`                      | `/api/usuarios`                                                                    | Cria novo usuário (somente Admin)                     |
| `PUT`                       | `/api/usuarios/{id}/senha`                                                         | Redefine senha de um usuário                          |
| `PATCH`/`PUT`               | `/api/usuarios/{id}/status`                                                        | Ativa ou desativa login de um usuário                 |
| `GET`                       | `/api/dashboard`                                                                   | Indicadores gerais para o painel                      |
| `GET`/`POST`/`PUT`/`DELETE` | `/api/clientes`, `/api/motoristas`, `/api/veiculos`, `/api/cargas`, `/api/viagens` | CRUDs principais                                      |

Para explorar todos os endpoints, utilize o Swagger ou o arquivo `BAALogistica.API.http` (VS Code/Visual Studio).

## 🧪 Testes e Qualidade

- O projeto ainda não possui suíte automatizada de testes. Recomenda-se iniciar com testes de unidade para regras de negócio e testes de integração para os controllers.
- Utilize `npm run lint` para manter o frontend aderente às regras de estilo e `dotnet format` (caso instalado) para padronização do backend.

## 🆘 Resolução de Problemas

| Sintoma                                     | Possível causa                                                       | Solução                                                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `404` ao tentar atualizar status de usuário | API não estava em execução ou requisição enviada para o verbo errado | Confirme que o backend está rodando em `http://localhost:5165` e envie `PUT` ou `PATCH` para `/api/usuarios/{id}/status` |
| `SQLITE_BUSY` ou arquivo bloqueado          | Banco em uso por outro processo                                      | Feche instâncias anteriores e reinicie a API. Em último caso, exclua os arquivos `.db` e `.db-wal`                       |
| `401 Unauthorized` nas rotas protegidas     | Token expirado ou ausente                                            | Faça login novamente e garanta que o header `Authorization: Bearer <token>` está presente                                |
| Falha ao instalar dependências Node         | Cache corrompido                                                     | Rode `npm cache clean --force` e tente `npm install` novamente                                                           |

## 👥 Créditos e Licença

Projeto acadêmico desenvolvido pelos alunos do curso de Engenharia da Computação (Yan Vinícius Pimenta Silva, Lucas Gabriel Risso, Isadora Vischi da Cruz, Anthony Kewin Pinto e Bruno Otávio Passini) (FHO) para a empresa parceira B.A.A Logística.

- **Professor orientador:** Thiago Giroto Milani
- **Ano:** 2025
- **Versão atual:** 2.0.0 (inclui sistema de autenticação)

Distribuído para fins educacionais. Adapte conforme necessário para produção, substituindo segredos, adicionando migrations e configurando logs persistentes.
