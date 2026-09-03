import { formatCurrency } from "@/utils/formatCurrency";

type InformacoesPositivasSectionProps = {
  spcData: any;
};

export function InformacoesPositivasSection({
  spcData,
}: InformacoesPositivasSectionProps) {
  const comportamentoDetalhe =
    spcData?.["indice-comportamento-gastos-cadastro-positivo"]?.[
      "detalhe-indice-comportamento-gastos-cadastro-positivo"
    ];

  const segmentosComportamento = comportamentoDetalhe?.segmentos ?? [];

  const pontualidadeDetalhe =
    spcData?.["indice-pontualidade-pagamento-cadastro-positivo"]?.[
      "detalhe-indice-pontualidade-pagamento-cadastro-positivo"
    ];

  const segmentosPontualidade = pontualidadeDetalhe?.segmentos ?? [];

  if (!segmentosComportamento.length && !segmentosPontualidade.length) {
    return null;
  }

  const gastoInicial = Number(comportamentoDetalhe?.["gasto-total-inicial"] ?? 0);
  const gastoFinal = Number(comportamentoDetalhe?.["gasto-total-final"] ?? 0);
  const temFaixaGasto = gastoInicial > 0 || gastoFinal > 0;

  return (
    <div
      id="section-informacoes-positivas"
      className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
    >
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        Informações Positivas
      </h2>

      {segmentosComportamento.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          {temFaixaGasto ? (
            <div
              className="mb-3 flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: "#F8F9FB" }}
            >
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                Gasto médio mensal
              </span>

              <span className="text-base font-bold text-gray-800">
                Entre {formatCurrency(gastoInicial).replace(/\s/g, "")} e{" "}
                {formatCurrency(gastoFinal).replace(/\s/g, "")}
              </span>
            </div>
          ) : (
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Índice de comportamento de gastos
            </p>
          )}

          <table className="w-full text-xs table-fixed">
            <colgroup>
              <col style={{ width: "65%" }} />
              <col style={{ width: "35%" }} />
            </colgroup>

            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4">
                  Categoria
                </th>

                <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-0">
                  % de Representatividade
                </th>
              </tr>
            </thead>

            <tbody>
              {segmentosComportamento.map((segmento: any, index: number) => {
                const percentual = Number(
                  segmento?.["porcentual-representatividade"] ?? 0,
                );
                const percentualExibicao = Number.isFinite(percentual)
                  ? percentual
                  : 0;

                return (
                  <tr
                    key={`${segmento?.nome ?? "segmento"}-${index}`}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-2.5 pr-4 text-gray-700 font-medium">
                      {segmento?.nome ?? "-"}
                    </td>

                    <td
                      className={`py-2.5 pr-0 text-right text-gray-600 whitespace-nowrap ${
                        percentualExibicao !== 0 ? "font-semibold" : "font-normal"
                      }`}
                    >
                      {percentualExibicao === 0
                        ? "0%"
                        : percentualExibicao === 100
                          ? "100%"
                          : `${percentualExibicao.toFixed(2)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {segmentosPontualidade.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Índice pontualidade de pagamento
          </p>

          <table className="w-full text-xs table-fixed">
            <thead>
              <tr className="border-b border-gray-100">
                <th
                  rowSpan={2}
                  className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide py-2 pr-4"
                >
                  Categoria
                </th>
                <th
                  colSpan={5}
                  className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide py-2"
                ></th>
                <th
                  colSpan={2}
                  className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide py-2"
                ></th>
              </tr>

              <tr className="border-b border-gray-100">
                <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 px-1">
                  Em dia
                </th>
                <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 px-1">
                  Até 15 dias após vencimento.
                </th>
                <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 px-1">
                  Entre 15 e 30 dias
                </th>
                <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 px-1">
                  Entre 30 e 90 dias
                </th>
                <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 px-1">
                  Acima de 90 dias
                </th>
                <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 px-1">
                  Até 30 dias após vencimento.
                </th>
                <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 px-1">
                  Mais de 30 dias
                </th>
              </tr>
            </thead>

            <tbody>
              {segmentosPontualidade.map((segmento: any, index: number) => {
                const periodosMap = new Map<string, number>(
                  (segmento?.periodos ?? []).map((periodo: any) => [
                    periodo?.descricao,
                    Number(periodo?.porcentual ?? 0),
                  ]),
                );

                const colunas = [
                  "PAGAMENTO_EM_DIA",
                  "PAGAMENTO_ATE_15_DIAS",
                  "PAGAMENTO_ENTRE_15_E_30_DIAS_APOS_VENCIMENTO",
                  "PAGAMENTO_ENTRE_30_E_90_DIAS_APOS_VENCIMENTO",
                  "PAGAMENTO_ACIMA_DE_90_DIAS_APOS_VENCIMENTO",
                  "SEM_INFORMACOES_PAGAMENTO_ATE_30_DIAS_APOS_VENCIMENTO",
                  "SEM_INFORMACOES_PAGAMENTO_ACIMA_DE_30_DIAS_APOS_VENCIMENTO",
                ];

                return (
                  <tr
                    key={`${segmento?.nome ?? "categoria"}-${index}`}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-2.5 pr-4 text-gray-700 font-medium">
                      {segmento?.nome ?? "-"}
                    </td>

                    {colunas.map((descricao) => {
                      const valor = Number(periodosMap.get(descricao) ?? 0);
                      const percentual = Number.isFinite(valor) ? valor : 0;

                      return (
                        <td
                          key={descricao}
                          className={`py-2.5 px-1 text-center text-gray-600 whitespace-nowrap ${
                            percentual !== 0 ? "font-semibold" : "font-normal"
                          }`}
                        >
                          {percentual === 0
                            ? "0%"
                            : percentual === 100
                              ? "100%"
                              : `${percentual.toFixed(2)}%`}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
