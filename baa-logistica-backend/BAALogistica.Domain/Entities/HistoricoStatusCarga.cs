// ============================================
// BAALogistica.Domain/Entities/HistoricoStatusCarga.cs
// ============================================
namespace BAALogistica.Domain.Entities;

public class HistoricoStatusCarga
{
    public int Id { get; set; }
    public int CargaId { get; set; }
    public string? StatusAnterior { get; set; }
    public string StatusNovo { get; set; } = string.Empty;
    public DateTime DataMudanca { get; set; } = DateTime.Now;
    public string? LocalizacaoAtual { get; set; }
    public string? Observacoes { get; set; }
    public string? UsuarioResponsavel { get; set; }

    // Relacionamentos
    public Carga Carga { get; set; } = null!;
}