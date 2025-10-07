// ============================================
// BAALogistica.API/Controllers/ViagensController.cs
// ============================================
using BAALogistica.Domain.Entities;
using BAALogistica.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BAALogistica.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ViagensController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ViagensController> _logger;

    public ViagensController(AppDbContext context, ILogger<ViagensController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Viagem>>> GetViagens([FromQuery] string? status = null)
    {
        try
        {
            var query = _context.Viagens
                .Include(v => v.Motorista)
                .Include(v => v.Veiculo)
                .Include(v => v.Carga)
                    .ThenInclude(c => c.Cliente)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(v => v.Status == status);
            }

            var viagens = await query.OrderByDescending(v => v.DataCadastro).ToListAsync();
            return Ok(viagens);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar viagens");
            return StatusCode(500, "Erro interno ao buscar viagens");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Viagem>> GetViagem(int id)
    {
        try
        {
            var viagem = await _context.Viagens
                .Include(v => v.Motorista)
                .Include(v => v.Veiculo)
                .Include(v => v.Carga)
                    .ThenInclude(c => c.Cliente)
                .Include(v => v.Despesas)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (viagem == null)
            {
                return NotFound(new { message = "Viagem não encontrada" });
            }

            return Ok(viagem);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar viagem {Id}", id);
            return StatusCode(500, "Erro interno ao buscar viagem");
        }
    }

    [HttpPost]
    public async Task<ActionResult<Viagem>> CreateViagem([FromBody] Viagem viagem)
    {
        try
        {
            _logger.LogInformation("Recebendo viagem: NumeroViagem={NumeroViagem}", viagem.NumeroViagem);

            // Validações
            if (string.IsNullOrWhiteSpace(viagem.NumeroViagem))
            {
                return BadRequest(new { message = "Número da viagem é obrigatório" });
            }

            if (viagem.CargaId <= 0)
            {
                return BadRequest(new { message = "Carga é obrigatória" });
            }

            if (viagem.VeiculoId <= 0)
            {
                return BadRequest(new { message = "Veículo é obrigatório" });
            }

            if (viagem.MotoristaId <= 0)
            {
                return BadRequest(new { message = "Motorista é obrigatório" });
            }

            if (await _context.Viagens.AnyAsync(v => v.NumeroViagem == viagem.NumeroViagem))
            {
                return BadRequest(new { message = "Número de viagem já existe" });
            }

            viagem.Id = 0;
            viagem.DataCadastro = DateTime.Now;
            viagem.DataAtualizacao = DateTime.Now;

            _context.Viagens.Add(viagem);

            // Atualizar status do veículo
            var veiculo = await _context.Veiculos.FindAsync(viagem.VeiculoId);
            if (veiculo != null)
            {
                veiculo.Status = "Em Viagem";
            }

            // Atualizar status da carga
            var carga = await _context.Cargas.FindAsync(viagem.CargaId);
            if (carga != null)
            {
                carga.Status = "Em Transporte";
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Viagem criada com sucesso: Id={Id}", viagem.Id);

            return CreatedAtAction(nameof(GetViagem), new { id = viagem.Id }, viagem);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar viagem");
            return StatusCode(500, new { message = "Erro interno ao criar viagem", details = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateViagem(int id, [FromBody] Viagem viagem)
    {
        if (id != viagem.Id)
        {
            return BadRequest(new { message = "ID inconsistente" });
        }

        try
        {
            var viagemExistente = await _context.Viagens.FindAsync(id);
            if (viagemExistente == null)
            {
                return NotFound(new { message = "Viagem não encontrada" });
            }

            viagemExistente.DataSaida = viagem.DataSaida;
            viagemExistente.DataPrevisaoChegada = viagem.DataPrevisaoChegada;
            viagemExistente.DataChegadaReal = viagem.DataChegadaReal;
            viagemExistente.KmInicial = viagem.KmInicial;
            viagemExistente.KmFinal = viagem.KmFinal;
            viagemExistente.DistanciaPercorrida = viagem.DistanciaPercorrida;
            viagemExistente.ValorFrete = viagem.ValorFrete;
            viagemExistente.Status = viagem.Status;
            viagemExistente.Observacoes = viagem.Observacoes;
            viagemExistente.DataAtualizacao = DateTime.Now;

            // Se viagem foi concluída, atualizar status do veículo
            if (viagem.Status == "Concluída")
            {
                var veiculo = await _context.Veiculos.FindAsync(viagemExistente.VeiculoId);
                if (veiculo != null)
                {
                    veiculo.Status = "Disponível";
                    if (viagem.KmFinal.HasValue)
                    {
                        veiculo.KmAtual = viagem.KmFinal.Value;
                    }
                }

                var carga = await _context.Cargas.FindAsync(viagemExistente.CargaId);
                if (carga != null)
                {
                    carga.Status = "Entregue";
                }
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar viagem {Id}", id);
            return StatusCode(500, new { message = "Erro interno ao atualizar viagem", details = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteViagem(int id)
    {
        try
        {
            var viagem = await _context.Viagens.FindAsync(id);
            if (viagem == null)
            {
                return NotFound(new { message = "Viagem não encontrada" });
            }

            if (viagem.Status == "Em Andamento")
            {
                return BadRequest(new { message = "Não é possível excluir viagem em andamento" });
            }

            _context.Viagens.Remove(viagem);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao excluir viagem {Id}", id);
            return StatusCode(500, new { message = "Erro interno ao excluir viagem", details = ex.Message });
        }
    }
}