namespace BAALogistica.Domain.Entities;

public class Viagem
{
    public int Id { get; set; }
    public string NumeroViagem { get; set; } = string.Empty;
    public int CargaId { get; set; }
    public int VeiculoId { get; set; }
    public int MotoristaId { get; set; }
    public DateTime? DataSaida { get; set; }
    public DateTime? DataPrevisaoChegada { get; set; }
    public DateTime? DataChegadaReal { get; set; }
    public int? KmInicial { get; set; }
    public int? KmFinal { get; set; }
    public int? DistanciaPercorrida { get; set; }
    public decimal? ValorFrete { get; set; }
    public string Status { get; set; } = "Planejada";
    public string? Observacoes { get; set; }
    public DateTime DataCadastro { get; set; } = DateTime.Now;
    public DateTime DataAtualizacao { get; set; } = DateTime.Now;

    // Relacionamentos
    public Carga Carga { get; set; } = null!;
    public Veiculo Veiculo { get; set; } = null!;
    public Motorista Motorista { get; set; } = null!;
    public ICollection<DespesaViagem> Despesas { get; set; } = new List<DespesaViagem>();
}