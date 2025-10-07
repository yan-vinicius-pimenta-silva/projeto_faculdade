namespace BAALogistica.Domain.Entities;

public class Carga
{
    public int Id { get; set; }
    public string NumeroProtocolo { get; set; } = string.Empty;
    public int ClienteId { get; set; }
    public string TipoCarga { get; set; } = string.Empty;
    public string DescricaoCarga { get; set; } = string.Empty;
    public decimal PesoCarga { get; set; }
    public decimal? VolumeCarga { get; set; }
    public decimal? ValorCarga { get; set; }
    public string EnderecoColeta { get; set; } = string.Empty;
    public string CidadeColeta { get; set; } = string.Empty;
    public string EstadoColeta { get; set; } = string.Empty;
    public string EnderecoEntrega { get; set; } = string.Empty;
    public string CidadeEntrega { get; set; } = string.Empty;
    public string EstadoEntrega { get; set; } = string.Empty;
    public DateTime DataCadastro { get; set; } = DateTime.Now;
    public DateTime? DataPrevistaColeta { get; set; }
    public DateTime? DataPrevistaEntrega { get; set; }
    public string Status { get; set; } = "Aguardando";
    public string? Observacoes { get; set; }

    // Relacionamentos
    public Cliente Cliente { get; set; } = null!;
    public ICollection<Viagem> Viagens { get; set; } = new List<Viagem>();
    public ICollection<HistoricoStatusCarga> Historicos { get; set; } = new List<HistoricoStatusCarga>();
}