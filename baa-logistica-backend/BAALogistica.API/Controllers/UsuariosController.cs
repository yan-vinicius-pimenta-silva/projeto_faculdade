using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using BAALogistica.API.DTOs;
using BAALogistica.Domain.Entities;
using BAALogistica.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BAALogistica.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private static readonly string[] PerfisPermitidos = new[] { "Admin", "Usuario" };

    private readonly AppDbContext _context;
    private readonly ILogger<UsuariosController> _logger;

    public UsuariosController(AppDbContext context, ILogger<UsuariosController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioResponse>>> GetUsuarios()
    {
        try
        {
            var usuarios = await _context.Usuarios
                .AsNoTracking()
                .OrderBy(u => u.Nome)
                .Select(u => new UsuarioResponse
                {
                    Id = u.Id,
                    Nome = u.Nome,
                    Email = u.Email,
                    Login = u.Login,
                    Cargo = u.Cargo,
                    Perfil = u.Perfil,
                    Ativo = u.Ativo,
                    DataCriacao = u.DataCriacao,
                    DataUltimoAcesso = u.DataUltimoAcesso,
                    Avatar = u.AvatarBase64
                })
                .ToListAsync();

            return Ok(usuarios);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao listar usuários");
            return StatusCode(500, new { message = "Erro interno ao listar usuários" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UsuarioResponse>> CriarUsuario([FromBody] CreateUsuarioRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var perfil = string.IsNullOrWhiteSpace(request.Perfil)
                ? "Usuario"
                : request.Perfil.Trim();

            var perfilNormalizado = PerfisPermitidos
                .FirstOrDefault(p => string.Equals(p, perfil, StringComparison.OrdinalIgnoreCase));

            if (perfilNormalizado is null)
            {
                return BadRequest(new { message = "Perfil inválido. Utilize 'Admin' ou 'Usuario'." });
            }

            var loginEmUso = await _context.Usuarios
                .AnyAsync(u => u.Login == request.Login);
            if (loginEmUso)
            {
                return Conflict(new { message = "Login já cadastrado." });
            }

            var emailEmUso = await _context.Usuarios
                .AnyAsync(u => u.Email == request.Email);
            if (emailEmUso)
            {
                return Conflict(new { message = "E-mail já cadastrado." });
            }

            var novoUsuario = new Usuario
            {
                Nome = request.Nome,
                Email = request.Email,
                Login = request.Login,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.Senha),
                Cargo = string.IsNullOrWhiteSpace(request.Cargo) ? null : request.Cargo.Trim(),
                Perfil = perfilNormalizado,
                Ativo = true,
                DataCriacao = DateTime.UtcNow
            };

            _context.Usuarios.Add(novoUsuario);
            await _context.SaveChangesAsync();

            var response = new UsuarioResponse
            {
                Id = novoUsuario.Id,
                Nome = novoUsuario.Nome,
                Email = novoUsuario.Email,
                Login = novoUsuario.Login,
                Cargo = novoUsuario.Cargo,
                Perfil = novoUsuario.Perfil,
                Ativo = novoUsuario.Ativo,
                DataCriacao = novoUsuario.DataCriacao,
                DataUltimoAcesso = novoUsuario.DataUltimoAcesso,
                Avatar = novoUsuario.AvatarBase64
            };

            return Created($"api/usuarios/{novoUsuario.Id}", response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar usuário");
            return StatusCode(500, new { message = "Erro interno ao criar usuário" });
        }
    }

    [HttpPut("{id}/senha")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AtualizarSenhaUsuario(int id, [FromBody] ResetUsuarioSenhaRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var usuario = await _context.Usuarios.FindAsync(id);

            if (usuario == null)
            {
                return NotFound(new { message = "Usuário não encontrado" });
            }

            usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.NovaSenha);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Senha do usuário {Login} atualizada por administrador", usuario.Login);

            return Ok(new { message = "Senha atualizada com sucesso." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar senha do usuário {UsuarioId}", id);
            return StatusCode(500, new { message = "Erro interno ao atualizar senha do usuário" });
        }
    }

    [HttpPatch("{id}/status")]
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AtualizarStatusUsuario(int id, [FromBody] UpdateUsuarioStatusRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (request.Ativo is null)
        {
            return BadRequest(new { message = "Informe o status desejado para o usuário." });
        }

        try
        {
            var usuario = await _context.Usuarios.FindAsync(id);

            if (usuario == null)
            {
                return NotFound(new { message = "Usuário não encontrado" });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim != null && int.TryParse(userIdClaim, out var usuarioLogadoId))
            {
                if (usuarioLogadoId == usuario.Id && request.Ativo.Value == false)
                {
                    return BadRequest(new { message = "Você não pode desativar o próprio acesso." });
                }
            }

            usuario.Ativo = request.Ativo.Value;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Status do usuário {Login} atualizado para {Status} por {Admin}",
                usuario.Login,
                usuario.Ativo ? "Ativo" : "Inativo",
                User.Identity?.Name ?? "desconhecido");

            return Ok(new
            {
                message = usuario.Ativo
                    ? "Usuário ativado com sucesso."
                    : "Usuário desativado com sucesso.",
                ativo = usuario.Ativo
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar status do usuário {UsuarioId}", id);
            return StatusCode(500, new { message = "Erro interno ao atualizar status do usuário" });
        }
    }
}
