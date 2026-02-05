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

## 🗄️ Estrutura do Banco de Dados SQLite em Detalhes

O arquivo `baalogistica.db` fica na raiz do projeto da API e é criado automaticamente na primeira execução graças ao `EnsureCreated()` configurado em `Program.cs`. O contexto `AppDbContext` mapeia cada entidade do domínio para uma tabela com validações e relacionamentos explícitos. A seguir, um panorama tabela a tabela:

| Tabela                  | Finalidade                                                                                              | Campos-chave                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Usuarios`              | Controla autenticação e perfis. Seed inicial cria o usuário `admin` com senha criptografada via BCrypt. | Índices únicos em `Login` e `Email` garantem unicidade; campos `Perfil`, `Ativo` e `DataUltimoAcesso` alimentam as regras de acesso.                                        |
| `Clientes`              | Cadastro de embarcadores/contratantes.                                                                  | Índices únicos para `CNPJ` e `CPF`; colunas de endereço e contato dão suporte ao front na coleta de dados completos.                                                        |
| `Motoristas`            | Registro da equipe de transporte.                                                                       | Índices únicos em `CPF` e `CNH`, índice em `Status` para consultas rápidas por disponibilidade.                                                                             |
| `Veiculos`              | Frota de caminhões/carretas.                                                                            | Índice único em `Placa` e índice em `Status`. Campos `CapacidadeCarga` e `CapacidadeVolume` usam `decimal(10,2)` para precisão.                                             |
| `Cargas`                | Ordens de transporte vinculadas a clientes.                                                             | Chave estrangeira obrigatória para `ClienteId` (delete restrito). Campos de datas, volume e endereço suportam toda a jornada da carga.                                      |
| `Viagens`               | Programações de rota por carga.                                                                         | FKs para `Carga`, `Veiculo` e `Motorista` (delete restrito) e índices que aceleram filtros por status. Guarda dados operacionais como quilometragens e previsão de chegada. |
| `DespesasViagem`        | Controle financeiro por viagem.                                                                         | FK cascata com `Viagens`, registrando tipo, valor e data da despesa.                                                                                                        |
| `Manutencoes`           | Histórico de manutenção da frota.                                                                       | FK cascata com `Veiculos`, incluindo custo, quilometragem e próxima manutenção.                                                                                             |
| `HistoricoStatusCargas` | Log de mudança de status das cargas.                                                                    | FK cascata com `Cargas`, registra status anterior, novo e observações.                                                                                                      |

### Relacionamentos principais

- **Cliente 1:N Carga:** cada carga aponta para um cliente, e o delete é restrito para evitar perda de histórico involuntária.
- **Carga 1:N Viagem:** uma carga pode ter diversas viagens (ex.: reentregas). A deleção é restrita, preservando integridade operacional.
- **Motorista/Veículo 1:N Viagem:** garante rastreabilidade de quem executou a viagem e com qual veículo.
- **Viagem 1:N DespesaViagem:** facilita projeção de custos agregados por roteiro.
- **Veículo 1:N Manutencao** e **Carga 1:N HistoricoStatusCarga:** armazenam histórico técnico e de rastreio.

Todos os relacionamentos e restrições aparecem tanto nas configurações fluentes do `AppDbContext` quanto no schema real do SQLite (`.schema`). Além disso, o contexto define valores padrão (`HasDefaultValue`) para status e aplica tipos `decimal(12,2)` quando a precisão financeira é necessária, evitando arredondamentos indesejados.

### Semeadura inicial (Seed)

A rotina `SeedData` pré-carrega o banco com:

- Usuário administrador (`admin/admin123`) com cargo e perfil de administrador.
- Um cliente, motorista e veículo base, todos datados de 2024 para testes.

Essa semente usa `BCrypt` para armazenar a senha de forma segura, e datas em UTC para consistência.

### Cuidados operacionais

- **Criação automática:** `EnsureCreated` dispensa migrations em cenários de demonstração, mas em produção recomenda-se substituí-lo por `Database.Migrate()` para versionar o schema.
- **WAL Mode:** o arquivo `baalogistica.db-wal` indica que o SQLite está usando _Write-Ahead Logging_, melhorando concorrência para múltiplas conexões simultâneas.
- **Índices estratégicos:** consultas frequentes (por exemplo, filtros por status no dashboard) se beneficiam dos índices adicionados pelo EF Core (`HasIndex`), reduzindo latência em dispositivos modestos.

---

## 🔁 Fluxo de Requisições e Uso do Banco

1. **Autenticação:** `AuthController` verifica o login consultando `Usuarios` e validando a senha com BCrypt. Caso seja bem sucedido, atualiza `DataUltimoAcesso` e emite um JWT com `Perfil` como claim de autorização.
2. **CRUDs principais:** os controladores de `Clientes`, `Motoristas`, `Veiculos`, `Cargas` e `Viagens` usam diretamente o `AppDbContext` para consultar e persistir dados. As validações de unicidade do SQLite retornam erros tratáveis no backend (por exemplo, tentativa de cadastrar CPF duplicado).
3. **Dashboard:** o `DashboardController` agrega dados com `GroupBy` e projeções Linq, fazendo uso dos índices de status para relatórios ágeis.
4. **Históricos:** alterações de status de carga ou de viagens geram registros auxiliares (`HistoricoStatusCargas`, `DespesasViagem`) garantindo rastreabilidade operacional e financeira.

Por ser um banco embarcado, todas as operações ocorrem em um único arquivo, o que facilita deploy em ambientes simples (ex.: demonstrações em laboratório). Contudo, a modelagem já está pronta para ser migrada para SQL Server ou PostgreSQL alterando apenas a connection string e o provider EF Core.

---
