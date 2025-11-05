using System.ComponentModel.DataAnnotations;

namespace BAALogistica.API.DTOs;

public class UpdateUsuarioStatusRequest
{
    [Required(ErrorMessage = "O status do usuário é obrigatório.")]
    public bool? Ativo { get; set; }
}
