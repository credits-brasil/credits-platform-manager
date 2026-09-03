import { Fragment, useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, Search } from "lucide-react";
import { formatCEP } from "@/utils/formatCEP";
import { formatCNPJ } from "@/utils/formatCNPJ";
import { formatCPF } from "@/utils/formatCPF";
import { formatDate } from "@/utils/formatDate";
import { formatPhone } from "@/utils/formatPhone";

interface GovernancaSectionProps {
  spcData: any;
}

export function GovernancaSection({ spcData }: GovernancaSectionProps) {
  const [governancaTab, setGovernancaTab] = useState<
    "controle-societario" | "quadro-administrativo" | "participacao-empresa"
  >("controle-societario");
  const [governancaExpandedRow, setGovernancaExpandedRow] = useState<
    string | null
  >(null);

  useEffect(() => {
    setGovernancaExpandedRow(null);
  }, [governancaTab]);

  const quadroSocial =
    spcData?.["quadro-social-mais-completo-pj"]?.[
      "detalhe-quadro-social-mais-completo-pj"
    ];

  const controleSocietario = quadroSocial?.["controle-societario"] ?? [];
  const quadroAdministrativo = quadroSocial?.["quadro-administrativo"] ?? [];
  const participacaoEmpresa =
    spcData?.["participacao-empresa"]?.["detalhe-participacao-empresa"] ?? [];

  if (
    !controleSocietario.length &&
    !quadroAdministrativo.length &&
    !participacaoEmpresa.length
  ) {
    return null;
  }

  const activeRows =
    governancaTab === "controle-societario"
      ? controleSocietario
      : governancaTab === "quadro-administrativo"
        ? quadroAdministrativo
        : participacaoEmpresa;

  const formatDocument = (document?: string) => {
    if (!document) return "-";

    const digits = document.replace(/\D/g, "");
    if (digits.length === 11) return formatCPF(digits);
    if (digits.length === 14) return formatCNPJ(digits);
    return document;
  };

  const getInfoParts = (row: any) => ({
    info1: row?.["informacoes-adicionais-1"]?.$ ?? {},
    info2: row?.["informacoes-adicionais-2"]?.$ ?? {},
    info3: row?.["informacoes-adicionais-3"]?.$ ?? {},
    restricoes: row?.restricoes?.$ ?? null,
    semRestricoes: row?.["sem-restricoes"] ?? [],
  });

  const hasAdditionalInfo = (row: any) => {
    const { info1, info2, info3, restricoes, semRestricoes } = getInfoParts(row);

    return (
      Object.keys(info1).length > 0 ||
      Object.keys(info2).length > 0 ||
      Object.keys(info3).length > 0 ||
      Boolean(restricoes) ||
      semRestricoes.length > 0
    );
  };

  return (
    <div
      id="section-governanca"
      className="mb-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <div className="mb-4 flex items-center">
        <h2 className="text-sm font-semibold text-gray-700">Governança</h2>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          {
            key: "controle-societario" as const,
            label: "Controle Societário",
            count: controleSocietario.length,
            helper: "Quadro Social mais completo",
          },
          {
            key: "quadro-administrativo" as const,
            label: "Quadro Administrativo",
            count: quadroAdministrativo.length,
            helper: "Quadro Social mais completo",
          },
          {
            key: "participacao-empresa" as const,
            label: "Participação Empresa",
            count: participacaoEmpresa.length,
            helper: "Participações societárias",
          },
        ].map((tab) => {
          const isActive = governancaTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setGovernancaTab(tab.key)}
              className="text-left rounded-xl border p-3 transition-all"
              style={{
                borderColor: isActive ? "#ED884A" : "#E5E7EB",
                backgroundColor: isActive ? "#FFFBF7" : "#fff",
                boxShadow: isActive
                  ? "0 6px 20px rgba(237, 136, 74, 0.18)"
                  : "0 1px 2px rgba(15, 23, 42, 0.04)",
              }}
            >
              <div className="mb-2 flex items-center gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                  {tab.label}
                </p>
              </div>

              <hr className="mb-2 border-gray-200" />

              <div className="mb-1 text-right">
                <span
                  className="text-2xl font-bold leading-none"
                  style={{ color: isActive ? "#ED884A" : "#1F2937" }}
                >
                  {tab.count}
                </span>
              </div>

              <span className="inline-flex max-w-full rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                <span className="truncate">{tab.helper}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <table className="w-full table-fixed text-xs">
          {governancaTab === "controle-societario" ? (
            <colgroup>
              <col style={{ width: "150px" }} />
              <col style={{ width: "100%" }} />
              <col style={{ width: "70px" }} />
              <col style={{ width: "110px" }} />
              <col style={{ width: "70px" }} />
              <col style={{ width: "70px" }} />
              <col style={{ width: "30px" }} />
            </colgroup>
          ) : governancaTab === "quadro-administrativo" ? (
            <colgroup>
              <col style={{ width: "120px" }} />
              <col style={{ width: "100%" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "30px" }} />
            </colgroup>
          ) : (
            <colgroup>
              <col style={{ width: "150px" }} />
              <col style={{ width: "100%" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "70px" }} />
            </colgroup>
          )}

          <thead>
            {governancaTab === "controle-societario" ? (
              <tr className="border-b border-gray-100">
                <th className="w-[140px] pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Documento
                </th>
                <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Sócio/Acionista
                </th>
                <th className="w-[90px] pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Entrada
                </th>
                <th className="w-[130px] pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Nacionalidade
                </th>
                <th className="w-[90px] pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Votante
                </th>
                <th className="w-[90px] pb-2 pr-0 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Total
                </th>
                <th className="w-[110px] pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400" />
              </tr>
            ) : governancaTab === "quadro-administrativo" ? (
              <tr className="border-b border-gray-100">
                <th className="w-[160px] pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Documento
                </th>
                <th className="whitespace-nowrap pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Administração
                </th>
                <th className="w-[130px] pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Cargo
                </th>
                <th className="w-[130px] pb-2 pr-0 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Nacionalidade
                </th>
                <th className="w-[110px] pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400" />
              </tr>
            ) : (
              <tr className="border-b border-gray-100">
                <th className="w-[160px] pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Documento
                </th>
                <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Empresa
                </th>
                <th className="w-[140px] pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Relacionamento
                </th>
                <th className="w-[130px] pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Cargo
                </th>
                <th className="w-[90px] pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Entrada
                </th>
                <th className="w-[120px] pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Participação
                </th>
                <th className="w-[90px] pb-2 pr-0 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Situação
                </th>
              </tr>
            )}
          </thead>

          <tbody>
            {activeRows.map((row: any, index: number) => {
              const socio = row?.["detalhes-socio-1"]?.$ ?? {};
              const socioPercentual = row?.["detalhes-socio-2"]?.$ ?? {};
              const administrativo = row?.administrativo?.$ ?? {};
              const participacao = governancaTab === "participacao-empresa" ? row : {};
              const info = getInfoParts(row);

              const documentValue =
                governancaTab === "controle-societario"
                  ? socio?.documento
                  : governancaTab === "quadro-administrativo"
                    ? administrativo?.documento
                    : participacao?.documento;

              const rowKey = `${governancaTab}-${index}-${documentValue ?? "-"}`;
              const rowHasDetails = hasAdditionalInfo(row);
              const rowHasRestriction =
                governancaTab === "participacao-empresa"
                  ? String(participacao?.["indicador-restricao"]).toLowerCase() === "true"
                  : Boolean(info?.restricoes);
              const isExpanded = governancaExpandedRow === rowKey;
              const isControleSocietarioTab = governancaTab === "controle-societario";
              const isQuadroAdministrativoTab = governancaTab === "quadro-administrativo";
              const votantePercentual = socioPercentual?.percentualCapitalVotante;
              const totalPercentual = socio?.percentual;
              const canExpandRow = isControleSocietarioTab || isQuadroAdministrativoTab ? true : rowHasDetails;

              const infoIcon = rowHasRestriction ? (
                <span className="text-base font-bold text-red-600">×</span>
              ) : rowHasDetails ? (
                <Search size={18} style={{ color: "#0F4B93" }} />
              ) : governancaTab === "controle-societario" && socio?.tipoPessoa === "J" ? (
                <AlertTriangle size={18} style={{ color: "#F4B400" }} />
              ) : (
                <span className="text-gray-300">-</span>
              );

              return (
                <Fragment key={rowKey}>
                  <tr className="border-b border-gray-50 align-middle transition-colors hover:bg-gray-50">
                    {governancaTab === "controle-societario" ? (
                      <>
                        <td className="whitespace-nowrap py-2.5 pr-4 text-sm text-gray-700 break-words">
                          {formatDocument(socio?.documento)}
                        </td>
                        <td className="py-2.5 pr-4 text-sm font-medium uppercase text-gray-700 break-words">
                          {socio?.nome ?? "-"}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                          {socio?.tipoPessoa ?? "-"}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4 uppercase text-gray-600">
                          {socio?.nacionalidade || "-"}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                          {votantePercentual !== undefined &&
                          votantePercentual !== null &&
                          String(votantePercentual).trim() !== ""
                            ? String(votantePercentual).includes("%")
                              ? String(votantePercentual)
                              : `${votantePercentual}%`
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-0 text-gray-600">
                          {totalPercentual !== undefined &&
                          totalPercentual !== null &&
                          String(totalPercentual).trim() !== ""
                            ? String(totalPercentual).includes("%")
                              ? String(totalPercentual)
                              : `${totalPercentual}%`
                            : "-"}
                        </td>
                        <td className="py-2.5 pr-4 text-left">
                          <button
                            type="button"
                            onClick={() =>
                              setGovernancaExpandedRow((current) =>
                                current === rowKey ? null : rowKey,
                              )
                            }
                            className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            aria-label={
                              isExpanded ? "Recolher detalhes" : "Expandir detalhes"
                            }
                          >
                            <ChevronDown
                              size={13}
                              className={`transition-transform ${isExpanded ? "rotate-180" : "rotate-0"}`}
                            />
                          </button>
                        </td>
                      </>
                    ) : governancaTab === "quadro-administrativo" ? (
                      <>
                        <td className="whitespace-nowrap py-2.5 pr-4 text-sm text-gray-700 break-words">
                          {formatDocument(administrativo?.documento)}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4 text-sm font-medium uppercase text-gray-700">
                          {administrativo?.nome ?? "-"}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4 uppercase text-gray-600">
                          {administrativo?.cargo ?? "-"}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-0 uppercase text-gray-600">
                          {administrativo?.nacionalidade || "-"}
                        </td>
                        <td className="py-2.5 pr-4 text-left">
                          {canExpandRow ? (
                            <button
                              type="button"
                              onClick={() =>
                                setGovernancaExpandedRow((current) =>
                                  current === rowKey ? null : rowKey,
                                )
                              }
                              className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              aria-label={
                                isExpanded ? "Recolher detalhes" : "Expandir detalhes"
                              }
                            >
                              <ChevronDown
                                size={13}
                                className={`transition-transform ${isExpanded ? "rotate-180" : "rotate-0"}`}
                              />
                            </button>
                          ) : (
                            <span className="inline-flex h-7 w-7 items-center justify-center">
                              {infoIcon}
                            </span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        {(() => {
                          const situacaoDocumento = String(
                            participacao?.["situacao-documento"] ?? "-",
                          ).trim() || "-";
                          const situacaoNormalizada = situacaoDocumento.toUpperCase();
                          const situacaoBadgeStyle =
                            situacaoNormalizada === "ATIVO"
                              ? {
                                  backgroundColor: "#DCFCE7",
                                  color: "#166534",
                                }
                              : situacaoNormalizada === "INATIVO"
                                ? {
                                    backgroundColor: "#FEE2E2",
                                    color: "#991B1B",
                                  }
                                : {
                                    backgroundColor: "#F3F4F6",
                                    color: "#374151",
                                  };

                          return (
                            <>
                              <td className="whitespace-nowrap py-2.5 pr-4 text-sm text-gray-700 break-words">
                                {formatDocument(participacao?.documento)}
                              </td>
                              <td className="py-2.5 pr-4 text-sm font-medium uppercase text-gray-700 break-words">
                                {participacao?.nome ?? "-"}
                              </td>
                              <td className="whitespace-nowrap py-2.5 pr-4 uppercase text-gray-600">
                                {participacao?.["tipo-relacionamento"] ?? "-"}
                              </td>
                              <td className="whitespace-nowrap py-2.5 pr-4 uppercase text-gray-600">
                                {participacao?.["cargo-direcao"] ?? "-"}
                              </td>
                              <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                                {formatDate(participacao?.["data-entrada"])}
                              </td>
                              <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                                {participacao?.["porcentual-participacao"]
                                  ? `${participacao["porcentual-participacao"]}%`
                                  : "-"}
                              </td>
                              <td className="whitespace-nowrap py-2.5 pr-0 uppercase text-gray-600">
                                <span
                                  className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                                  style={situacaoBadgeStyle}
                                >
                                  {situacaoDocumento}
                                </span>
                              </td>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </tr>

                  {(isControleSocietarioTab || isQuadroAdministrativoTab) && (
                    <tr
                      className={`bg-gray-50/50 transition-all ${
                        isExpanded
                          ? "border-b border-gray-50 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                          : "border-b border-transparent duration-300 ease-in-out"
                      }`}
                    >
                      <td colSpan={7} className="p-0">
                        <div
                          className={`overflow-hidden transition-[max-height,opacity] ${
                            isExpanded
                              ? "max-h-[380px] opacity-100 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                              : "max-h-0 opacity-0 duration-300 ease-in-out"
                          }`}
                        >
                          <div
                            className={`grid grid-cols-2 gap-3 px-3 py-3 transition-all md:grid-cols-3 ${
                              isExpanded
                                ? "translate-y-0 opacity-100 duration-500 delay-75"
                                : "-translate-y-1 opacity-0 duration-200"
                            }`}
                          >
                            {(isControleSocietarioTab
                              ? [
                                  { label: "Nome", value: socio?.nome },
                                  {
                                    label: "Documento",
                                    value: formatDocument(socio?.documento),
                                  },
                                  {
                                    label: "Nascimento",
                                    value: formatDate(info?.info1?.dataNascimento),
                                  },
                                  { label: "RG", value: info?.info1?.rg },
                                  {
                                    label: "Nacionalidade",
                                    value: socio?.nacionalidade,
                                  },
                                  {
                                    label: "Endereço",
                                    value: info?.info2?.logradouro,
                                  },
                                  { label: "Bairro", value: info?.info2?.bairro },
                                  {
                                    label: "CEP",
                                    value: formatCEP(info?.info1?.cep),
                                  },
                                  { label: "Cidade", value: info?.info1?.cidade },
                                  { label: "UF", value: info?.info1?.uf },
                                  {
                                    label: "Telefone",
                                    value: formatPhone(info?.info1?.ddd),
                                  },
                                  { label: "Vínculo", value: info?.info1?.vinculo },
                                  {
                                    label: "Capital Votante",
                                    value: socioPercentual?.percentualCapitalVotante,
                                  },
                                  { label: "Capital Total", value: socio?.percentual },
                                ]
                              : [
                                  { label: "Vínculo", value: info?.info1?.vinculo },
                                  {
                                    label: "Data Nascimento",
                                    value: formatDate(info?.info1?.dataNascimento),
                                  },
                                  {
                                    label: "Telefone",
                                    value: formatPhone(info?.info1?.ddd),
                                  },
                                  { label: "RG", value: info?.info1?.rg },
                                  {
                                    label: "CEP",
                                    value: formatCEP(info?.info1?.cep),
                                  },
                                  {
                                    label: "Cidade/UF",
                                    value:
                                      info?.info1?.cidade || info?.info1?.uf
                                        ? `${info?.info1?.cidade ?? "-"}/${info?.info1?.uf ?? "-"}`
                                        : "-",
                                  },
                                  {
                                    label: "Logradouro",
                                    value: info?.info2?.logradouro,
                                  },
                                  { label: "Bairro", value: info?.info2?.bairro },
                                ]
                            ).map((field) => (
                              <div key={`${rowKey}-${field.label}`} className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                  {field.label}
                                </p>
                                <p className="truncate text-xs text-gray-700">
                                  {field.value || "-"}
                                </p>
                              </div>
                            ))}
                          </div>

                          {info?.restricoes && (
                            <div className="mx-3 mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">
                                Restrição Encontrada
                              </p>
                              <p className="mt-0.5 text-xs text-red-800">
                                {info?.restricoes?.descricao ?? "-"} |
                                Ocorrências: {info?.restricoes?.quantidadeOcorrencias ?? "-"} | Última ocorrência: {formatDate(info?.restricoes?.dataUltimaOcorrencia)} | Valor total: {info?.restricoes?.valorTotalOcorrencia ?? "-"}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {governancaTab === "participacao-empresa" && isExpanded && (
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      <td
                        colSpan={7}
                        className="px-3 py-3"
                      >
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {[
                            { label: "Vínculo", value: info?.info1?.vinculo },
                            {
                              label: "Data Nascimento",
                              value: formatDate(info?.info1?.dataNascimento),
                            },
                            { label: "Telefone", value: formatPhone(info?.info1?.ddd) },
                            { label: "RG", value: info?.info1?.rg },
                            { label: "CEP", value: formatCEP(info?.info1?.cep) },
                            {
                              label: "Cidade/UF",
                              value:
                                info?.info1?.cidade || info?.info1?.uf
                                  ? `${info?.info1?.cidade ?? "-"}/${info?.info1?.uf ?? "-"}`
                                  : "-",
                            },
                            { label: "Logradouro", value: info?.info2?.logradouro },
                            { label: "Bairro", value: info?.info2?.bairro },
                          ].map((detailItem) => (
                            <div
                              key={`${rowKey}-${detailItem.label}`}
                              className="rounded-md border border-gray-200 bg-white px-3 py-2"
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                {detailItem.label}
                              </p>
                              <p className="mt-0.5 break-words text-xs font-medium text-gray-800">
                                {detailItem.value || "-"}
                              </p>
                            </div>
                          ))}
                        </div>

                        {info?.restricoes && (
                          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">
                              Restrição Encontrada
                            </p>
                            <p className="mt-0.5 text-xs text-red-800">
                              {info?.restricoes?.descricao ?? "-"} |
                              Ocorrências: {info?.restricoes?.quantidadeOcorrencias ?? "-"} | Última ocorrência: {formatDate(info?.restricoes?.dataUltimaOcorrencia)} | Valor total: {info?.restricoes?.valorTotalOcorrencia ?? "-"}
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
