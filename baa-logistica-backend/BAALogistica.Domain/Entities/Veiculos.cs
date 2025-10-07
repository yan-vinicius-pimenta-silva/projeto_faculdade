namespace BAALogistica.Domain.Entities;

public class Veiculo
{
    public int Id { get; set; }
    public string Placa { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public int AnoFabricacao { get; set; }
    public string TipoVeiculo { get; set; } = string.Empty;
    public decimal CapacidadeCarga { get; set; }
    public decimal? CapacidadeVolume { get; set; }
    public string? Renavam { get; set; }
    public string? Chassi { get; set; }
    public int KmAtual { get; set; }
    public string Status { get; set; } = "Disponível";
    public DateTime? DataAquisicao { get; set; }
    public string? Observacoes { get; set; }
    public DateTime DataCadastro { get; set; } = DateTime.Now;
    public DateTime DataAtualizacao { get; set; } = DateTime.Now;

    // Relacionamentos
    public ICollection<Viagem> Viagens { get; set; } = new List<Viagem>();
    public ICollection<Manutencao> Manutencoes { get; set; } = new List<Manutencao>();
}