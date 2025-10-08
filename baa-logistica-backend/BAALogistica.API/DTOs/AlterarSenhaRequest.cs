using System.ComponentModel.DataAnnotations;

namespace BAALogistica.API.DTOs;

public class AlterarSenhaRequest
{
    [Required(ErrorMessage = "Senha atual é obrigatória")]
    public string SenhaAtual { get; set; } = string.Empty;

    [Required(ErrorMessage = "Nova senha é obrigatória")]
    [MinLength(6, ErrorMessage = "A senha deve ter no mínimo 6 caracteres")]
    public string NovaSenha { get; set; } = string.Empty;
}