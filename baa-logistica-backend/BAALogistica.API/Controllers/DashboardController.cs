// ============================================
// BAALogistica.API/Controllers/DashboardController.cs
// ============================================

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BAALogistica.Infrastructure.Data;

namespace BAALogistica.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(AppDbContext context, ILogger<DashboardController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("estatisticas")]
        public async Task<ActionResult<object>> GetEstatisticas()
        {
            try
            {
                var totalMotoristas = await _context.Motoristas.CountAsync();
                var motoristasAtivos = await _context.Motoristas.CountAsync(m => m.Status == "Ativo");
                
                var totalVeiculos = await _context.Veiculos.CountAsync();
                var veiculosDisponiveis = await _context.Veiculos.CountAsync(v => v.Status == "Disponível");
                var veiculosEmViagem = await _context.Veiculos.CountAsync(v => v.Status == "Em Viagem");
                var veiculosManutencao = await _context.Veiculos.CountAsync(v => v.Status == "Manutenção");

                var totalCargas = await _context.Cargas.CountAsync();
                var cargasAguardando = await _context.Cargas.CountAsync(c => c.Status == "Aguardando");
                var cargasEmTransporte = await _context.Cargas.CountAsync(c => c.Status == "Em Transporte");
                var cargasEntregues = await _context.Cargas.CountAsync(c => c.Status == "Entregue");

                var totalViagens = await _context.Viagens.CountAsync();
                var viagensPlanejadas = await _context.Viagens.CountAsync(v => v.Status == "Planejada");
                var viagensEmAndamento = await _context.Viagens.CountAsync(v => v.Status == "Em Andamento");
                var viagensConcluidas = await _context.Viagens.CountAsync(v => v.Status == "Concluída");

                var totalClientes = await _context.Clientes.CountAsync();
                var clientesAtivos = await _context.Clientes.CountAsync(c => c.Status == "Ativo");

                return Ok(new
                {
                    motoristas = new
                    {
                        total = totalMotoristas,
                        ativos = motoristasAtivos,
                        inativos = totalMotoristas - motoristasAtivos
                    },
                    veiculos = new
                    {
                        total = totalVeiculos,
                        disponiveis = veiculosDisponiveis,
                        emViagem = veiculosEmViagem,
                        manutencao = veiculosManutencao
                    },
                    cargas = new
                    {
                        total = totalCargas,
                        aguardando = cargasAguardando,
                        emTransporte = cargasEmTransporte,
                        entregues = cargasEntregues
                    },
                    viagens = new
                    {
                        total = totalViagens,
                        planejadas = viagensPlanejadas,
                        emAndamento = viagensEmAndamento,
                        concluidas = viagensConcluidas
                    },
                    clientes = new
                    {
                        total = totalClientes,
                        ativos = clientesAtivos
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar estatísticas do dashboard");
                return StatusCode(500, "Erro interno ao buscar estatísticas");
            }
        }

        [HttpGet("viagens-ativas")]
        public async Task<ActionResult<IEnumerable<object>>> GetViagensAtivas()
        {
            try
            {
                var viagensAtivas = await _context.Viagens
                    .Include(v => v.Motorista)
                    .Include(v => v.Veiculo)
                    .Include(v => v.Carga)
                        .ThenInclude(c => c.Cliente)
                    .Where(v => v.Status == "Em Andamento" || v.Status == "Planejada")
                    .OrderBy(v => v.DataPrevisaoChegada)
                    .Select(v => new
                    {
                        v.Id,
                        v.NumeroViagem,
                        v.Status,
                        v.DataSaida,
                        v.DataPrevisaoChegada,
                        motorista = new
                        {
                            v.Motorista.Id,
                            v.Motorista.Nome,
                            v.Motorista.Telefone
                        },
                        veiculo = new
                        {
                            v.Veiculo.Id,
                            v.Veiculo.Placa,
                            v.Veiculo.Modelo
                        },
                        carga = new
                        {
                            v.Carga.Id,
                            v.Carga.NumeroProtocolo,
                            v.Carga.DescricaoCarga,
                            v.Carga.CidadeColeta,
                            v.Carga.CidadeEntrega,
                            cliente = v.Carga.Cliente.RazaoSocial
                        }
                    })
                    .ToListAsync();

                return Ok(viagensAtivas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar viagens ativas");
                return StatusCode(500, "Erro interno ao buscar viagens ativas");
            }
        }

        [HttpGet("ultimas-cargas")]
        public async Task<ActionResult<IEnumerable<object>>> GetUltimasCargas([FromQuery] int quantidade = 10)
        {
            try
            {
                var ultimasCargas = await _context.Cargas
                    .Include(c => c.Cliente)
                    .OrderByDescending(c => c.DataCadastro)
                    .Take(quantidade)
                    .Select(c => new
                    {
                        c.Id,
                        c.NumeroProtocolo,
                        c.Status,
                        c.DescricaoCarga,
                        c.PesoCarga,
                        c.CidadeColeta,
                        c.CidadeEntrega,
                        c.DataCadastro,
                        cliente = c.Cliente.RazaoSocial
                    })
                    .ToListAsync();

                return Ok(ultimasCargas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar últimas cargas");
                return StatusCode(500, "Erro interno ao buscar últimas cargas");
            }
        }

        [HttpGet("grafico-viagens-mes")]
        public async Task<ActionResult<object>> GetGraficoViagensMes()
        {
            try
            {
                var dataInicio = DateTime.Now.AddMonths(-6);
                
                var viagensPorMes = await _context.Viagens
                    .Where(v => v.DataCadastro >= dataInicio)
                    .GroupBy(v => new { v.DataCadastro.Year, v.DataCadastro.Month })
                    .Select(g => new
                    {
                        ano = g.Key.Year,
                        mes = g.Key.Month,
                        quantidade = g.Count(),
                        concluidas = g.Count(v => v.Status == "Concluída")
                    })
                    .OrderBy(g => g.ano)
                    .ThenBy(g => g.mes)
                    .ToListAsync();

                return Ok(viagensPorMes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar gráfico de viagens por mês");
                return StatusCode(500, "Erro interno ao buscar gráfico");
            }
        }
    }
}