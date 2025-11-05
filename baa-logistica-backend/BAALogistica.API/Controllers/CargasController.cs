// ============================================
// BAALogistica.API/Controllers/CargasController.cs
// ============================================
using System;
using BAALogistica.API.Models.Requests;
using BAALogistica.Domain.Entities;
using BAALogistica.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BAALogistica.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CargasController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<CargasController> _logger;

    public CargasController(AppDbContext context, ILogger<CargasController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Carga>>> GetCargas([FromQuery] string? status = null)
    {
        try
        {
            var query = _context.Cargas.Include(c => c.Cliente).AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(c => c.Status == status);
            }

            var cargas = await query.OrderByDescending(c => c.DataCadastro).ToListAsync();
            return Ok(cargas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar cargas");
            return StatusCode(500, "Erro interno ao buscar cargas");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Carga>> GetCarga(int id)
    {
        try
        {
            var carga = await _context.Cargas
                .Include(c => c.Cliente)
                .Include(c => c.Viagens)
                .Include(c => c.Historicos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (carga == null)
            {
                return NotFound(new { message = "Carga não encontrada" });
            }

            return Ok(carga);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar carga {Id}", id);
            return StatusCode(500, "Erro interno ao buscar carga");
        }
    }

    [HttpPost]
    public async Task<ActionResult<Carga>> CreateCarga([FromBody] CargaCreateRequest request)
    {
        try
        {
            _logger.LogInformation("Recebendo carga: Protocolo={Protocolo}", request.NumeroProtocolo);

            // Validações
            if (string.IsNullOrWhiteSpace(request.NumeroProtocolo))
            {
                return BadRequest(new { message = "Número de protocolo é obrigatório" });
            }

            if (request.ClienteId <= 0)
            {
                return BadRequest(new { message = "Cliente é obrigatório" });
            }

            if (!await _context.Clientes.AnyAsync(c => c.Id == request.ClienteId))
            {
                return BadRequest(new { message = "Cliente não encontrado" });
            }

            if (string.IsNullOrWhiteSpace(request.TipoCarga))
            {
                return BadRequest(new { message = "Tipo de carga é obrigatório" });
            }

            if (string.IsNullOrWhiteSpace(request.DescricaoCarga))
            {
                return BadRequest(new { message = "Descrição da carga é obrigatória" });
            }

            if (string.IsNullOrWhiteSpace(request.EnderecoColeta) || string.IsNullOrWhiteSpace(request.CidadeColeta) || string.IsNullOrWhiteSpace(request.EstadoColeta))
            {
                return BadRequest(new { message = "Endereço de coleta completo é obrigatório" });
            }

            if (string.IsNullOrWhiteSpace(request.EnderecoEntrega) || string.IsNullOrWhiteSpace(request.CidadeEntrega) || string.IsNullOrWhiteSpace(request.EstadoEntrega))
            {
                return BadRequest(new { message = "Endereço de entrega completo é obrigatório" });
            }

            var numeroProtocolo = request.NumeroProtocolo.Trim();

            if (await _context.Cargas.AnyAsync(c => c.NumeroProtocolo == numeroProtocolo))
            {
                return BadRequest(new { message = "Número de protocolo já existe" });
            }

            var carga = new Carga
            {
                NumeroProtocolo = numeroProtocolo,
                ClienteId = request.ClienteId,
                TipoCarga = request.TipoCarga.Trim(),
                DescricaoCarga = request.DescricaoCarga.Trim(),
                PesoCarga = request.PesoCarga,
                VolumeCarga = request.VolumeCarga,
                ValorCarga = request.ValorCarga,
                EnderecoColeta = request.EnderecoColeta.Trim(),
                CidadeColeta = request.CidadeColeta.Trim(),
                EstadoColeta = request.EstadoColeta.Trim(),
                EnderecoEntrega = request.EnderecoEntrega.Trim(),
                CidadeEntrega = request.CidadeEntrega.Trim(),
                EstadoEntrega = request.EstadoEntrega.Trim(),
                DataCadastro = DateTime.Now,
                DataPrevistaColeta = request.DataPrevistaColeta,
                DataPrevistaEntrega = request.DataPrevistaEntrega,
                Status = string.IsNullOrWhiteSpace(request.Status) ? "Aguardando" : request.Status.Trim(),
                Observacoes = string.IsNullOrWhiteSpace(request.Observacoes) ? null : request.Observacoes.Trim()
            };

            _context.Cargas.Add(carga);
            await _context.SaveChangesAsync();

            // Criar histórico inicial
            var historico = new HistoricoStatusCarga
            {
                CargaId = carga.Id,
                StatusNovo = carga.Status,
                DataMudanca = DateTime.Now,
                Observacoes = "Carga cadastrada no sistema"
            };
            _context.HistoricoStatusCargas.Add(historico);

            await _context.SaveChangesAsync();

            await _context.Entry(carga).Reference(c => c.Cliente).LoadAsync();

            _logger.LogInformation("Carga criada com sucesso: Id={Id}", carga.Id);

            return CreatedAtAction(nameof(GetCarga), new { id = carga.Id }, carga);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar carga");
            return StatusCode(500, new { message = "Erro interno ao criar carga", details = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCarga(int id, [FromBody] CargaUpdateRequest request)
    {
        if (id != request.Id)
        {
            return BadRequest(new { message = "ID inconsistente" });
        }

        try
        {
            var cargaExistente = await _context.Cargas.FindAsync(id);
            if (cargaExistente == null)
            {
                return NotFound(new { message = "Carga não encontrada" });
            }

            if (!await _context.Clientes.AnyAsync(c => c.Id == request.ClienteId))
            {
                return BadRequest(new { message = "Cliente não encontrado" });
            }

            if (string.IsNullOrWhiteSpace(request.NumeroProtocolo))
            {
                return BadRequest(new { message = "Número de protocolo é obrigatório" });
            }

            var numeroProtocolo = request.NumeroProtocolo.Trim();

            if (!string.Equals(cargaExistente.NumeroProtocolo, numeroProtocolo, StringComparison.OrdinalIgnoreCase))
            {
                if (await _context.Cargas.AnyAsync(c => c.NumeroProtocolo == numeroProtocolo && c.Id != id))
                {
                    return BadRequest(new { message = "Número de protocolo já existe" });
                }

                cargaExistente.NumeroProtocolo = numeroProtocolo;
            }

            if (string.IsNullOrWhiteSpace(request.TipoCarga))
            {
                return BadRequest(new { message = "Tipo de carga é obrigatório" });
            }

            if (string.IsNullOrWhiteSpace(request.DescricaoCarga))
            {
                return BadRequest(new { message = "Descrição da carga é obrigatória" });
            }

            if (string.IsNullOrWhiteSpace(request.EnderecoColeta) || string.IsNullOrWhiteSpace(request.CidadeColeta) || string.IsNullOrWhiteSpace(request.EstadoColeta))
            {
                return BadRequest(new { message = "Endereço de coleta completo é obrigatório" });
            }

            if (string.IsNullOrWhiteSpace(request.EnderecoEntrega) || string.IsNullOrWhiteSpace(request.CidadeEntrega) || string.IsNullOrWhiteSpace(request.EstadoEntrega))
            {
                return BadRequest(new { message = "Endereço de entrega completo é obrigatório" });
            }

            var statusAnterior = cargaExistente.Status;

            cargaExistente.ClienteId = request.ClienteId;
            cargaExistente.TipoCarga = request.TipoCarga.Trim();
            cargaExistente.DescricaoCarga = request.DescricaoCarga.Trim();
            cargaExistente.PesoCarga = request.PesoCarga;
            cargaExistente.VolumeCarga = request.VolumeCarga;
            cargaExistente.ValorCarga = request.ValorCarga;
            cargaExistente.EnderecoColeta = request.EnderecoColeta.Trim();
            cargaExistente.CidadeColeta = request.CidadeColeta.Trim();
            cargaExistente.EstadoColeta = request.EstadoColeta.Trim();
            cargaExistente.EnderecoEntrega = request.EnderecoEntrega.Trim();
            cargaExistente.CidadeEntrega = request.CidadeEntrega.Trim();
            cargaExistente.EstadoEntrega = request.EstadoEntrega.Trim();
            cargaExistente.DataPrevistaColeta = request.DataPrevistaColeta;
            cargaExistente.DataPrevistaEntrega = request.DataPrevistaEntrega;
            cargaExistente.Status = string.IsNullOrWhiteSpace(request.Status) ? cargaExistente.Status : request.Status.Trim();
            cargaExistente.Observacoes = string.IsNullOrWhiteSpace(request.Observacoes) ? null : request.Observacoes.Trim();

            // Se mudou o status, criar histórico
            if (!string.Equals(statusAnterior, cargaExistente.Status, StringComparison.OrdinalIgnoreCase))
            {
                var historico = new HistoricoStatusCarga
                {
                    CargaId = id,
                    StatusAnterior = statusAnterior,
                    StatusNovo = cargaExistente.Status,
                    DataMudanca = DateTime.Now
                };
                _context.HistoricoStatusCargas.Add(historico);
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar carga {Id}", id);
            return StatusCode(500, new { message = "Erro interno ao atualizar carga", details = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCarga(int id)
    {
        try
        {
            var carga = await _context.Cargas.FindAsync(id);
            if (carga == null)
            {
                return NotFound(new { message = "Carga não encontrada" });
            }

            var temViagens = await _context.Viagens.AnyAsync(v => v.CargaId == id);
            if (temViagens)
            {
                return BadRequest(new { message = "Não é possível excluir carga com viagens vinculadas" });
            }

            _context.Cargas.Remove(carga);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao excluir carga {Id}", id);
            return StatusCode(500, new { message = "Erro interno ao excluir carga", details = ex.Message });
        }
    }
}