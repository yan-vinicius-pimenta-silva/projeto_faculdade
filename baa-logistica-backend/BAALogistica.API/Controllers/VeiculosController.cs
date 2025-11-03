// ============================================
// BAALogistica.API/Controllers/VeiculosController.cs
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
using System.Text;

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

    [HttpGet("export")]
    public async Task<IActionResult> ExportVeiculos()
    {
        try
        {
            var veiculos = await _context.Veiculos
                .AsNoTracking()
                .OrderBy(v => v.Placa)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Veiculos");
            var headers = new[]
            {
                "Placa",
                "Modelo",
                "Marca",
                "AnoFabricacao",
                "TipoVeiculo",
                "CapacidadeCarga",
                "CapacidadeVolume",
                "Renavam",
                "Chassi",
                "KmAtual",
                "Status",
                "DataAquisicao",
                "Observacoes"
            };

            for (var i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(1, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
            }

            var rowIndex = 2;
            foreach (var veiculo in veiculos)
            {
                worksheet.Cell(rowIndex, 1).Value = veiculo.Placa;
                worksheet.Cell(rowIndex, 2).Value = veiculo.Modelo;
                worksheet.Cell(rowIndex, 3).Value = veiculo.Marca;
                worksheet.Cell(rowIndex, 4).Value = veiculo.AnoFabricacao;
                worksheet.Cell(rowIndex, 5).Value = veiculo.TipoVeiculo;
                worksheet.Cell(rowIndex, 6).Value = veiculo.CapacidadeCarga;
                worksheet.Cell(rowIndex, 7).Value = veiculo.CapacidadeVolume;
                worksheet.Cell(rowIndex, 8).Value = veiculo.Renavam;
                worksheet.Cell(rowIndex, 9).Value = veiculo.Chassi;
                worksheet.Cell(rowIndex, 10).Value = veiculo.KmAtual;
                worksheet.Cell(rowIndex, 11).Value = veiculo.Status;
                worksheet.Cell(rowIndex, 12).Value = veiculo.DataAquisicao;
                worksheet.Cell(rowIndex, 12).Style.DateFormat.Format = "yyyy-MM-dd";
                worksheet.Cell(rowIndex, 13).Value = veiculo.Observacoes;
                rowIndex++;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            var fileName = $"veiculos_{DateTime.UtcNow:yyyyMMddHHmmss}.xlsx";
            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao exportar veículos");
            return StatusCode(500, new { message = "Erro interno ao exportar veículos" });
        }
    }

    [HttpPost("import")]
    public async Task<IActionResult> ImportVeiculos(IFormFile file)
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

            var existentes = await _context.Veiculos.ToListAsync();
            var veiculosPorPlaca = existentes
                .Where(v => !string.IsNullOrWhiteSpace(v.Placa))
                .ToDictionary(v => NormalizePlateKey(v.Placa), v => v);
            var veiculosPorRenavam = existentes
                .Where(v => !string.IsNullOrWhiteSpace(v.Renavam))
                .ToDictionary(v => ExcelHelper.NormalizeDigits(v.Renavam), v => v);

            var now = DateTime.Now;
            var inserted = 0;
            var updated = 0;
            var skipped = 0;

            foreach (var row in rows)
            {
                var placaOriginal = ExcelHelper.GetString(row.Cell(1));
                var placaKey = NormalizePlateKey(placaOriginal);

                if (string.IsNullOrEmpty(placaKey))
                {
                    skipped++;
                    continue;
                }

                var modelo = ExcelHelper.GetString(row.Cell(2));
                var marca = ExcelHelper.GetString(row.Cell(3));
                var anoFabricacao = ExcelHelper.GetInt(row.Cell(4));
                var tipoVeiculo = ExcelHelper.GetString(row.Cell(5));
                var capacidadeCarga = ExcelHelper.GetDecimal(row.Cell(6));

                if (string.IsNullOrWhiteSpace(modelo) || string.IsNullOrWhiteSpace(marca) ||
                    !anoFabricacao.HasValue || string.IsNullOrWhiteSpace(tipoVeiculo) ||
                    !capacidadeCarga.HasValue)
                {
                    skipped++;
                    continue;
                }

                var capacidadeVolume = ExcelHelper.GetDecimal(row.Cell(7));
                var renavam = ExcelHelper.NormalizeDigits(ExcelHelper.GetString(row.Cell(8)));
                var chassi = ExcelHelper.GetString(row.Cell(9));
                var kmAtual = ExcelHelper.GetInt(row.Cell(10)) ?? 0;
                var status = ExcelHelper.GetString(row.Cell(11)) ?? "Disponível";
                var dataAquisicao = ExcelHelper.TryGetDate(row.Cell(12), out var data) ? data : (DateTime?)null;
                var observacoes = ExcelHelper.GetString(row.Cell(13));

                Veiculo veiculo;
                if (veiculosPorPlaca.TryGetValue(placaKey, out var existentePlaca))
                {
                    veiculo = existentePlaca;
                    updated++;
                }
                else if (!string.IsNullOrEmpty(renavam) && veiculosPorRenavam.TryGetValue(renavam, out var existenteRenavam))
                {
                    veiculo = existenteRenavam;
                    veiculosPorPlaca[placaKey] = veiculo;
                    updated++;
                }
                else
                {
                    veiculo = new Veiculo
                    {
                        Placa = placaOriginal?.ToUpperInvariant() ?? placaKey,
                        DataCadastro = now,
                        Status = "Disponível"
                    };
                    _context.Veiculos.Add(veiculo);
                    veiculosPorPlaca[placaKey] = veiculo;
                    if (!string.IsNullOrEmpty(renavam))
                    {
                        veiculosPorRenavam[renavam] = veiculo;
                    }
                    inserted++;
                }

                veiculo.Placa = placaOriginal?.ToUpperInvariant() ?? placaKey;
                veiculo.Modelo = modelo;
                veiculo.Marca = marca;
                veiculo.AnoFabricacao = anoFabricacao.Value;
                veiculo.TipoVeiculo = tipoVeiculo;
                veiculo.CapacidadeCarga = capacidadeCarga.Value;
                veiculo.CapacidadeVolume = capacidadeVolume;
                veiculo.Renavam = string.IsNullOrEmpty(renavam) ? null : renavam;
                veiculo.Chassi = chassi;
                veiculo.KmAtual = kmAtual;
                veiculo.Status = status;
                veiculo.DataAquisicao = dataAquisicao;
                veiculo.Observacoes = observacoes;
                veiculo.DataAtualizacao = now;

                if (!string.IsNullOrEmpty(renavam))
                {
                    veiculosPorRenavam[renavam] = veiculo;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { inserted, updated, skipped });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao importar veículos");
            return StatusCode(500, new { message = "Erro interno ao importar veículos" });
        }
    }

    private static string NormalizePlateKey(string? value)
    {
        var text = ExcelHelper.NormalizeText(value);
        if (string.IsNullOrEmpty(text))
        {
            return string.Empty;
        }

        var builder = new StringBuilder(text.Length);
        foreach (var ch in text)
        {
            if (char.IsLetterOrDigit(ch))
            {
                builder.Append(char.ToUpperInvariant(ch));
            }
        }

        return builder.ToString();
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