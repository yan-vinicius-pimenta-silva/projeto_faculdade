using System.ComponentModel.DataAnnotations;

namespace BAALogistica.API.Models.Requests;

public class CargaUpdateRequest : CargaCreateRequest
{
    [Required]
    public int Id { get; set; }
}
