// ============================================
// BAALogistica.API/Controllers/ClientesController.cs
// ============================================
using BAALogistica.API.Helpers;
using BAALogistica.Domain.Entities;
using BAALogistica.Infrastructure.Data;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;

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

    [HttpGet("export")]
    public async Task<IActionResult> ExportClientes()
    {
        try
        {
            var clientes = await _context.Clientes
                .AsNoTracking()
                .OrderBy(c => c.RazaoSocial)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Clientes");
            var headers = new[]
            {
                "RazaoSocial",
                "NomeFantasia",
                "CNPJ",
                "CPF",
                "Telefone",
                "Email",
                "Endereco",
                "Cidade",
                "Estado",
                "CEP",
                "Contato",
                "Status"
            };

            for (var i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(1, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
            }

            var rowIndex = 2;
            foreach (var cliente in clientes)
            {
                worksheet.Cell(rowIndex, 1).Value = cliente.RazaoSocial;
                worksheet.Cell(rowIndex, 2).Value = cliente.NomeFantasia;
                worksheet.Cell(rowIndex, 3).Value = cliente.CNPJ;
                worksheet.Cell(rowIndex, 4).Value = cliente.CPF;
                worksheet.Cell(rowIndex, 5).Value = cliente.Telefone;
                worksheet.Cell(rowIndex, 6).Value = cliente.Email;
                worksheet.Cell(rowIndex, 7).Value = cliente.Endereco;
                worksheet.Cell(rowIndex, 8).Value = cliente.Cidade;
                worksheet.Cell(rowIndex, 9).Value = cliente.Estado;
                worksheet.Cell(rowIndex, 10).Value = cliente.CEP;
                worksheet.Cell(rowIndex, 11).Value = cliente.Contato;
                worksheet.Cell(rowIndex, 12).Value = cliente.Status;
                rowIndex++;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            var fileName = $"clientes_{DateTime.UtcNow:yyyyMMddHHmmss}.xlsx";
            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao exportar clientes");
            return StatusCode(500, new { message = "Erro interno ao exportar clientes" });
        }
    }

    [HttpPost("import")]
    public async Task<IActionResult> ImportClientes(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Arquivo Excel inválido." });
        }

        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;

            using var workbook = new XLWorkbook(stream);
            var worksheet = workbook.Worksheets.FirstOrDefault();
            if (worksheet == null)
            {
                return BadRequest(new { message = "Planilha não encontrada no arquivo enviado." });
            }

            var range = worksheet.RangeUsed();
            if (range == null)
            {
                return BadRequest(new { message = "A planilha está vazia." });
            }

            var rows = range.RowsUsed().Skip(1).ToList();
            if (rows.Count == 0)
            {
                return BadRequest(new { message = "Nenhuma linha disponível para importação." });
            }

            var existentes = await _context.Clientes.ToListAsync();
            var clientesPorCnpj = existentes
                .Where(c => !string.IsNullOrWhiteSpace(c.CNPJ))
                .ToDictionary(c => ExcelHelper.NormalizeDigits(c.CNPJ), c => c);
            var clientesPorCpf = existentes
                .Where(c => !string.IsNullOrWhiteSpace(c.CPF))
                .ToDictionary(c => ExcelHelper.NormalizeDigits(c.CPF), c => c);

            var now = DateTime.Now;
            var inserted = 0;
            var updated = 0;
            var skipped = 0;

            foreach (var row in rows)
            {
                var razaoSocial = ExcelHelper.GetString(row.Cell(1));
                var nomeFantasia = ExcelHelper.GetString(row.Cell(2));
                var cnpjRaw = ExcelHelper.GetString(row.Cell(3));
                var cpfRaw = ExcelHelper.GetString(row.Cell(4));

                if (string.IsNullOrWhiteSpace(razaoSocial))
                {
                    skipped++;
                    continue;
                }

                var cnpj = ExcelHelper.NormalizeDigits(cnpjRaw);
                var cpf = ExcelHelper.NormalizeDigits(cpfRaw);

                if (cnpj.Length != 14)
                {
                    cnpj = string.Empty;
                }

                if (cpf.Length != 11)
                {
                    cpf = string.Empty;
                }

                if (string.IsNullOrEmpty(cnpj) && string.IsNullOrEmpty(cpf))
                {
                    skipped++;
                    continue;
                }

                Cliente cliente;
                if (!string.IsNullOrEmpty(cnpj) && clientesPorCnpj.TryGetValue(cnpj, out var existenteCnpj))
                {
                    cliente = existenteCnpj;
                    updated++;
                }
                else if (!string.IsNullOrEmpty(cpf) && clientesPorCpf.TryGetValue(cpf, out var existenteCpf))
                {
                    cliente = existenteCpf;
                    updated++;
                }
                else
                {
                    cliente = new Cliente
                    {
                        DataCadastro = now,
                        Status = "Ativo"
                    };
                    _context.Clientes.Add(cliente);
                    inserted++;
                }

                cliente.RazaoSocial = razaoSocial;
                cliente.NomeFantasia = nomeFantasia;
                cliente.CNPJ = string.IsNullOrEmpty(cnpj) ? null : cnpj;
                cliente.CPF = string.IsNullOrEmpty(cpf) ? null : cpf;
                cliente.Telefone = ExcelHelper.GetString(row.Cell(5));
                cliente.Email = ExcelHelper.GetString(row.Cell(6));
                cliente.Endereco = ExcelHelper.GetString(row.Cell(7));
                cliente.Cidade = ExcelHelper.GetString(row.Cell(8));
                cliente.Estado = ExcelHelper.GetString(row.Cell(9));
                cliente.CEP = ExcelHelper.GetString(row.Cell(10));
                cliente.Contato = ExcelHelper.GetString(row.Cell(11));
                cliente.Status = ExcelHelper.GetString(row.Cell(12)) ?? cliente.Status;
                cliente.DataAtualizacao = now;

                if (!string.IsNullOrEmpty(cnpj))
                {
                    clientesPorCnpj[cnpj] = cliente;
                }

                if (!string.IsNullOrEmpty(cpf))
                {
                    clientesPorCpf[cpf] = cliente;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { inserted, updated, skipped });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao importar clientes");
            return StatusCode(500, new { message = "Erro interno ao importar clientes" });
        }
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