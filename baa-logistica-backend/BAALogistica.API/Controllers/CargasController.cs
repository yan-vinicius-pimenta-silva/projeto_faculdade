// ============================================
// BAALogistica.API/Controllers/CargasController.cs
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
public class CargasController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<CargasController> _logger;

    public CargasController(AppDbContext context, ILogger<CargasController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportCargas()
    {
        try
        {
            var cargas = await _context.Cargas
                .Include(c => c.Cliente)
                .AsNoTracking()
                .OrderBy(c => c.NumeroProtocolo)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Cargas");
            var headers = new[]
            {
                "NumeroProtocolo",
                "ClienteDocumento",
                "ClienteRazaoSocial",
                "TipoCarga",
                "DescricaoCarga",
                "PesoCarga",
                "VolumeCarga",
                "ValorCarga",
                "EnderecoColeta",
                "CidadeColeta",
                "EstadoColeta",
                "EnderecoEntrega",
                "CidadeEntrega",
                "EstadoEntrega",
                "DataPrevistaColeta",
                "DataPrevistaEntrega",
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
            foreach (var carga in cargas)
            {
                var documentoCliente = carga.Cliente?.CNPJ;
                if (string.IsNullOrWhiteSpace(documentoCliente))
                {
                    documentoCliente = carga.Cliente?.CPF;
                }

                worksheet.Cell(rowIndex, 1).Value = carga.NumeroProtocolo;
                worksheet.Cell(rowIndex, 2).Value = documentoCliente;
                worksheet.Cell(rowIndex, 3).Value = carga.Cliente?.RazaoSocial;
                worksheet.Cell(rowIndex, 4).Value = carga.TipoCarga;
                worksheet.Cell(rowIndex, 5).Value = carga.DescricaoCarga;
                worksheet.Cell(rowIndex, 6).Value = carga.PesoCarga;
                worksheet.Cell(rowIndex, 7).Value = carga.VolumeCarga;
                worksheet.Cell(rowIndex, 8).Value = carga.ValorCarga;
                worksheet.Cell(rowIndex, 9).Value = carga.EnderecoColeta;
                worksheet.Cell(rowIndex, 10).Value = carga.CidadeColeta;
                worksheet.Cell(rowIndex, 11).Value = carga.EstadoColeta;
                worksheet.Cell(rowIndex, 12).Value = carga.EnderecoEntrega;
                worksheet.Cell(rowIndex, 13).Value = carga.CidadeEntrega;
                worksheet.Cell(rowIndex, 14).Value = carga.EstadoEntrega;
                worksheet.Cell(rowIndex, 15).Value = carga.DataPrevistaColeta;
                worksheet.Cell(rowIndex, 15).Style.DateFormat.Format = "yyyy-MM-dd";
                worksheet.Cell(rowIndex, 16).Value = carga.DataPrevistaEntrega;
                worksheet.Cell(rowIndex, 16).Style.DateFormat.Format = "yyyy-MM-dd";
                worksheet.Cell(rowIndex, 17).Value = carga.Status;
                worksheet.Cell(rowIndex, 18).Value = carga.Observacoes;
                rowIndex++;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            var fileName = $"cargas_{DateTime.UtcNow:yyyyMMddHHmmss}.xlsx";
            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao exportar cargas");
            return StatusCode(500, new { message = "Erro interno ao exportar cargas" });
        }
    }

    [HttpPost("import")]
    public async Task<IActionResult> ImportCargas(IFormFile file)
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

            var clientes = await _context.Clientes.ToListAsync();
            var clientesPorDocumento = clientes
                .SelectMany(c => new[]
                {
                    new { Documento = ExcelHelper.NormalizeDigits(c.CNPJ), Cliente = c },
                    new { Documento = ExcelHelper.NormalizeDigits(c.CPF), Cliente = c }
                })
                .Where(x => !string.IsNullOrEmpty(x.Documento))
                .GroupBy(x => x.Documento)
                .ToDictionary(x => x.Key, x => x.First().Cliente);

            var cargasExistentes = await _context.Cargas
                .Include(c => c.Cliente)
                .ToListAsync();
            var cargasPorProtocolo = cargasExistentes
                .Where(c => !string.IsNullOrWhiteSpace(c.NumeroProtocolo))
                .ToDictionary(c => ExcelHelper.NormalizeText(c.NumeroProtocolo).ToUpperInvariant(), c => c);

            var now = DateTime.Now;
            var inserted = 0;
            var updated = 0;
            var skipped = 0;

            foreach (var row in rows)
            {
                var protocoloOriginal = ExcelHelper.GetString(row.Cell(1));
                var protocoloKey = ExcelHelper.NormalizeText(protocoloOriginal)?.ToUpperInvariant();
                var clienteDocumento = ExcelHelper.NormalizeDigits(ExcelHelper.GetString(row.Cell(2)));

                if (string.IsNullOrEmpty(protocoloKey) ||
                    string.IsNullOrEmpty(clienteDocumento))
                {
                    skipped++;
                    continue;
                }

                if (clienteDocumento.Length != 11 && clienteDocumento.Length != 14)
                {
                    skipped++;
                    continue;
                }

                if (!clientesPorDocumento.TryGetValue(clienteDocumento, out var cliente))
                {
                    skipped++;
                    continue;
                }

                var tipoCarga = ExcelHelper.GetString(row.Cell(4));
                var descricao = ExcelHelper.GetString(row.Cell(5));
                var peso = ExcelHelper.GetDecimal(row.Cell(6));

                if (string.IsNullOrWhiteSpace(tipoCarga) || string.IsNullOrWhiteSpace(descricao) || !peso.HasValue)
                {
                    skipped++;
                    continue;
                }

                var volume = ExcelHelper.GetDecimal(row.Cell(7));
                var valor = ExcelHelper.GetDecimal(row.Cell(8));
                var enderecoColeta = ExcelHelper.GetString(row.Cell(9));
                var cidadeColeta = ExcelHelper.GetString(row.Cell(10));
                var estadoColeta = ExcelHelper.GetString(row.Cell(11));
                var enderecoEntrega = ExcelHelper.GetString(row.Cell(12));
                var cidadeEntrega = ExcelHelper.GetString(row.Cell(13));
                var estadoEntrega = ExcelHelper.GetString(row.Cell(14));
                var dataPrevistaColeta = ExcelHelper.TryGetDate(row.Cell(15), out var coleta) ? coleta : (DateTime?)null;
                var dataPrevistaEntrega = ExcelHelper.TryGetDate(row.Cell(16), out var entrega) ? entrega : (DateTime?)null;
                var status = ExcelHelper.GetString(row.Cell(17)) ?? "Aguardando";
                var observacoes = ExcelHelper.GetString(row.Cell(18));

                var isNew = false;
                Carga carga;
                if (cargasPorProtocolo.TryGetValue(protocoloKey, out var existente))
                {
                    carga = existente;
                    updated++;
                }
                else
                {
                    carga = new Carga
                    {
                        NumeroProtocolo = protocoloOriginal ?? protocoloKey,
                        DataCadastro = now
                    };
                    _context.Cargas.Add(carga);
                    cargasPorProtocolo[protocoloKey] = carga;
                    isNew = true;
                    inserted++;
                }

                carga.NumeroProtocolo = protocoloOriginal ?? protocoloKey;
                carga.ClienteId = cliente.Id;
                carga.Cliente = cliente;
                carga.TipoCarga = tipoCarga;
                carga.DescricaoCarga = descricao;
                carga.PesoCarga = peso.Value;
                carga.VolumeCarga = volume;
                carga.ValorCarga = valor;
                carga.EnderecoColeta = enderecoColeta ?? string.Empty;
                carga.CidadeColeta = cidadeColeta ?? string.Empty;
                carga.EstadoColeta = estadoColeta ?? string.Empty;
                carga.EnderecoEntrega = enderecoEntrega ?? string.Empty;
                carga.CidadeEntrega = cidadeEntrega ?? string.Empty;
                carga.EstadoEntrega = estadoEntrega ?? string.Empty;
                carga.DataPrevistaColeta = dataPrevistaColeta;
                carga.DataPrevistaEntrega = dataPrevistaEntrega;
                carga.Status = string.IsNullOrWhiteSpace(status) ? "Aguardando" : status;
                carga.Observacoes = observacoes;
                carga.DataAtualizacao = now;

                if (isNew)
                {
                    _context.HistoricoStatusCargas.Add(new HistoricoStatusCarga
                    {
                        Carga = carga,
                        StatusNovo = carga.Status,
                        Observacoes = "Carga importada via Excel",
                        DataMudanca = now
                    });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { inserted, updated, skipped });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao importar cargas");
            return StatusCode(500, new { message = "Erro interno ao importar cargas" });
        }
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