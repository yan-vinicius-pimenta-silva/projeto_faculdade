// ============================================
// BAALogistica.API/Controllers/ClientesController.cs
// ============================================
using BAALogistica.Domain.Entities;
using BAALogistica.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BAALogistica.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ClientesController> _logger;

    public ClientesController(AppDbContext context, ILogger<ClientesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes([FromQuery] string? status = null)
    {
        try
        {
            var query = _context.Clientes.AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(c => c.Status == status);
            }

            var clientes = await query.OrderBy(c => c.RazaoSocial).ToListAsync();
            return Ok(clientes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar clientes");
            return StatusCode(500, "Erro interno ao buscar clientes");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Cliente>> GetCliente(int id)
    {
        try
        {
            var cliente = await _context.Clientes
                .Include(c => c.Cargas)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cliente == null)
            {
                return NotFound(new { message = "Cliente não encontrado" });
            }

            return Ok(cliente);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar cliente {Id}", id);
            return StatusCode(500, "Erro interno ao buscar cliente");
        }
    }

    [HttpPost]
    public async Task<ActionResult<Cliente>> CreateCliente([FromBody] Cliente cliente)
    {
        try
        {
            _logger.LogInformation("Recebendo cliente: RazaoSocial={RazaoSocial}", cliente.RazaoSocial);

            if (string.IsNullOrWhiteSpace(cliente.RazaoSocial))
            {
                return BadRequest(new { message = "Razão social é obrigatória" });
            }

            if (!string.IsNullOrEmpty(cliente.CNPJ) && 
                await _context.Clientes.AnyAsync(c => c.CNPJ == cliente.CNPJ))
            {
                return BadRequest(new { message = "CNPJ já cadastrado" });
            }

            if (!string.IsNullOrEmpty(cliente.CPF) && 
                await _context.Clientes.AnyAsync(c => c.CPF == cliente.CPF))
            {
                return BadRequest(new { message = "CPF já cadastrado" });
            }

            cliente.Id = 0;
            cliente.DataCadastro = DateTime.Now;
            cliente.DataAtualizacao = DateTime.Now;

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Cliente criado com sucesso: Id={Id}", cliente.Id);

            return CreatedAtAction(nameof(GetCliente), new { id = cliente.Id }, cliente);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar cliente");
            return StatusCode(500, new { message = "Erro interno ao criar cliente", details = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCliente(int id, [FromBody] Cliente cliente)
    {
        if (id != cliente.Id)
        {
            return BadRequest(new { message = "ID inconsistente" });
        }

        try
        {
            var clienteExistente = await _context.Clientes.FindAsync(id);
            if (clienteExistente == null)
            {
                return NotFound(new { message = "Cliente não encontrado" });
            }

            if (!string.IsNullOrEmpty(cliente.CNPJ) && 
                await _context.Clientes.AnyAsync(c => c.CNPJ == cliente.CNPJ && c.Id != id))
            {
                return BadRequest(new { message = "CNPJ já cadastrado para outro cliente" });
            }

            clienteExistente.RazaoSocial = cliente.RazaoSocial;
            clienteExistente.NomeFantasia = cliente.NomeFantasia;
            clienteExistente.CNPJ = cliente.CNPJ;
            clienteExistente.CPF = cliente.CPF;
            clienteExistente.Telefone = cliente.Telefone;
            clienteExistente.Email = cliente.Email;
            clienteExistente.Endereco = cliente.Endereco;
            clienteExistente.Cidade = cliente.Cidade;
            clienteExistente.Estado = cliente.Estado;
            clienteExistente.CEP = cliente.CEP;
            clienteExistente.Contato = cliente.Contato;
            clienteExistente.Status = cliente.Status;
            clienteExistente.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar cliente {Id}", id);
            return StatusCode(500, new { message = "Erro interno ao atualizar cliente", details = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCliente(int id)
    {
        try
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null)
            {
                return NotFound(new { message = "Cliente não encontrado" });
            }

            var temCargas = await _context.Cargas.AnyAsync(c => c.ClienteId == id);
            if (temCargas)
            {
                return BadRequest(new { message = "Não é possível excluir cliente com cargas vinculadas" });
            }

            _context.Clientes.Remove(cliente);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao excluir cliente {Id}", id);
            return StatusCode(500, new { message = "Erro interno ao excluir cliente", details = ex.Message });
        }
    }
}