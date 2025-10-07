// ============================================
// BAALogistica.API/Controllers/CargasController.cs
// ============================================
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
    public async Task<ActionResult<Carga>> CreateCarga([FromBody] Carga carga)
    {
        try
        {
            _logger.LogInformation("Recebendo carga: Protocolo={Protocolo}", carga.NumeroProtocolo);

            // Validações
            if (string.IsNullOrWhiteSpace(carga.NumeroProtocolo))
            {
                return BadRequest(new { message = "Número de protocolo é obrigatório" });
            }

            if (carga.ClienteId <= 0)
            {
                return BadRequest(new { message = "Cliente é obrigatório" });
            }

            if (string.IsNullOrWhiteSpace(carga.DescricaoCarga))
            {
                return BadRequest(new { message = "Descrição da carga é obrigatória" });
            }

            if (await _context.Cargas.AnyAsync(c => c.NumeroProtocolo == carga.NumeroProtocolo))
            {
                return BadRequest(new { message = "Número de protocolo já existe" });
            }

            carga.Id = 0;
            carga.DataCadastro = DateTime.Now;
            _context.Cargas.Add(carga);

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
    public async Task<IActionResult> UpdateCarga(int id, [FromBody] Carga carga)
    {
        if (id != carga.Id)
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

            var statusAnterior = cargaExistente.Status;

            cargaExistente.TipoCarga = carga.TipoCarga;
            cargaExistente.DescricaoCarga = carga.DescricaoCarga;
            cargaExistente.PesoCarga = carga.PesoCarga;
            cargaExistente.VolumeCarga = carga.VolumeCarga;
            cargaExistente.ValorCarga = carga.ValorCarga;
            cargaExistente.EnderecoColeta = carga.EnderecoColeta;
            cargaExistente.CidadeColeta = carga.CidadeColeta;
            cargaExistente.EstadoColeta = carga.EstadoColeta;
            cargaExistente.EnderecoEntrega = carga.EnderecoEntrega;
            cargaExistente.CidadeEntrega = carga.CidadeEntrega;
            cargaExistente.EstadoEntrega = carga.EstadoEntrega;
            cargaExistente.DataPrevistaColeta = carga.DataPrevistaColeta;
            cargaExistente.DataPrevistaEntrega = carga.DataPrevistaEntrega;
            cargaExistente.Status = carga.Status;
            cargaExistente.Observacoes = carga.Observacoes;

            // Se mudou o status, criar histórico
            if (statusAnterior != carga.Status)
            {
                var historico = new HistoricoStatusCarga
                {
                    CargaId = id,
                    StatusAnterior = statusAnterior,
                    StatusNovo = carga.Status,
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