using System;
using System.Collections.Generic;
using System.Linq;
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
                    DataUltimoAcesso = u.DataUltimoAcesso
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
                DataUltimoAcesso = novoUsuario.DataUltimoAcesso
            };

            return Created($"api/usuarios/{novoUsuario.Id}", response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar usuário");
            return StatusCode(500, new { message = "Erro interno ao criar usuário" });
        }
    }
}
