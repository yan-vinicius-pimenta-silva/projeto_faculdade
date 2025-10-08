using BAALogistica.API.DTOs;
using BAALogistica.Domain.Entities;
using BAALogistica.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BAALogistica.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        AppDbContext context, 
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            // Buscar usuário por login
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Login == request.Login && u.Ativo);

            if (usuario == null)
            {
                return Unauthorized(new { message = "Login ou senha inválidos" });
            }

            // Verificar senha
            if (!BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash))
            {
                return Unauthorized(new { message = "Login ou senha inválidos" });
            }

            // Atualizar último acesso
            usuario.DataUltimoAcesso = DateTime.Now;
            await _context.SaveChangesAsync();

            // Gerar token JWT
            var token = GerarTokenJWT(usuario);

            _logger.LogInformation("Login bem-sucedido: {Login}", usuario.Login);

            return Ok(new LoginResponse
            {
                Token = token,
                Nome = usuario.Nome,
                Email = usuario.Email,
                Perfil = usuario.Perfil,
                Expiracao = DateTime.Now.AddHours(8)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao fazer login");
            return StatusCode(500, new { message = "Erro interno ao fazer login" });
        }
    }

    // POST: api/auth/alterar-senha
    [Authorize]
    [HttpPost("alterar-senha")]
    public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaRequest request)
    {
        try
        {
            // Pegar ID do usuário do token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized();
            }

            var userId = int.Parse(userIdClaim);
            var usuario = await _context.Usuarios.FindAsync(userId);

            if (usuario == null)
            {
                return NotFound(new { message = "Usuário não encontrado" });
            }

            // Verificar senha atual
            if (!BCrypt.Net.BCrypt.Verify(request.SenhaAtual, usuario.SenhaHash))
            {
                return BadRequest(new { message = "Senha atual incorreta" });
            }

            // Atualizar senha
            usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.NovaSenha);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Senha alterada: {Login}", usuario.Login);

            return Ok(new { message = "Senha alterada com sucesso" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao alterar senha");
            return StatusCode(500, new { message = "Erro interno ao alterar senha" });
        }
    }

    // GET: api/auth/me
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<object>> GetUsuarioAtual()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized();
            }

            var userId = int.Parse(userIdClaim);
            var usuario = await _context.Usuarios.FindAsync(userId);

            if (usuario == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                usuario.Id,
                usuario.Nome,
                usuario.Email,
                usuario.Login,
                usuario.Cargo,
                usuario.Perfil
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar usuário atual");
            return StatusCode(500);
        }
    }

    private string GerarTokenJWT(Usuario usuario)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "ChaveSecretaSuperSegura123!@#MinhaAPIBAALogistica2024";
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "BAALogisticaAPI";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "BAALogisticaApp";

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.Nome),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.Role, usuario.Perfil),
            new Claim("Login", usuario.Login)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.Now.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}