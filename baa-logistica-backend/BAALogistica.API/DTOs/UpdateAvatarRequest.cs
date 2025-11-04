using System.ComponentModel.DataAnnotations;

namespace BAALogistica.API.DTOs;

public class UpdateAvatarRequest
{
    [Required]
    public string AvatarBase64 { get; set; } = string.Empty;
}
