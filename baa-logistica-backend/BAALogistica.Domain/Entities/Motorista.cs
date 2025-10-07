namespace BAALogistica.Domain.Entities;

public class Motorista
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string CPF { get; set; } = string.Empty;
    public string CNH { get; set; } = string.Empty;
    public string CategoriaCNH { get; set; } = string.Empty;
    public DateTime ValidadeCNH { get; set; }
    public string? Telefone { get; set; }
    public string? Email { get; set; }
    public string? Endereco { get; set; }
    public DateTime? DataNascimento { get; set; }
    public DateTime DataAdmissao { get; set; }
    public string Status { get; set; } = "Ativo";
    public string? Observacoes { get; set; }
    public DateTime DataCadastro { get; set; } = DateTime.Now;
    public DateTime DataAtualizacao { get; set; } = DateTime.Now;

    // Relacionamentos
    public ICollection<Viagem> Viagens { get; set; } = new List<Viagem>();
}