// ============================================
// BAALogistica.API/Controllers/MotoristasController.cs
// ============================================
using BAALogistica.Domain.Entities;
using BAALogistica.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BAALogistica.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MotoristasController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<MotoristasController> _logger;

    public MotoristasController(AppDbContext context, ILogger<MotoristasController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/motoristas
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Motorista>>> GetMotoristas(
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        try
        {
            var query = _context.Motoristas.AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(m => m.Status == status);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(m => 
                    m.Nome.Contains(search) || 
                    m.CPF.Contains(search) ||
                    m.CNH.Contains(search));
            }

            var motoristas = await query
                .OrderBy(m => m.Nome)
                .ToListAsync();

            return Ok(motoristas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar motoristas");
            return StatusCode(500, "Erro interno ao buscar motoristas");
        }
    }

    // GET: api/motoristas/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Motorista>> GetMotorista(int id)
    {
        try
        {
            var motorista = await _context.Motoristas
                .Include(m => m.Viagens)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (motorista == null)
            {
                return NotFound(new { message = "Motorista não encontrado" });
            }

            return Ok(motorista);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar motorista {Id}", id);
            return StatusCode(500, "Erro interno ao buscar motorista");
        }
    }

    // POST: api/motoristas
    [HttpPost]
    public async Task<ActionResult<Motorista>> CreateMotorista([FromBody] Motorista motorista)
    {
        try
        {
            // Log dos dados recebidos para debug
            _logger.LogInformation("Recebendo motorista: Nome={Nome}, CPF={CPF}, CNH={CNH}", 
                motorista.Nome, motorista.CPF, motorista.CNH);

            // Validações básicas
            if (string.IsNullOrWhiteSpace(motorista.Nome))
            {
                return BadRequest(new { message = "Nome é obrigatório" });
            }

            if (string.IsNullOrWhiteSpace(motorista.CPF))
            {
                return BadRequest(new { message = "CPF é obrigatório" });
            }

            if (string.IsNullOrWhiteSpace(motorista.CNH))
            {
                return BadRequest(new { message = "CNH é obrigatória" });
            }

            if (string.IsNullOrWhiteSpace(motorista.CategoriaCNH))
            {
                return BadRequest(new { message = "Categoria CNH é obrigatória" });
            }

            // Validar data de admissão
            if (motorista.DataAdmissao == default(DateTime))
            {
                return BadRequest(new { message = "Data de admissão é obrigatória" });
            }

            // Validar data de validade da CNH
            if (motorista.ValidadeCNH == default(DateTime))
            {
                return BadRequest(new { message = "Validade da CNH é obrigatória" });
            }

            if (motorista.ValidadeCNH < DateTime.Now.Date)
            {
                return BadRequest(new { message = "CNH está vencida. Por favor, informe uma data futura." });
            }

            // Validar CPF único
            if (await _context.Motoristas.AnyAsync(m => m.CPF == motorista.CPF))
            {
                return BadRequest(new { message = "CPF já cadastrado" });
            }

            // Validar CNH única
            if (await _context.Motoristas.AnyAsync(m => m.CNH == motorista.CNH))
            {
                return BadRequest(new { message = "CNH já cadastrada" });
            }

            // Garantir que o Id seja 0 para novo registro
            motorista.Id = 0;
            motorista.DataCadastro = DateTime.Now;
            motorista.DataAtualizacao = DateTime.Now;

            _context.Motoristas.Add(motorista);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Motorista criado com sucesso: Id={Id}", motorista.Id);

            return CreatedAtAction(nameof(GetMotorista), new { id = motorista.Id }, motorista);
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Erro de banco de dados ao criar motorista");
            return StatusCode(500, new { message = "Erro ao salvar no banco de dados", details = dbEx.InnerException?.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar motorista");
            return StatusCode(500, new { message = "Erro interno ao criar motorista", details = ex.Message });
        }
    }

    // PUT: api/motoristas/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMotorista(int id, [FromBody] Motorista motorista)
    {
        if (id != motorista.Id)
        {
            return BadRequest(new { message = "ID inconsistente" });
        }

        try
        {
            _logger.LogInformation("Atualizando motorista: Id={Id}", id);

            var motoristaExistente = await _context.Motoristas.FindAsync(id);
            if (motoristaExistente == null)
            {
                return NotFound(new { message = "Motorista não encontrado" });
            }

            // Validações
            if (string.IsNullOrWhiteSpace(motorista.Nome))
            {
                return BadRequest(new { message = "Nome é obrigatório" });
            }

            // Validar CPF único (exceto o próprio motorista)
            if (await _context.Motoristas.AnyAsync(m => m.CPF == motorista.CPF && m.Id != id))
            {
                return BadRequest(new { message = "CPF já cadastrado para outro motorista" });
            }

            // Validar CNH única (exceto o próprio motorista)
            if (await _context.Motoristas.AnyAsync(m => m.CNH == motorista.CNH && m.Id != id))
            {
                return BadRequest(new { message = "CNH já cadastrada para outro motorista" });
            }

            // Validar data de validade da CNH
            if (motorista.ValidadeCNH < DateTime.Now.Date)
            {
                return BadRequest(new { message = "CNH está vencida" });
            }

            // Atualizar campos
            motoristaExistente.Nome = motorista.Nome;
            motoristaExistente.CPF = motorista.CPF;
            motoristaExistente.CNH = motorista.CNH;
            motoristaExistente.CategoriaCNH = motorista.CategoriaCNH;
            motoristaExistente.ValidadeCNH = motorista.ValidadeCNH;
            motoristaExistente.Telefone = motorista.Telefone;
            motoristaExistente.Email = motorista.Email;
            motoristaExistente.Endereco = motorista.Endereco;
            motoristaExistente.DataNascimento = motorista.DataNascimento;
            motoristaExistente.DataAdmissao = motorista.DataAdmissao;
            motoristaExistente.Status = motorista.Status;
            motoristaExistente.Observacoes = motorista.Observacoes;
            motoristaExistente.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Motorista atualizado com sucesso: Id={Id}", id);

            return NoContent();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await MotoristaExists(id))
            {
                return NotFound();
            }
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar motorista {Id}", id);
            return StatusCode(500, new { message = "Erro interno ao atualizar motorista", details = ex.Message });
        }
    }

    // DELETE: api/motoristas/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMotorista(int id)
    {
        try
        {
            var motorista = await _context.Motoristas.FindAsync(id);
            if (motorista == null)
            {
                return NotFound(new { message = "Motorista não encontrado" });
            }

            // Verificar se tem viagens vinculadas
            var temViagens = await _context.Viagens.AnyAsync(v => v.MotoristaId == id);
            if (temViagens)
            {
                return BadRequest(new { message = "Não é possível excluir motorista com viagens vinculadas" });
            }

            _context.Motoristas.Remove(motorista);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Motorista excluído com sucesso: Id={Id}", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao excluir motorista {Id}", id);
            return StatusCode(500, new { message = "Erro interno ao excluir motorista", details = ex.Message });
        }
    }

    // GET: api/motoristas/disponiveis
    [HttpGet("disponiveis")]
    public async Task<ActionResult<IEnumerable<Motorista>>> GetMotoristasDisponiveis()
    {
        try
        {
            var motoristasDisponiveis = await _context.Motoristas
                .Where(m => m.Status == "Ativo")
                .Where(m => !_context.Viagens.Any(v => 
                    v.MotoristaId == m.Id && 
                    v.Status == "Em Andamento"))
                .OrderBy(m => m.Nome)
                .ToListAsync();

            return Ok(motoristasDisponiveis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar motoristas disponíveis");
            return StatusCode(500, "Erro interno ao buscar motoristas disponíveis");
        }
    }

    private async Task<bool> MotoristaExists(int id)
    {
        return await _context.Motoristas.AnyAsync(e => e.Id == id);
    }
}