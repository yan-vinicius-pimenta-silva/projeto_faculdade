using System.ComponentModel.DataAnnotations;

namespace BAALogistica.Domain.Entities;

public class Usuario
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Login { get; set; } = string.Empty;

    [Required]
    public string SenhaHash { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Cargo { get; set; }

    [MaxLength(20)]
    public string Perfil { get; set; } = "Usuario"; // Admin, Usuario, Operador

    public bool Ativo { get; set; } = true;

    public DateTime DataCriacao { get; set; } = DateTime.Now;

    public DateTime? DataUltimoAcesso { get; set; }
}