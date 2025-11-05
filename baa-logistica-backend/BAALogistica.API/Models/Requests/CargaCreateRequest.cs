using System;
using System.ComponentModel.DataAnnotations;

namespace BAALogistica.API.Models.Requests;

public class CargaCreateRequest
{
    [Required]
    public string NumeroProtocolo { get; set; } = string.Empty;

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Cliente é obrigatório")]
    public int ClienteId { get; set; }

    [Required]
    public string TipoCarga { get; set; } = string.Empty;

    [Required]
    public string DescricaoCarga { get; set; } = string.Empty;

    [Required]
    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ErrorMessage = "Peso deve ser maior que zero")]
    public decimal PesoCarga { get; set; }

    public decimal? VolumeCarga { get; set; }

    public decimal? ValorCarga { get; set; }

    [Required]
    public string EnderecoColeta { get; set; } = string.Empty;

    [Required]
    public string CidadeColeta { get; set; } = string.Empty;

    [Required]
    public string EstadoColeta { get; set; } = string.Empty;

    [Required]
    public string EnderecoEntrega { get; set; } = string.Empty;

    [Required]
    public string CidadeEntrega { get; set; } = string.Empty;

    [Required]
    public string EstadoEntrega { get; set; } = string.Empty;

    public DateTime? DataPrevistaColeta { get; set; }

    public DateTime? DataPrevistaEntrega { get; set; }

    public string Status { get; set; } = "Aguardando";

    public string? Observacoes { get; set; }
}
