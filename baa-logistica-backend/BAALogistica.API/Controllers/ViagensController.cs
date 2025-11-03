// ============================================
// BAALogistica.API/Controllers/ViagensController.cs
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
public class ViagensController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ViagensController> _logger;

    public ViagensController(AppDbContext context, ILogger<ViagensController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportViagens()
    {
        try
        {
            var viagens = await _context.Viagens
                .Include(v => v.Carga)
                .Include(v => v.Veiculo)
                .Include(v => v.Motorista)
                .AsNoTracking()
                .OrderBy(v => v.NumeroViagem)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Viagens");
            var headers = new[]
            {
                "NumeroViagem",
                "NumeroProtocolo",
                "PlacaVeiculo",
                "CPFMotorista",
                "DataSaida",
                "DataPrevisaoChegada",
                "DataChegadaReal",
                "KmInicial",
                "KmFinal",
                "DistanciaPercorrida",
                "ValorFrete",
                "Status",
                "Observacoes"
            };

            for (var i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(1, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
            }

            var rowIndex = 2;
            foreach (var viagem in viagens)
            {
                worksheet.Cell(rowIndex, 1).Value = viagem.NumeroViagem;
                worksheet.Cell(rowIndex, 2).Value = viagem.Carga?.NumeroProtocolo;
                worksheet.Cell(rowIndex, 3).Value = viagem.Veiculo?.Placa;
                worksheet.Cell(rowIndex, 4).Value = viagem.Motorista?.CPF;
                worksheet.Cell(rowIndex, 5).Value = viagem.DataSaida;
                worksheet.Cell(rowIndex, 5).Style.DateFormat.Format = "yyyy-MM-dd";
                worksheet.Cell(rowIndex, 6).Value = viagem.DataPrevisaoChegada;
                worksheet.Cell(rowIndex, 6).Style.DateFormat.Format = "yyyy-MM-dd";
                worksheet.Cell(rowIndex, 7).Value = viagem.DataChegadaReal;
                worksheet.Cell(rowIndex, 7).Style.DateFormat.Format = "yyyy-MM-dd";
                worksheet.Cell(rowIndex, 8).Value = viagem.KmInicial;
                worksheet.Cell(rowIndex, 9).Value = viagem.KmFinal;
                worksheet.Cell(rowIndex, 10).Value = viagem.DistanciaPercorrida;
                worksheet.Cell(rowIndex, 11).Value = viagem.ValorFrete;
                worksheet.Cell(rowIndex, 12).Value = viagem.Status;
                worksheet.Cell(rowIndex, 13).Value = viagem.Observacoes;
                rowIndex++;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            var fileName = $"viagens_{DateTime.UtcNow:yyyyMMddHHmmss}.xlsx";
            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao exportar viagens");
            return StatusCode(500, new { message = "Erro interno ao exportar viagens" });
        }
    }

    [HttpPost("import")]
    public async Task<IActionResult> ImportViagens(IFormFile file)
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

            var cargas = await _context.Cargas.ToListAsync();
            var cargasPorProtocolo = cargas
                .Where(c => !string.IsNullOrWhiteSpace(c.NumeroProtocolo))
                .ToDictionary(c => ExcelHelper.NormalizeText(c.NumeroProtocolo).ToUpperInvariant(), c => c);

            var veiculos = await _context.Veiculos.ToListAsync();
            var veiculosPorPlaca = veiculos
                .Where(v => !string.IsNullOrWhiteSpace(v.Placa))
                .ToDictionary(v => NormalizePlateKey(v.Placa), v => v);

            var motoristas = await _context.Motoristas.ToListAsync();
            var motoristasPorCpf = motoristas
                .Where(m => !string.IsNullOrWhiteSpace(m.CPF))
                .ToDictionary(m => ExcelHelper.NormalizeDigits(m.CPF), m => m);

            var viagensExistentes = await _context.Viagens.ToListAsync();
            var viagensPorNumero = viagensExistentes
                .Where(v => !string.IsNullOrWhiteSpace(v.NumeroViagem))
                .ToDictionary(v => ExcelHelper.NormalizeText(v.NumeroViagem).ToUpperInvariant(), v => v);

            var now = DateTime.Now;
            var inserted = 0;
            var updated = 0;
            var skipped = 0;

            foreach (var row in rows)
            {
                var numeroOriginal = ExcelHelper.GetString(row.Cell(1));
                var numeroKey = ExcelHelper.NormalizeText(numeroOriginal)?.ToUpperInvariant();
                var protocoloKey = ExcelHelper.NormalizeText(ExcelHelper.GetString(row.Cell(2)))?.ToUpperInvariant();
                var placaKey = NormalizePlateKey(ExcelHelper.GetString(row.Cell(3)));
                var cpfMotorista = ExcelHelper.NormalizeDigits(ExcelHelper.GetString(row.Cell(4)));

                if (string.IsNullOrEmpty(numeroKey) || string.IsNullOrEmpty(protocoloKey) ||
                    string.IsNullOrEmpty(placaKey) || string.IsNullOrEmpty(cpfMotorista))
                {
                    skipped++;
                    continue;
                }

                if (cpfMotorista.Length != 11)
                {
                    skipped++;
                    continue;
                }

                if (!cargasPorProtocolo.TryGetValue(protocoloKey, out var carga) ||
                    !veiculosPorPlaca.TryGetValue(placaKey, out var veiculo) ||
                    !motoristasPorCpf.TryGetValue(cpfMotorista, out var motorista))
                {
                    skipped++;
                    continue;
                }

                var dataSaida = ExcelHelper.TryGetDate(row.Cell(5), out var saida) ? saida : (DateTime?)null;
                var dataPrevisao = ExcelHelper.TryGetDate(row.Cell(6), out var previsao) ? previsao : (DateTime?)null;
                var dataChegada = ExcelHelper.TryGetDate(row.Cell(7), out var chegada) ? chegada : (DateTime?)null;
                var kmInicial = ExcelHelper.GetInt(row.Cell(8));
                var kmFinal = ExcelHelper.GetInt(row.Cell(9));
                var distancia = ExcelHelper.GetInt(row.Cell(10));
                var valorFrete = ExcelHelper.GetDecimal(row.Cell(11));
                var status = ExcelHelper.GetString(row.Cell(12)) ?? "Planejada";
                var observacoes = ExcelHelper.GetString(row.Cell(13));

                var isNew = false;
                Viagem viagem;
                if (viagensPorNumero.TryGetValue(numeroKey, out var existente))
                {
                    viagem = existente;
                    updated++;
                }
                else
                {
                    viagem = new Viagem
                    {
                        NumeroViagem = numeroOriginal ?? numeroKey,
                        DataCadastro = now
                    };
                    _context.Viagens.Add(viagem);
                    viagensPorNumero[numeroKey] = viagem;
                    isNew = true;
                    inserted++;
                }

                viagem.NumeroViagem = numeroOriginal ?? numeroKey;
                viagem.CargaId = carga.Id;
                viagem.Carga = carga;
                viagem.VeiculoId = veiculo.Id;
                viagem.Veiculo = veiculo;
                viagem.MotoristaId = motorista.Id;
                viagem.Motorista = motorista;
                viagem.DataSaida = dataSaida;
                viagem.DataPrevisaoChegada = dataPrevisao;
                viagem.DataChegadaReal = dataChegada;
                viagem.KmInicial = kmInicial;
                viagem.KmFinal = kmFinal;
                viagem.DistanciaPercorrida = distancia ?? (kmInicial.HasValue && kmFinal.HasValue ? kmFinal.Value - kmInicial.Value : viagem.DistanciaPercorrida);
                viagem.ValorFrete = valorFrete;
                viagem.Status = string.IsNullOrWhiteSpace(status) ? "Planejada" : status;
                viagem.Observacoes = observacoes;
                viagem.DataAtualizacao = now;

                if (viagem.Status == "Concluída")
                {
                    veiculo.Status = "Disponível";
                    if (kmFinal.HasValue)
                    {
                        veiculo.KmAtual = kmFinal.Value;
                    }
                    carga.Status = "Entregue";
                }
                else if (viagem.Status == "Em Andamento" || viagem.Status == "Em Viagem")
                {
                    veiculo.Status = "Em Viagem";
                    carga.Status = "Em Transporte";
                }
                else if (isNew && viagem.Status != "Planejada")
                {
                    veiculo.Status = "Em Viagem";
                    carga.Status = "Em Transporte";
                }

                if (isNew)
                {
                    viagem.DataCadastro = now;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { inserted, updated, skipped });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao importar viagens");
            return StatusCode(500, new { message = "Erro interno ao importar viagens" });
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