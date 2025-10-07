// ============================================
// BAALogistica.Infrastructure/Data/AppDbContext.cs
// ============================================
using BAALogistica.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BAALogistica.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Motorista> Motoristas { get; set; }
    public DbSet<Veiculo> Veiculos { get; set; }
    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Carga> Cargas { get; set; }
    public DbSet<Viagem> Viagens { get; set; }
    public DbSet<Manutencao> Manutencoes { get; set; }
    public DbSet<DespesaViagem> DespesasViagem { get; set; }
    public DbSet<HistoricoStatusCarga> HistoricoStatusCargas { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuração de Motorista
        modelBuilder.Entity<Motorista>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CPF).IsRequired().HasMaxLength(14);
            entity.Property(e => e.CNH).IsRequired().HasMaxLength(20);
            entity.Property(e => e.CategoriaCNH).IsRequired().HasMaxLength(5);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Ativo");
            
            entity.HasIndex(e => e.CPF).IsUnique();
            entity.HasIndex(e => e.CNH).IsUnique();
            entity.HasIndex(e => e.Status);
        });

        // Configuração de Veiculo
        modelBuilder.Entity<Veiculo>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Placa).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Modelo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Marca).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TipoVeiculo).IsRequired().HasMaxLength(30);
            entity.Property(e => e.CapacidadeCarga).HasColumnType("decimal(10,2)");
            entity.Property(e => e.CapacidadeVolume).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Disponível");
            
            entity.HasIndex(e => e.Placa).IsUnique();
            entity.HasIndex(e => e.Status);
        });

        // Configuração de Cliente
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RazaoSocial).IsRequired().HasMaxLength(150);
            entity.Property(e => e.NomeFantasia).HasMaxLength(150);
            entity.Property(e => e.CNPJ).HasMaxLength(18);
            entity.Property(e => e.CPF).HasMaxLength(14);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Ativo");
            
            entity.HasIndex(e => e.CNPJ).IsUnique();
            entity.HasIndex(e => e.CPF).IsUnique();
        });

        // Configuração de Carga
        modelBuilder.Entity<Carga>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.NumeroProtocolo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TipoCarga).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DescricaoCarga).IsRequired();
            entity.Property(e => e.PesoCarga).HasColumnType("decimal(10,2)");
            entity.Property(e => e.VolumeCarga).HasColumnType("decimal(10,2)");
            entity.Property(e => e.ValorCarga).HasColumnType("decimal(12,2)");
            entity.Property(e => e.EnderecoColeta).IsRequired().HasMaxLength(200);
            entity.Property(e => e.EnderecoEntrega).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("Aguardando");
            
            entity.HasIndex(e => e.NumeroProtocolo).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ClienteId);

            entity.HasOne(e => e.Cliente)
                .WithMany(c => c.Cargas)
                .HasForeignKey(e => e.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuração de Viagem
        modelBuilder.Entity<Viagem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.NumeroViagem).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ValorFrete).HasColumnType("decimal(12,2)");
            entity.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("Planejada");
            
            entity.HasIndex(e => e.NumeroViagem).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.MotoristaId);
            entity.HasIndex(e => e.VeiculoId);
            entity.HasIndex(e => e.CargaId);

            entity.HasOne(e => e.Carga)
                .WithMany(c => c.Viagens)
                .HasForeignKey(e => e.CargaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Veiculo)
                .WithMany(v => v.Viagens)
                .HasForeignKey(e => e.VeiculoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Motorista)
                .WithMany(m => m.Viagens)
                .HasForeignKey(e => e.MotoristaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuração de Manutencao
        modelBuilder.Entity<Manutencao>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TipoManutencao).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DescricaoManutencao).IsRequired();
            entity.Property(e => e.ValorManutencao).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Concluída");
            
            entity.HasIndex(e => e.VeiculoId);

            entity.HasOne(e => e.Veiculo)
                .WithMany(v => v.Manutencoes)
                .HasForeignKey(e => e.VeiculoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configuração de DespesaViagem
        modelBuilder.Entity<DespesaViagem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TipoDespesa).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Valor).HasColumnType("decimal(10,2)");
            
            entity.HasIndex(e => e.ViagemId);

            entity.HasOne(e => e.Viagem)
                .WithMany(v => v.Despesas)
                .HasForeignKey(e => e.ViagemId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configuração de HistoricoStatusCarga
        modelBuilder.Entity<HistoricoStatusCarga>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StatusAnterior).HasMaxLength(30);
            entity.Property(e => e.StatusNovo).IsRequired().HasMaxLength(30);
            
            entity.HasIndex(e => e.CargaId);

            entity.HasOne(e => e.Carga)
                .WithMany(c => c.Historicos)
                .HasForeignKey(e => e.CargaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed Data (dados iniciais para teste)
        SeedData(modelBuilder);
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        // Clientes iniciais
        modelBuilder.Entity<Cliente>().HasData(
            new Cliente
            {
                Id = 1,
                RazaoSocial = "Empresa Exemplo LTDA",
                NomeFantasia = "Exemplo Transportes",
                CNPJ = "12.345.678/0001-90",
                Telefone = "(19) 3456-7890",
                Email = "contato@exemplo.com.br",
                Cidade = "Campinas",
                Estado = "SP",
                Status = "Ativo",
                DataCadastro = DateTime.Now
            }
        );

        // Motoristas iniciais
        modelBuilder.Entity<Motorista>().HasData(
            new Motorista
            {
                Id = 1,
                Nome = "João Silva",
                CPF = "123.456.789-00",
                CNH = "12345678900",
                CategoriaCNH = "D",
                ValidadeCNH = DateTime.Now.AddYears(2),
                Telefone = "(19) 98765-4321",
                DataAdmissao = DateTime.Now.AddMonths(-6),
                Status = "Ativo",
                DataCadastro = DateTime.Now
            }
        );

        // Veículos iniciais
        modelBuilder.Entity<Veiculo>().HasData(
            new Veiculo
            {
                Id = 1,
                Placa = "ABC-1234",
                Modelo = "FH 540",
                Marca = "Volvo",
                AnoFabricacao = 2022,
                TipoVeiculo = "Caminhão",
                CapacidadeCarga = 25.0m,
                CapacidadeVolume = 80.0m,
                KmAtual = 45000,
                Status = "Disponível",
                DataAquisicao = DateTime.Now.AddYears(-1),
                DataCadastro = DateTime.Now
            }
        );
    }
}