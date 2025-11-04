using System.ComponentModel.DataAnnotations;

namespace BAALogistica.API.DTOs;

public class ResetUsuarioSenhaRequest
{
    [Required]
    [MinLength(6, ErrorMessage = "A nova senha deve ter pelo menos 6 caracteres")]
    public string NovaSenha { get; set; } = string.Empty;
}
