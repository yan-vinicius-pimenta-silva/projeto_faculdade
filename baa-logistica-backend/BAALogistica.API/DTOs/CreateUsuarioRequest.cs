using System.ComponentModel.DataAnnotations;

namespace BAALogistica.API.DTOs;

public class CreateUsuarioRequest
{
    [Required]
    [MaxLength(100)]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Login { get; set; } = string.Empty;

    [Required]
    [MinLength(6, ErrorMessage = "A senha deve ter pelo menos 6 caracteres")]
    public string Senha { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Cargo { get; set; }

    [MaxLength(20)]
    public string Perfil { get; set; } = "Usuario";
}
