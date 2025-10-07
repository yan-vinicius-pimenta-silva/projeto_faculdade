namespace BAALogistica.Domain.Entities;

public class DespesaViagem
{
    public int Id { get; set; }
    public int ViagemId { get; set; }
    public string TipoDespesa { get; set; } = string.Empty;
    public string? DescricaoDespesa { get; set; }
    public decimal Valor { get; set; }
    public DateTime DataDespesa { get; set; }
    public string? Observacoes { get; set; }
    public DateTime DataCadastro { get; set; } = DateTime.Now;

    // Relacionamentos
    public Viagem Viagem { get; set; } = null!;
}