using System;

namespace BAALogistica.API.DTOs;

public class UsuarioResponse
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
    public string? Cargo { get; set; }
    public string Perfil { get; set; } = string.Empty;
    public bool Ativo { get; set; }
    public DateTime DataCriacao { get; set; }
    public DateTime? DataUltimoAcesso { get; set; }
}
