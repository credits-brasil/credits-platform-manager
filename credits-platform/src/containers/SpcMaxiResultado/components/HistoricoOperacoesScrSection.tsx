import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GraphScoreComponent } from "@/components";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

interface HistoricoOperacoesScrSectionProps {
  spcData: any;
  scorePj: number;
  getScoreColor: (value: number) => string;
}

export function HistoricoOperacoesScrSection({
  spcData,
  scorePj,
  getScoreColor,
}: HistoricoOperacoesScrSectionProps) {
  const historicoScr =
    spcData?.["insumo-historico-operacao-scr"]?.[
      "detalhe-insumo-historico-operacao-scr"
    ];

  if (!historicoScr) return null;

  const grupoGarantia = historicoScr?.["grupo-garantia"] ?? [];
  const grupoModalidade = historicoScr?.["grupo-modalidade"] ?? [];
  const grupoCarteiraAtiva = historicoScr?.["grupo-carteira-ativa"] ?? [];

  const agrupamentoLabels: Record<string, string> = {
    A: "Anticrise",
    C: "Caução",
    H: "Hipoteca",
    O: "Outros",
    P: "Penhor",
  };

  const grupoModalidadeLabels: Record<string, string> = {
    F: "Financiamentos",
    A: "Adiantamentos",
    E: "Emprestimos",
    O: "Outras Operações ou Contratos",
    OA: "Operações de Arrendamento",
  };

  const grupoCarteiraAtivaVencerPorModalidadeLabels: Record<string, string> = {
    E: "Emprestimos",
    A: "Adiantamenos",
    F: "Financiamentos",
    O: "Outras Operações ou Contratos",
    OA: "Operações de Arrendamento",
    CA: "Cartão de Credito",
  };

  const grupoCarteiraAtivaVencidaPorModalidadeLabels: Record<string, string> = {
    E: "Emprestimos",
    A: "Adiantamenos",
    F: "Financiamentos",
    O: "Outras Operações",
    C: "Contratos",
    OA: "Operações de Arrendamento",
  };

  const grupoCarteiraAtivaVencidaPrejuizoPorModalidadeLabels: Record<
    string,
    string
  > = {
    E: "Emprestimos",
    A: "Adiantamenos",
    F: "Financiamentos",
    O: "Outras Operações",
    OA: "Operações de Arrendamento",
  };

  const valorEstimadoCarteiraAtivaInicial = Number(
    historicoScr?.["valor-total-carteira-ativa-inicial"] ?? 0,
  );
  const valorEstimadoCarteiraAtivaFinal = Number(
    historicoScr?.["valor-total-carteira-ativa-final"] ?? 0,
  );
  const valorEstimadoCarteiraAtivaVencerInicial = Number(
    historicoScr?.["valor-total-carteira-ativa-vencer-inicial"] ?? 0,
  );
  const valorEstimadoCarteiraAtivaVencerFinal = Number(
    historicoScr?.["valor-total-carteira-ativa-vencer-final"] ?? 0,
  );
  const valorEstimadoCarteiraAtivaVencerPorModalidadeInicial = Number(
    historicoScr?.[
      "valor-total-carteira-ativa-vencer-por-modalidade-inicial"
    ] ?? 0,
  );
  const valorEstimadoCarteiraAtivaVencerPorModalidadeFinal = Number(
    historicoScr?.["valor-total-carteira-ativa-vencer-por-modalidade-final"] ??
      0,
  );
  const valorEstimadoCarteiraAtivaVencidaPorModalidadeInicial = Number(
    historicoScr?.[
      "valor-total-carteira-ativa-vencida-por-modalidade-inicial"
    ] ?? 0,
  );
  const valorEstimadoCarteiraAtivaVencidaPorModalidadeFinal = Number(
    historicoScr?.["valor-total-carteira-ativa-vencida-por-modalidade-final"] ??
      0,
  );
  const valorEstimadoCarteiraAtivaVencidaPrejuizoPorModalidadeInicial = Number(
    historicoScr?.[
      "valor-total-carteira-ativa-vencida-prejuizo-por-modalidade-inicial"
    ] ?? 0,
  );
  const valorEstimadoCarteiraAtivaVencidaPrejuizoPorModalidadeFinal = Number(
    historicoScr?.[
      "valor-total-carteira-ativa-vencida-prejuizo-por-modalidade-final"
    ] ?? 0,
  );

  const getValorEstimadoTotal = (title: string) => {
    switch (title) {
      case "Total Garantia":
      case "Carteira Ativa Total":
        return {
          inicial: valorEstimadoCarteiraAtivaInicial,
          final: valorEstimadoCarteiraAtivaFinal,
        };
      case "Carteira Ativa a Vencer por Modalidade":
        return {
          inicial: valorEstimadoCarteiraAtivaVencerPorModalidadeInicial,
          final: valorEstimadoCarteiraAtivaVencerPorModalidadeFinal,
        };
      case "Carteira Ativa Vencida por Modalidade":
        return {
          inicial: valorEstimadoCarteiraAtivaVencidaPorModalidadeInicial,
          final: valorEstimadoCarteiraAtivaVencidaPorModalidadeFinal,
        };
      case "Carteiras Vencidas em Prejuizo por Modalidade":
        return {
          inicial:
            valorEstimadoCarteiraAtivaVencidaPrejuizoPorModalidadeInicial,
          final: valorEstimadoCarteiraAtivaVencidaPrejuizoPorModalidadeFinal,
        };
      case "Carteira ativa a vencer":
        return {
          inicial: valorEstimadoCarteiraAtivaVencerInicial,
          final: valorEstimadoCarteiraAtivaVencerFinal,
        };
      default:
        return { inicial: 0, final: 0 };
    }
  };

  const grupoCarteiraAtivaLabels: Record<string, string> = {
    ATE90DIAS: "Até 90 dias",
    DE91ATE360DIAS: "De 91 até 360 dias",
    DE361ATE1080DIAS: "De 361 até 1080 dias",
    DE1081ATE1800DIAS: "De 1081 até 1800 dias",
    DE1801ATE5400DIAS: "De 1801 até 5400 dias",
    ACIMA5400DIAS: "Acima de 5400 dias",
  };

  const grupoCarteiraAtivaColors: Record<string, string> = {
    ATE90DIAS: "#648FD0",
    DE91ATE360DIAS: "#4A5FA6",
    DE361ATE1080DIAS: "#313D77",
    DE1081ATE1800DIAS: "#E2A742",
    DE1801ATE5400DIAS: "#E1C12E",
    ACIMA5400DIAS: "#9B9B9B",
  };

  const grupoCarteiraAtivaChartData: Array<{
    key: string;
    label: string;
    percentual: number;
    color: string;
  }> = grupoCarteiraAtiva.map(
    (row: { agrupamento?: string; percentual?: string }) => ({
      key: row?.agrupamento ?? "-",
      label:
        grupoCarteiraAtivaLabels[row?.agrupamento ?? ""] ??
        row?.agrupamento ??
        "-",
      percentual: Number(row?.percentual ?? 0),
      color: grupoCarteiraAtivaColors[row?.agrupamento ?? ""] ?? "#9B9B9B",
    }),
  );

  const renderGrupoTable = (
    title: string,
    rows: Array<{ agrupamento?: string; percentual?: string }>,
    useAgrupamentoLabel = false,
    labelMap: Record<string, string> = agrupamentoLabels,
    valorInicial?: number,
    valorFinal?: number,
  ) => {
    const valoresDoTitulo = getValorEstimadoTotal(title);
    const valorTotalInicial = valorInicial ?? valoresDoTitulo.inicial;
    const valorTotalFinal = valorFinal ?? valoresDoTitulo.final;
    const headerLabel =
      title === "Carteira ativa a vencer" ? "Faixa" : "Classificação";

    return (
      <div className="rounded-lg border border-gray-100 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
          {title}
        </p>

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {headerLabel}
              </th>

              <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Percentual
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => {
              const agrupamentoKey = String(
                row?.agrupamento ?? "",
              ).toUpperCase();
              const agrupamentoLabel = useAgrupamentoLabel
                ? (labelMap[agrupamentoKey] ?? row?.agrupamento ?? "-")
                : (row?.agrupamento ?? "-");

              return (
                <tr
                  key={`${title}-${row?.agrupamento ?? "item"}-${idx}`}
                  className="border-b border-gray-50 last:border-b-0"
                >
                  <td className="py-2 pr-3 text-gray-700">
                    {agrupamentoLabel}
                  </td>
                  <td className="py-2 text-right font-bold text-gray-700">
                    {row?.percentual ?? "0"}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {title !== "Total Garantia" && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            <p className="text-[12px] text-gray-600">
              Valor estimado total entre{" "}
              <strong className="text-[#2D4F91]">
                {formatCurrency(valorTotalInicial)}
              </strong>{" "}
              a{" "}
              <strong className="text-[#2D4F91]">
                {formatCurrency(valorTotalFinal)}
              </strong>
            </p>
          </div>
        )}
      </div>
    );
  };

  const scoreScr = Number(historicoScr?.score ?? scorePj ?? 0);
  const normalizedScoreScr = Math.min(Math.max(scoreScr, 0), 1000);
  const scoreScrColor = getScoreColor(normalizedScoreScr);

  const scoreScrRisco = (() => {
    if (normalizedScoreScr >= 675) {
      return {
        label: "Risco Baixo",
        badge: { backgroundColor: "#DCFCE7", color: "#15803D" },
      };
    }

    if (normalizedScoreScr >= 467) {
      return {
        label: "Risco Médio",
        badge: { backgroundColor: "#FEF3C7", color: "#D97706" },
      };
    }

    return {
      label: "Risco Alto",
      badge: { backgroundColor: "#FEE2E2", color: "#DC2626" },
    };
  })();

  const scoreArcLength = 2 * Math.PI * 50 * 0.75;
  const scoreCircumference = 2 * Math.PI * 50;

  return (
    <div
      id="section-historico-scr"
      className="mb-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <h2 className="mb-4 text-sm font-semibold text-gray-700">
        Historico de Operações no SCR
      </h2>

      <div className="mb-5 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-center md:justify-start">
          <GraphScoreComponent
            className="flex items-center gap-5"
            normalizedScore={normalizedScoreScr}
            scoreColor={scoreScrColor}
            radius={50}
            arcLength={scoreArcLength}
            circumference={scoreCircumference}
            progressLength={(normalizedScoreScr / 1000) * scoreArcLength}
            badgeStyle={scoreScrRisco.badge}
            badgeLabel={scoreScrRisco.label}
            headerContent={
              <span className="text-xs text-gray-500">
                Fonte: <strong className="text-xs text-gray-700">SCR</strong>
              </span>
            }
            message={historicoScr?.mensagem ?? ""}
            secondaryBadge={{
              label: "Probabilidade de inadimplência",
              value: `${Number(
                historicoScr?.["probabilidade-inadimplencia"] ?? 0,
              ).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}%`,
              style:
                Number(historicoScr?.["probabilidade-inadimplencia"] ?? 0) <= 5
                  ? {
                      backgroundColor: "#DCFCE7",
                      borderColor: "#86EFAC",
                      color: "#166534",
                    }
                  : Number(
                        historicoScr?.["probabilidade-inadimplencia"] ?? 0,
                      ) <= 10
                    ? {
                        backgroundColor: "#FEF3C7",
                        borderColor: "#FCD34D",
                        color: "#92400E",
                      }
                    : {
                        backgroundColor: "#FEE2E2",
                        borderColor: "#FCA5A5",
                        color: "#991B1B",
                      },
            }}
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Quantidade
          </span>
          <span className="text-base font-bold text-gray-800">
            {historicoScr?.quantidade ?? "0"}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Instituições no SCR
          </span>
          <span className="text-base font-bold text-gray-800">
            {historicoScr?.["quantidade-instituicao-scr"] ?? "0"}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Quantidade Garantias
          </span>
          <span className="text-base font-bold text-gray-800">
            {historicoScr?.["quantidade-garantia"] ?? "0"}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Início Relacionamento
          </span>
          <span className="text-base font-bold text-gray-800">
            {formatDate(historicoScr?.["data-inicio-relacionamento"])}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Venc. Última Parcela
          </span>
          <span className="text-base font-bold text-gray-800">
            {formatDate(historicoScr?.["vencimento-ultima-parcela"])}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Atualização Base
          </span>

          <span className="text-base font-bold text-gray-800">
            {formatDate(historicoScr?.["data-atualizacao-base"])}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Total de Vencidos em Prejuízo
          </span>

          <span className="text-base font-bold text-gray-800">
            {historicoScr?.["quantidade-operacoes-prejuizo"]}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Quantidade de Operações Vencidas
          </span>

          <span className="text-base font-bold text-gray-800">
            {historicoScr?.["quantidade-operacoes-vencidas"]}
          </span>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "#F8F9FB" }}
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Contratado
          </span>

          <span className="text-base font-bold text-gray-800">
            {formatCurrency(historicoScr?.["valor-total-contratado-inicial"])} a{" "}
            {formatCurrency(historicoScr?.["valor-total-contratado-final"])}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {renderGrupoTable(
          "Total Garantia",
          grupoGarantia,
          true,
          agrupamentoLabels,
        )}

        {renderGrupoTable(
          "Carteira Ativa Total",
          grupoModalidade,
          true,
          grupoModalidadeLabels,
          valorEstimadoCarteiraAtivaInicial,
          valorEstimadoCarteiraAtivaFinal,
        )}

        {renderGrupoTable(
          "Carteiras Vencidas em Prejuizo por Modalidade",
          historicoScr?.[
            "grupo-carteira-ativa-vencida-prejuizo-por-modalidade"
          ] ?? [],
          true,
          grupoCarteiraAtivaVencidaPrejuizoPorModalidadeLabels,
          valorEstimadoCarteiraAtivaVencidaPrejuizoPorModalidadeInicial,
          valorEstimadoCarteiraAtivaVencidaPrejuizoPorModalidadeFinal,
        )}

        {renderGrupoTable(
          "Carteira Ativa Vencida por Modalidade",
          historicoScr?.["grupo-carteira-ativa-vencida-por-modalidade"] ?? [],
          true,
          grupoCarteiraAtivaVencidaPorModalidadeLabels,
          valorEstimadoCarteiraAtivaVencidaPorModalidadeInicial,
          valorEstimadoCarteiraAtivaVencidaPorModalidadeFinal,
        )}

        {renderGrupoTable(
          "Carteira Ativa a Vencer por Modalidade",
          historicoScr?.["grupo-carteira-ativa-vencer-por-modalidade"] ?? [],
          true,
          grupoCarteiraAtivaVencerPorModalidadeLabels,
          valorEstimadoCarteiraAtivaVencerPorModalidadeInicial,
          valorEstimadoCarteiraAtivaVencerPorModalidadeFinal,
        )}

        {renderGrupoTable(
          "Carteira ativa a vencer",
          grupoCarteiraAtivaChartData.map((row) => ({
            agrupamento: row.label,
            percentual: String(row.percentual),
          })),
          false,
          grupoCarteiraAtivaLabels,
          valorEstimadoCarteiraAtivaVencerInicial,
          valorEstimadoCarteiraAtivaVencerFinal,
        )}
      </div>
    </div>
  );
}
