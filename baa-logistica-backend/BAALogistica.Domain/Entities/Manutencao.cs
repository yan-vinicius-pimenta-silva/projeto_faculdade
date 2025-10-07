// ============================================
// BAALogistica.Domain/Entities/Manutencao.cs
// ============================================
namespace BAALogistica.Domain.Entities;

public class Manutencao
{
    public int Id { get; set; }
    public int VeiculoId { get; set; }
    public string TipoManutencao { get; set; } = string.Empty;
    public string DescricaoManutencao { get; set; } = string.Empty;
    public DateTime DataManutencao { get; set; }
    public int? KmManutencao { get; set; }
    public decimal? ValorManutencao { get; set; }
    public string? Oficina { get; set; }
    public DateTime? ProximaManutencao { get; set; }
    public string Status { get; set; } = "Concluída";
    public string? Observacoes { get; set; }
    public DateTime DataCadastro { get; set; } = DateTime.Now;

    // Relacionamentos
    public Veiculo Veiculo { get; set; } = null!;
}