using System.ComponentModel.DataAnnotations;

namespace BAALogistica.API.DTOs;

public class LoginRequest
{
    [Required(ErrorMessage = "Login é obrigatório")]
    public string Login { get; set; } = string.Empty;

    [Required(ErrorMessage = "Senha é obrigatória")]
    public string Senha { get; set; } = string.Empty;
}