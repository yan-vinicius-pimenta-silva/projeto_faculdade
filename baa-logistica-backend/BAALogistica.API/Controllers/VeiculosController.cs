// ============================================
// BAALogistica.API/Controllers/VeiculosController.cs
// ============================================
using BAALogistica.Domain.Entities;
using BAALogistica.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BAALogistica.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VeiculosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<VeiculosController> _logger;

    public VeiculosController(AppDbContext context, ILogger<VeiculosController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/veiculos
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Veiculo>>> GetVeiculos(
        [FromQuery] string? status = null,
        [FromQuery] string? tipo = null)
    {
        try
        {
            var query = _context.Veiculos.AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(v => v.Status == status);
            }

            if (!string.IsNullOrEmpty(tipo))
            {
                query = query.Where(v => v.TipoVeiculo == tipo);
            }

            var veiculos = await query.OrderBy(v => v.Placa).ToListAsync();
            return Ok(veiculos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar veículos");
            return StatusCode(500, "Erro interno ao buscar veículos");
        }
    }

    // GET: api/veiculos/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Veiculo>> GetVeiculo(int id)
    {
        try
        {
            var veiculo = await _context.Veiculos
                .Include(v => v.Manutencoes)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (veiculo == null)
            {
                return NotFound(new { message = "Veículo não encontrado" });
            }

            return Ok(veiculo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar veículo {Id}", id);
            return StatusCode(500, "Erro interno ao buscar veículo");
        }
    }

    // POST: api/veiculos
    [HttpPost]
    public async Task<ActionResult<Veiculo>> CreateVeiculo([FromBody] Veiculo veiculo)
    {
        try
        {
            _logger.LogInformation("Recebendo veículo: Placa={Placa}, Modelo={Modelo}", 
                veiculo.Placa, veiculo.Modelo);

            // Validações básicas
            if (string.IsNullOrWhiteSpace(veiculo.Placa))
            {
                return BadRequest(new { message = "Placa é obrigatória" });
            }

            if (string.IsNullOrWhiteSpace(veiculo.Modelo))
            {
                return BadRequest(new { message = "Modelo é obrigatório" });
            }

            if (string.IsNullOrWhiteSpace(veiculo.Marca))
            {
                return BadRequest(new { message = "Marca é obrigatória" });
            }

            if (veiculo.AnoFabricacao <= 0)
            {
                return BadRequest(new { message = "Ano de fabricação inválido" });
            }

            if (string.IsNullOrWhiteSpace(veiculo.TipoVeiculo))
            {
                return BadRequest(new { message = "Tipo de veículo é obrigatório" });
            }

            if (veiculo.CapacidadeCarga <= 0)
            {
                return BadRequest(new { message = "Capacidade de carga deve ser maior que zero" });
            }

            // Validar placa única
            if (await _context.Veiculos.AnyAsync(v => v.Placa == veiculo.Placa))
            {
                return BadRequest(new { message = "Placa já cadastrada" });
            }

            // Garantir que o Id seja 0 para novo registro
            veiculo.Id = 0;
            veiculo.DataCadastro = DateTime.Now;
            veiculo.DataAtualizacao = DateTime.Now;

            _context.Veiculos.Add(veiculo);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Veículo criado com sucesso: Id={Id}", veiculo.Id);

            return CreatedAtAction(nameof(GetVeiculo), new { id = veiculo.Id }, veiculo);
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Erro de banco de dados ao criar veículo");
            return StatusCode(500, new { message = "Erro ao salvar no banco de dados", details = dbEx.InnerException?.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar veículo");
            return StatusCode(500, new { message = "Erro interno ao criar veículo", details = ex.Message });
        }
    }

    // PUT: api/veiculos/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVeiculo(int id, [FromBody] Veiculo veiculo)
    {
        if (id != veiculo.Id)
        {
            return BadRequest(new { message = "ID inconsistente" });
        }

        try
        {
            _logger.LogInformation("Atualizando veículo: Id={Id}", id);

            var veiculoExistente = await _context.Veiculos.FindAsync(id);
            if (veiculoExistente == null)
            {
                return NotFound(new { message = "Veículo não encontrado" });
            }

            // Validações
            if (string.IsNullOrWhiteSpace(veiculo.Placa))
            {
                return BadRequest(new { message = "Placa é obrigatória" });
            }

            // Validar placa única (exceto o próprio veículo)
            if (await _context.Veiculos.AnyAsync(v => v.Placa == veiculo.Placa && v.Id != id))
            {
                return BadRequest(new { message = "Placa já cadastrada para outro veículo" });
            }

            veiculoExistente.Placa = veiculo.Placa;
            veiculoExistente.Modelo = veiculo.Modelo;
            veiculoExistente.Marca = veiculo.Marca;
            veiculoExistente.AnoFabricacao = veiculo.AnoFabricacao;
            veiculoExistente.TipoVeiculo = veiculo.TipoVeiculo;
            veiculoExistente.CapacidadeCarga = veiculo.CapacidadeCarga;
            veiculoExistente.CapacidadeVolume = veiculo.CapacidadeVolume;
            veiculoExistente.Renavam = veiculo.Renavam;
            veiculoExistente.Chassi = veiculo.Chassi;
            veiculoExistente.KmAtual = veiculo.KmAtual;
            veiculoExistente.Status = veiculo.Status;
            veiculoExistente.DataAquisicao = veiculo.DataAquisicao;
            veiculoExistente.Observacoes = veiculo.Observacoes;
            veiculoExistente.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Veículo atualizado com sucesso: Id={Id}", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar veículo {Id}", id);
            return StatusCode(500, new { message = "Erro interno ao atualizar veículo", details = ex.Message });
        }
    }

    // DELETE: api/veiculos/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVeiculo(int id)
    {
        try
        {
            var veiculo = await _context.Veiculos.FindAsync(id);
            if (veiculo == null)
            {
                return NotFound(new { message = "Veículo não encontrado" });
            }

            var temViagens = await _context.Viagens.AnyAsync(v => v.VeiculoId == id);
            if (temViagens)
            {
                return BadRequest(new { message = "Não é possível excluir veículo com viagens vinculadas" });
            }

            _context.Veiculos.Remove(veiculo);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Veículo excluído com sucesso: Id={Id}", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao excluir veículo {Id}", id);
            return StatusCode(500, new { message = "Erro interno ao excluir veículo", details = ex.Message });
        }
    }

    // GET: api/veiculos/disponiveis
    [HttpGet("disponiveis")]
    public async Task<ActionResult<IEnumerable<Veiculo>>> GetVeiculosDisponiveis()
    {
        try
        {
            var veiculosDisponiveis = await _context.Veiculos
                .Where(v => v.Status == "Disponível")
                .OrderBy(v => v.Placa)
                .ToListAsync();

            return Ok(veiculosDisponiveis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar veículos disponíveis");
            return StatusCode(500, "Erro interno ao buscar veículos disponíveis");
        }
    }
}