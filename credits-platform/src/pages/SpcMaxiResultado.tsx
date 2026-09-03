import { Fragment, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import {
  GraphScoreComponent,
  PercentageProgressIndicatorComponent,
} from "@/components";
import { ConsultasRealizadasSection } from "@/containers/SpcMaxiResultado/components/ConsultasRealizadasSection";
import { GovernancaSection } from "@/containers/SpcMaxiResultado/components/GovernancaSection";
import { HeaderSection } from "@/containers/SpcMaxiResultado/components/HeaderSection";
import { HistoricoOperacoesScrSection } from "@/containers/SpcMaxiResultado/components/HistoricoOperacoesScrSection";
import { InformacoesCadastraisSection } from "@/containers/SpcMaxiResultado/components/InformacoesCadastraisSection";
import { InformacoesPositivasSection } from "@/containers/SpcMaxiResultado/components/InformacoesPositivasSection";
import { QuickNavigationSection } from "@/containers/SpcMaxiResultado/components/QuickNavigationSection";
import { ReloadConfirmationDialog } from "@/containers/SpcMaxiResultado/components/ReloadConfirmationDialog";
import { ConsultarInsumoDialog } from "@/containers/SpcMaxiResultado/components/ConsultarInsumoDialog";
import { ResumoFinanceiroSection } from "@/containers/SpcMaxiResultado/components/ResumoFinanceiroSection";
import { ScrSummarySection } from "@/containers/SpcMaxiResultado/components/ScrSummarySection";
import { NegativosConsolidadosSection } from "@/containers/SpcMaxiResultado/components/NegativosConsolidadosSection";
import { AlertasSection } from "@/containers/SpcMaxiResultado/components/AlertasSection";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCNPJ } from "@/utils/formatCNPJ";
import { formatCPF } from "@/utils/formatCPF";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { getCompanyAge } from "@/utils/getCompanyAge";

type SortKey =
  | "inclusao"
  | "vencimento"
  | "valor"
  | "credor"
  | "cidade"
  | "origem"
  | "motivo"
  | "banco"
  | "agencia"
  | "fonte";
type SortDir = "asc" | "desc";

function parseBRDate(s: string): number {
  if (!s || s === "–") return 0;
  const [d, m, y] = s.split("/");
  return new Date(`${y}-${m}-${d}`).getTime();
}

function parseBRValue(s: string): number {
  if (!s || s === "–") return -Infinity;
  return parseFloat(
    s.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
  );
}

interface SpcMaxiRequest {
  document: string;
  typeDocument: "CPF" | "CNPJ";
  telefone?: string;
  insumos: string[];
  consultedAt?: string;
}

function formatConsultaDateTime(value?: string): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
    .format(date)
    .replace(", ", " às ");
}

const EXTRA_CONSULTATION_WINDOW_MS = 5 * 60 * 1000;

function isExtraConsultationExpired(value?: string): boolean {
  if (!value) return false;

  const consultedAt = new Date(value).getTime();
  return (
    !Number.isNaN(consultedAt) &&
    Date.now() - consultedAt >= EXTRA_CONSULTATION_WINDOW_MS
  );
}

function ExtraInsumoButton({
  label,
  consultingLabel,
  disabled = false,
  onConsultar,
}: {
  label: string;
  consultingLabel?: string;
  disabled?: boolean;
  onConsultar: () => void;
}) {
  const isConsulting = consultingLabel === label;

  return (
    <button
      type="button"
      onClick={onConsultar}
      disabled={Boolean(consultingLabel) || disabled}
      className="flex items-center gap-2 self-start rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
      style={{ backgroundColor: "#C7D2FE", color: "#243871" }}
    >
      {isConsulting ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#243871] border-t-transparent" />
      ) : (
        <Search size={11} style={{ color: "#243871" }} />
      )}
      {isConsulting ? "Consultando..." : "Consultar"}
    </button>
  );
}

export default function SpcMaxiResultadoPage() {
  const queryClient = useQueryClient();

  const [, navigate] = useLocation();

  // Subscribes to the cache entry so it isn't garbage-collected (default gcTime)
  // while this page is mounted without any other active observer, which was
  // causing an unwanted redirect back to the query screen after a few minutes.
  const { data: requestData } = useQuery<SpcMaxiRequest | undefined>({
    queryKey: ["spc-maxi-request"],
    queryFn: () =>
      queryClient.getQueryData<SpcMaxiRequest>(["spc-maxi-request"]),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const [extraConsultationExpired, setExtraConsultationExpired] = useState(() =>
    isExtraConsultationExpired(requestData?.consultedAt),
  );

  useEffect(() => {
    if (!requestData?.consultedAt) {
      setExtraConsultationExpired(false);
      return;
    }

    const consultedAt = new Date(requestData.consultedAt).getTime();
    if (Number.isNaN(consultedAt)) {
      setExtraConsultationExpired(false);
      return;
    }

    const remainingTime =
      consultedAt + EXTRA_CONSULTATION_WINDOW_MS - Date.now();

    if (remainingTime <= 0) {
      setExtraConsultationExpired(true);
      setPendingExtraInsumo(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setExtraConsultationExpired(true);
      setPendingExtraInsumo(null);
    }, remainingTime);

    return () => window.clearTimeout(timeoutId);
  }, [requestData?.consultedAt]);

  const {
    data: spcData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "spc-maxi",
      requestData?.document,
      requestData?.typeDocument,
      requestData?.insumos,
    ],

    queryFn: async () => {
      if (!requestData) {
        throw new Error("Parâmetros da consulta não encontrados.");
      }

      const response = await fetch(
        // "http://localhost:3333/api/325-spc-maxi",
        "https://credits-core.onrender.com/api/325-spc-maxi",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document: requestData.document,
            typeDocument: requestData.typeDocument,
            telefone: requestData.telefone,
            insumos: requestData.insumos,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Erro ao realizar a consulta SPC MAXI.",
        );
      }

      return data?.spc;
    },

    enabled: Boolean(requestData),
    retry: false,
    staleTime: Infinity,
  });

  const isKeyboardReloadRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isReloadShortcut =
        event.key === "F5" ||
        (event.ctrlKey && event.key.toLowerCase() === "r") ||
        (event.metaKey && event.key.toLowerCase() === "r");

      if (isReloadShortcut) {
        event.preventDefault();
        isKeyboardReloadRef.current = true;
        setShowRedirectModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);

  const [activeGroup, setActiveGroup] = useState("SPC");
  const [expanded, setExpanded] = useState(false);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [consultasExpanded, setConsultasExpanded] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [pendingExtraInsumo, setPendingExtraInsumo] = useState<{
    label: string;
    insumoId: string;
  } | null>(null);
  const [consultingExtraInsumo, setConsultingExtraInsumo] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [extraInsumoErrorLabel, setExtraInsumoErrorLabel] = useState<
    string | null
  >(null);
  const [unavailableExtraInsumos, setUnavailableExtraInsumos] = useState<
    string[]
  >([]);
  const extraInsumoErrorMessage = "Não há dados disponíveis.";
  const hasExtraInsumoInProgress = Boolean(
    pendingExtraInsumo || consultingExtraInsumo,
  );

  useEffect(() => {
    setExpandedRowKey(null);
  }, [activeGroup, expanded, sortKey, sortDir]);

  const handleOpenReloadModal = () => {
    isKeyboardReloadRef.current = false;
    setShowRedirectModal(true);
  };

  const handleCancelReload = () => {
    isKeyboardReloadRef.current = false;
    setShowRedirectModal(false);
  };

  const handleConfirmReload = () => {
    isKeyboardReloadRef.current = false;
    setShowRedirectModal(false);
    navigate("/verticais/credito-risco/spc-maxi");
  };

  const openExtraInsumoConfirmation = (item: {
    label: string;
    insumoId: string;
  }) => {
    if (extraConsultationExpired || hasExtraInsumoInProgress) return;
    setPendingExtraInsumo(item);
  };

  const handleConfirmExtraInsumo = () => {
    if (!pendingExtraInsumo || extraConsultationExpired) return;

    const item = pendingExtraInsumo;
    setPendingExtraInsumo(null);
    void handleConsultarInsumoExtra(item);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDir("asc");
  };

  const ccfSource = (() => {
    const payload = spcData?.ccf;
    const detalhes = payload?.["detalhe-ccf"];

    if (Array.isArray(detalhes)) return detalhes;
    if (detalhes) return [detalhes];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.ccf)) return payload.ccf;
    if (Array.isArray(payload?.dados)) return payload.dados;

    return [];
  })();

  const ccfRecords =
    ccfSource.map((item: any) => {
      const inclusao =
        item?.$?.["data-ultimo-cheque"] ??
        item?.["data-ultimo-cheque"] ??
        item?.["data-inclusao"] ??
        item?.["data-ocorrencia"] ??
        item?.data;
      const dataExibicao = inclusao
        ? inclusao.includes("/")
          ? inclusao
          : (() => {
              const [year, month, day] = String(inclusao)
                .split("T")[0]
                .split("-");
              return `${day}/${month}/${year}`;
            })()
        : "-";

      return {
        tipo: item?.$?.["tipo-ocorrencia"] ?? item?.tipo ?? "",
        inclusao: dataExibicao,
        vencimento: "–",
        valor: "–",
        contrato: item?.contrato ?? "",
        credor: item?.$?.origem,
        cidade: item?.cidade ? `${item.cidade}/${item.estado ?? ""}` : "-",
        origem: item?.origem,
        motivo: `${item?.motivo?.codigo} - ${item?.motivo?.descricao}`,
        banco: item?.["ultimo-cheque"]?.banco?.nome,
        agencia: item?.["ultimo-cheque"]?.["numero-agencia"],
        fonte: "CCF",
        grupo: "CCF",
      };
    }) ?? [];

  const body = Array.isArray(
    spcData?.["dados-adicionais-contato"]?.["detalhe-dados-adicionais-contato"],
  )
    ? spcData["dados-adicionais-contato"][
        "detalhe-dados-adicionais-contato"
      ].map((row: any) => ({
        endereco: row?.endereco ?? row?.["endereco-completo"] ?? "-",
        email: row?.email ?? "-",
        telefone: row?.telefone ?? "-",
        celular: row?.celular ?? row?.["telefone-celular"] ?? "-",
      }))
    : [];

  const situacao = spcData?.consumidor?.cpf
    ? spcData?.consumidor?.["situacao-cpf"]?.description
    : spcData?.consumidor?.["situacao-cnpj"]?.description;

  const isRegular =
    String(situacao).toLowerCase().includes("regular") ||
    String(situacao).toLowerCase().includes("ativo");

  const GROUPS = [
    {
      key: "SPC",
      label: "SPC",
      count: Number(spcData?.spc?.resumo?.["quantidade-total"] ?? 0),
      valor: formatCurrency(spcData?.spc?.resumo?.["valor-total"]),
      antiga:
        Number(spcData?.spc?.resumo?.["quantidade-total"] ?? 0) <= 1
          ? formatDate(spcData?.spc?.resumo?.["data-ultima-ocorrencia"])
          : formatDate(
              spcData?.spc?.["detalhe-spc"]?.reduce((oldest, current) =>
                new Date(current["data-inclusao"]) <
                new Date(oldest["data-inclusao"])
                  ? current
                  : oldest,
              )?.["data-inclusao"],
            ),
      recente: formatDate(spcData?.spc?.resumo?.["data-ultima-ocorrencia"]),
    },
    {
      key: "SERASA",
      label: "SERASA",
      count: Number(
        spcData?.["pendencia-financeira"]?.resumo?.["quantidade-total"] ?? 0,
      ),
      valor: formatCurrency(
        spcData?.["pendencia-financeira"]?.resumo?.["valor-total"],
      ),
      antiga: formatDate(
        spcData?.["pendencia-financeira"]?.["ocorrencia-mais-antiga-chequenet"],
      ),
      recente: formatDate(
        spcData?.["pendencia-financeira"]?.[
          "ocorrencia-mais-recente-chequenet"
        ],
      ),
    },
    {
      key: "PROTESTOS",
      label: "PROTESTOS",
      count: Number(spcData?.protesto?.resumo?.["quantidade-total"] ?? 0),
      valor: formatCurrency(spcData?.protesto?.resumo?.["valor-total"]),
      antiga: formatDate(
        spcData?.protesto?.resumo?.["data-primeira-ocorrencia"],
      ),
      recente: formatDate(
        spcData?.protesto?.resumo?.["data-ultima-ocorrencia"],
      ),
    },
    {
      key: "CCF",
      label: "CCF",
      count: ccfRecords.length,
      valor: "–",
      antiga: ccfRecords.length
        ? [...ccfRecords].sort(
            (a, b) => parseBRDate(a.inclusao) - parseBRDate(b.inclusao),
          )[0].inclusao
        : "-",
      recente: ccfRecords.length
        ? ([...ccfRecords]
            .sort((a, b) => parseBRDate(a.inclusao) - parseBRDate(b.inclusao))
            .at(-1)?.inclusao ?? "-")
        : "-",
    },
  ];

  const spcRecords =
    spcData?.spc?.["detalhe-spc"]?.map((item) => ({
      tipo: item["comprador-fiador-avalista"],
      inclusao: new Date(item["data-inclusao"]).toLocaleDateString("pt-BR"),
      vencimento: new Date(item["data-vencimento"]).toLocaleDateString("pt-BR"),
      valor: Number(item.valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      contrato: item.contrato,
      "comprador-fiador-avalista": item["comprador-fiador-avalista"],
      credor: item["nome-associado"],
      cidade: `${item["cidade-associado"]}/${item.estado}`,
      origem: item["nome-entidade"],
      telefone: item["telefone-associado"],
      fonte: "SPC",
      grupo: "SPC",
    })) ?? [];

  const serasaRecords =
    spcData?.["pendencia-financeira"]?.["detalhe-pendencia-financeira"]?.map(
      (item) => ({
        tipo: Boolean(item.avalista) ? "AVALISTA" : "COMPRADOR",
        inclusao: new Date(item["data-ocorrencia"]).toLocaleDateString("pt-BR"),
        vencimento: new Date(item["data-ocorrencia"]).toLocaleDateString(
          "pt-BR",
        ),
        valor: Number(item["valor-pendencia"]).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        contrato: item.contrato,
        credor: item.origem,
        cidade: `${item.cidade}/${item.estado}`,
        origem: item["titulo-ocorrencia"],
        fonte: "SERASA",
        grupo: "SERASA",
      }),
    ) ?? [];

  const protestoRecords =
    spcData?.protesto?.["detalhe-protesto"]?.map((item) => ({
      tipo: "",
      inclusao: new Date(item["data-protesto"]).toLocaleDateString("pt-BR"),
      vencimento: new Date(item["data-protesto"]).toLocaleDateString("pt-BR"),
      origem: "Protesto",
      data: new Date(item["data-protesto"]).toLocaleDateString("pt-BR"),
      cartorio: item.cartorio,
      cidade: `${item.cidade}/${item.estado}`,
      valor: Number(item.valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      fonte: "PROTESTOS",
      grupo: "PROTESTOS",
    })) ?? [];

  const ALL_RECORDS = [
    ...spcRecords,
    ...serasaRecords,
    ...protestoRecords,
    ...ccfRecords,
  ];

  const chartData = (() => {
    const records =
      activeGroup === "TODOS"
        ? ALL_RECORDS
        : ALL_RECORDS.filter((r) => r.grupo === activeGroup);

    const grouped = records
      .filter((r) => r.vencimento && r.vencimento !== "–" && r.valor !== "–")
      .reduce(
        (acc, item) => {
          const data = item.vencimento;
          const valor = parseBRValue(item.valor);

          if (!acc[data]) {
            acc[data] = {
              data,
              valor: 0,
            };
          }

          acc[data].valor += valor;

          return acc;
        },
        {} as Record<string, { data: string; valor: number }>,
      );

    const rows = Object.values(grouped).sort(
      (a, b) => parseBRDate(a.data) - parseBRDate(b.data),
    );

    let acumulado = 0;

    return rows.map((item) => {
      acumulado += item.valor;

      return {
        ...item,
        acumulado,
      };
    });
  })();

  const activeGroupData = GROUPS.find((g) => g.key === activeGroup);
  const shouldShowChart =
    (activeGroupData?.count ?? 0) > 0 && chartData.length > 0;

  const base =
    activeGroup === "TODOS"
      ? ALL_RECORDS
      : ALL_RECORDS.filter((r) => r.grupo === activeGroup);
  const filtered = sortKey
    ? [...base].sort((a, b) => {
        let va: string | number = a[sortKey];
        let vb: string | number = b[sortKey];
        if (sortKey === "inclusao" || sortKey === "vencimento") {
          va = parseBRDate(String(a[sortKey] ?? ""));
          vb = parseBRDate(String(b[sortKey] ?? ""));
        } else if (sortKey === "valor") {
          va = parseBRValue(String(a[sortKey] ?? ""));
          vb = parseBRValue(String(b[sortKey] ?? ""));
        } else {
          va = String(a[sortKey] ?? "");
          vb = String(b[sortKey] ?? "");
        }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      })
    : base;

  const PAGE = 5;
  const visible = expanded ? filtered : filtered.slice(0, PAGE);
  const remaining = filtered.length - PAGE;

  const normalize = (value?: string) =>
    (value ?? "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\bRUA\b/g, "R")
      .replace(/\(.*?\)/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const enderecoAtual = spcData?.consumidor?.endereco;

  const ultimoEndereco =
    spcData?.["ultimo-endereco-informado"]?.[
      "detalhe-ultimo-endereco-informado"
    ]?.[0];

  const enderecoDiferente =
    !!enderecoAtual &&
    !!ultimoEndereco &&
    (normalize(enderecoAtual.logradouro) !==
      normalize(ultimoEndereco.logradouro) ||
      normalize(enderecoAtual.cep) !== normalize(ultimoEndereco.cep));

  const consultas =
    spcData?.["consulta-realizada"]?.["detalhe-consulta-realizada"] ?? [];

  const hoje = new Date();
  const umMesAtras = new Date();
  umMesAtras.setDate(hoje.getDate() - 30);

  const consultasUltimos30Dias = consultas.filter((consulta) => {
    const dataConsulta = new Date(consulta["data-consulta"]);
    return dataConsulta >= umMesAtras && dataConsulta <= hoje;
  });

  const possuiAltoVolumeConsultas = consultasUltimos30Dias.length > 10;
  const alertaDocumento =
    spcData?.["alerta-documento"]?.["detalhe-alerta-documento"]?.[0];
  const participacaoMercadoCapitais =
    spcData?.["insumo-participacao-mercado-capitais"]?.[
      "detalhe-insumo-participacao-mercado-capitais"
    ];
  const participaMercadoCapitaisRaw =
    participacaoMercadoCapitais?.["participante-mercado-capital"];
  const participaMercadoCapitais =
    participaMercadoCapitaisRaw === true ||
    String(participaMercadoCapitaisRaw).toLowerCase() === "true";

  const alertas = [
    ...(participacaoMercadoCapitais
      ? [
          {
            severidade: participaMercadoCapitais ? "medio" : "baixo",
            titulo: "Participação no Mercado de Capitais",
            descricao: participaMercadoCapitais
              ? "Há participação registrada no mercado de capitais."
              : "Não há participação registrada no mercado de capitais.",
            fonte: "SPC Brasil",
            tipo: "Mercado de Capitais",
          },
        ]
      : []),
    ...(enderecoDiferente
      ? [
          {
            severidade: "baixo",
            titulo: "Endereço desatualizado",
            descricao:
              "O endereço informado difere do último endereço registrado nas bases consultadas.",
            fonte: "SPC Brasil",
            tipo: "Endereço",
          },
        ]
      : []),
    ...(alertaDocumento
      ? [
          {
            severidade: "alto",
            titulo: "Alerta de documento",
            descricao: "Foi identificado um alerta de documento na consulta.",
            fonte: alertaDocumento?.["entidade-origem"] ?? "SPC Brasil",
            tipo: alertaDocumento?.["tipo-documento-alerta"] ?? "Documento",
            detalhes: [
              {
                label: "Data Inclusão",
                value: formatDate(alertaDocumento?.["data-inclusao"]),
              },
              {
                label: "Data Ocorrência",
                value: formatDate(alertaDocumento?.["data-ocorrencia"]),
              },
              {
                label: "Motivo",
                value: alertaDocumento?.motivo ?? "-",
              },
            ],
          },
        ]
      : []),
    ...(possuiAltoVolumeConsultas
      ? [
          {
            severidade: "alto",
            titulo: "Alto volume de consultas recentes",
            descricao: `${consultasUltimos30Dias.length} consultas nos últimos 30 dias — possível busca intensiva por crédito.`,
            data: consultasUltimos30Dias.sort(
              (a, b) =>
                new Date(b["data-consulta"]).getTime() -
                new Date(a["data-consulta"]).getTime(),
            )[0]["data-consulta"],
            fonte: "SPC Brasil",
            tipo: spcData?.consumidor?.cpf ? "CPF" : "CNPJ",
          },
        ]
      : []),
  ];

  const resumoTabela = (() => {
    if (!base.length) {
      return {
        count: 0,
        antiga: "-",
        recente: "-",
      };
    }

    const datas = base
      .map((item) => item.vencimento || item.inclusao || item.data)
      .filter(
        (data): data is string => Boolean(data) && data !== "-" && data !== "–",
      );

    if (!datas.length) {
      return {
        count: base.length,
        antiga: "-",
        recente: "-",
      };
    }

    const datasOrdenadas = [...datas].sort(
      (a, b) => parseBRDate(a) - parseBRDate(b),
    );

    return {
      count: base.length,
      antiga: datasOrdenadas[0],
      recente: datasOrdenadas[datasOrdenadas.length - 1],
    };
  })();

  useEffect(() => {
    if (!requestData) {
      navigate("/verticais/credito-risco/spc-maxi");
    }
  }, [navigate, requestData]);

  if (!requestData) {
    return null;
  }

  const isPessoaFisica = Boolean(spcData?.consumidor?.cpf);
  const scoreCadastroPositivo = Number(spcData?.["score-cadastro-positivo"]);
  const score12Meses = Number(
    spcData?.["spc-score-12-meses"]?.["detalhe-spc-score-12-meses"]?.[0]?.score,
  );
  const score3Meses = Number(
    spcData?.["spc-score-3-meses"]?.["detalhe-spc-score-3-meses"]?.score,
  );
  const scorePj = Number(spcData?.["score-pj"]?.["detalhe-score-pj"]?.score);
  const scorePjMei = Number(
    spcData?.["score-pj-mei"]?.["detalhe-score-pj-mei"]?.score,
  );
  const scorePjMeiIndisponivel = Boolean(
    spcData?.["score-pj-mei"] &&
    Number(spcData?.["score-pj-mei"]?.resumo?.["quantidade-total"] ?? 0) ===
      0 &&
    spcData?.["score-pj-mei"]?.["detalhe-score-pj-mei"] &&
    !Array.isArray(spcData?.["score-pj-mei"]?.["detalhe-score-pj-mei"]) &&
    Object.keys(spcData?.["score-pj-mei"]?.["detalhe-score-pj-mei"] ?? {})
      .length === 0,
  );

  const scoreCandidates = [
    {
      source: "cadastro",
      label: "Score + Positivo",
      score: scoreCadastroPositivo,
      insumoId: "5228",
      message:
        "Avalia o risco de crédito a partir do histórico de pagamentos e do comportamento financeiro do consumidor.\nCombina informações positivas e históricas para gerar uma análise mais completa do perfil de crédito.\nApoia decisões de concessão de crédito de forma mais segura e assertiva.",
    },
    {
      source: "12-meses",
      label: "Score 12 meses",
      score: score12Meses,
      insumoId: "78",
      message:
        spcData?.["spc-score-12-meses"]?.["detalhe-spc-score-12-meses"]?.[0]?.[
          "mesagem-interpretativa-score"
        ] ?? "",
    },
    {
      source: "3-meses",
      label: "Score 3 meses",
      score: score3Meses,
      insumoId: "77",
      message:
        spcData?.["spc-score-3-meses"]?.["detalhe-spc-score-3-meses"]?.[
          "mesagem-interpretativa-score"
        ] ?? "",
    },
    {
      source: "pj",
      label: "Score PJ",
      score: scorePj,
      insumoId: "5229",
      message:
        spcData?.["score-pj"]?.["detalhe-score-pj"]?.[
          "mesagem-interpretativa-score"
        ] ?? "",
    },
    {
      source: "pj-mei",
      label: "Score PJ MEI",
      score: scorePjMei,
      insumoId: "5247",
      message:
        spcData?.["score-pj-mei"]?.["detalhe-score-pj-mei"]?.[
          "mesagem-interpretativa-score"
        ] ?? "",
    },
  ];

  const mainScoreCandidate = scoreCandidates.find((candidate) =>
    Number.isFinite(candidate.score),
  ) ?? {
    source: "none",
    label: "Score",
    score: 0,
    message: "",
  };

  const mainScoreLabel = mainScoreCandidate.label;
  const mainScoreInterpretativeMessage = mainScoreCandidate.message;
  const normalizedScore = Math.min(Math.max(mainScoreCandidate.score, 0), 1000);
  const hasAnyScoreData = scoreCandidates.some((candidate) =>
    Number.isFinite(candidate.score),
  );
  const scoreSourcesByProfile = isPessoaFisica
    ? ["cadastro", "12-meses", "3-meses"]
    : ["12-meses", "3-meses", "pj", "pj-mei"];
  const missingScoreCandidates = scoreCandidates.filter(
    (candidate) =>
      scoreSourcesByProfile.includes(candidate.source) &&
      !Number.isFinite(candidate.score) &&
      Boolean(candidate.insumoId),
  );
  const secondaryScoreCandidates = scoreCandidates.filter(
    (candidate) =>
      candidate.source !== mainScoreCandidate.source &&
      Number.isFinite(candidate.score),
  );
  const shouldShowDedicatedPeriodScores = secondaryScoreCandidates.length > 0;
  const scoreCardsCount =
    secondaryScoreCandidates.length + missingScoreCandidates.length + 1;
  const scoreGridClassName = !isPessoaFisica
    ? "md:grid-cols-2"
    : scoreCardsCount >= 3
      ? "md:grid-cols-3"
      : "md:grid-cols-2";

  const getScoreColor = (value: number) => {
    if (value >= 675) return "#259f58";
    if (value >= 467) return "#ffca39";
    return "#f6a020";
  };

  const getRiscoInfo = (value: number) => {
    if (value >= 675) {
      return {
        label: "Risco Baixo",
        description:
          "Perfil com baixo risco de inadimplencia e bom historico de pagamento.",
        badge: { backgroundColor: "#DCFCE7", color: "#15803D" },
      };
    }

    if (value >= 467) {
      return {
        label: "Risco Medio",
        badge: { backgroundColor: "#FEF3C7", color: "#D97706" },
      };
    }

    return {
      label: "Risco Alto",
      badge: { backgroundColor: "#FEE2E2", color: "#DC2626" },
    };
  };

  const scoreColor = getScoreColor(normalizedScore);

  const riscoInfo = getRiscoInfo(normalizedScore);

  const rendaPresumidaValue = isPessoaFisica
    ? spcData?.["renda-presumida-spc"]?.resumo?.["valor-total"]
    : (spcData?.["faturamento-presumido"]?.["detalhe-faturamento-presumido"]?.[
        "valor-faturamento"
      ] ?? spcData?.["faturamento-presumido"]?.resumo?.["valor-total"]);

  const limiteSugeridoValue = isPessoaFisica
    ? spcData?.["limite-credito-sugerido"]?.resumo?.["valor-total"]
    : spcData?.["limite-credito-pj"]?.["detalhe-limite-credito-pj"]?.[
        "valor-limite-credito"
      ];

  const gastoEstimadoPjValue = isPessoaFisica
    ? null
    : (spcData?.["gasto-estimado-pj"]?.["detalhe-gasto-estimado-pj"]?.[
        "valor"
      ] ?? spcData?.["gasto-estimado-pj"]?.resumo?.["valor-total"]);

  const quantidadeFuncionariosValue = isPessoaFisica
    ? null
    : spcData?.["quantidade-funcionario"]?.resumo?.["quantidade-total"];

  const limiteSugeridoIndisponivel = Boolean(
    spcData?.["limite-credito-sugerido"] &&
    Array.isArray(
      spcData?.["limite-credito-sugerido"]?.["detalhe-limite-credito-sugerido"],
    ) &&
    spcData?.["limite-credito-sugerido"]?.resumo?.["quantidade-total"] &&
    !spcData?.["limite-credito-sugerido"]?.resumo?.["valor-total"] &&
    !spcData?.["limite-credito-sugerido"]?.[
      "detalhe-limite-credito-sugerido"
    ]?.some(
      (item: any) =>
        item?.["valor-limite-credito"] !== undefined ||
        item?.valor !== undefined,
    ),
  );

  const hasUsableExtraInsumoResponse = (
    label: string,
    nextSpcData: Record<string, any>,
  ) => {
    switch (label) {
      case "Renda Presumida":
        return Boolean(
          nextSpcData?.["renda-presumida-spc"]?.resumo?.["valor-total"] ||
          nextSpcData?.["renda-presumida-spc"]?.[
            "detalhe-renda-presumida-spc"
          ]?.some(
            (item: any) =>
              item?.["valor-renda"] !== undefined || item?.valor !== undefined,
          ),
        );
      case "Limite Sugerido":
        return Boolean(
          nextSpcData?.["limite-credito-sugerido"]?.resumo?.["valor-total"] ||
          nextSpcData?.["limite-credito-sugerido"]?.[
            "detalhe-limite-credito-sugerido"
          ]?.some(
            (item: any) =>
              item?.["valor-limite-credito"] !== undefined ||
              item?.valor !== undefined,
          ),
        );
      case "Comprometimento":
        return Boolean(
          nextSpcData?.["comprometimento-renda-mensal-pf"]?.[
            "detalhe-comprometimento-renda-mensal-pf"
          ]?.faixa ||
          nextSpcData?.["comprometimento-renda-mensal-pf"]?.resumo?.[
            "valor-total"
          ],
        );
      case "Alerta de Identidade à Fraude":
        return Boolean(
          nextSpcData?.["alerta-identidade-fraude"]?.[
            "detalhe-alerta-identidade-fraude"
          ]?.some(
            (item: any) =>
              item?.["alerta-fraude"] !== undefined ||
              item?.["tipo-alerta"] !== undefined ||
              item?.descricao !== undefined,
          ),
        );
      case "Operações no SCR":
        return Boolean(
          nextSpcData?.["insumo-operacao-scr"]?.["detalhe-insumo-operacao-scr"],
        );
      case "Pontualidade de Pagamento":
        return Boolean(
          nextSpcData?.["indice-pontualidade-pagamento-cadastro-positivo"]?.[
            "detalhe-indice-pontualidade-pagamento-cadastro-positivo"
          ],
        );
      case "Comportamento de Gastos":
        return Boolean(
          nextSpcData?.["indice-comportamento-gastos-cadastro-positivo"]?.[
            "detalhe-indice-comportamento-gastos-cadastro-positivo"
          ],
        );
      default:
        return true;
    }
  };

  const handleConsultarInsumoExtra = async (item: {
    label: string;
    insumoId?: string;
  }) => {
    if (!requestData || extraConsultationExpired) return;

    const insumoId =
      item.insumoId ??
      {
        "Renda Presumida": "5122",
        "Limite Sugerido": "5142",
        Comprometimento: "5194",
        "Alerta de Identidade à Fraude": "5262",
      }[item.label];

    if (!insumoId) return;

    const nextInsumos = Array.from(new Set([...requestData.insumos, insumoId]));

    setConsultingExtraInsumo({ id: insumoId, label: item.label });
    setExtraInsumoErrorLabel(null);
    setUnavailableExtraInsumos((prev) =>
      prev.includes(item.label)
        ? prev
        : prev.filter((label) => label !== item.label),
    );

    try {
      const response = await fetch(
        "https://credits-core.onrender.com/api/325-spc-maxi",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document: requestData.document,
            typeDocument: requestData.typeDocument,
            telefone: requestData.telefone,
            insumos: nextInsumos,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(extraInsumoErrorMessage);
      }

      const nextSpcData = payload?.spc ?? payload;
      const hasUsableData =
        nextSpcData &&
        typeof nextSpcData === "object" &&
        hasUsableExtraInsumoResponse(item.label, nextSpcData);

      if (!hasUsableData) {
        setUnavailableExtraInsumos((prev) =>
          prev.includes(item.label) ? prev : [...prev, item.label],
        );
        throw new Error(extraInsumoErrorMessage);
      }

      setUnavailableExtraInsumos((prev) =>
        prev.filter((label) => label !== item.label),
      );

      const nextRequest = {
        ...requestData,
        insumos: nextInsumos,
      };

      queryClient.setQueryData(["spc-maxi-request"], nextRequest);
      queryClient.setQueryData(
        [
          "spc-maxi",
          nextRequest.document,
          nextRequest.typeDocument,
          nextInsumos,
        ],
        nextSpcData,
      );
      queryClient.invalidateQueries({ queryKey: ["spc-maxi"] });
    } catch (error) {
      setUnavailableExtraInsumos((prev) =>
        prev.includes(item.label) ? prev : [...prev, item.label],
      );
      setExtraInsumoErrorLabel(item.label);
    } finally {
      setConsultingExtraInsumo(null);
    }
  };

  const resumoFinanceiroItens = [
    {
      label: isPessoaFisica ? "Renda Presumida" : "Faturamento Presumido",
      insumoId: isPessoaFisica ? "5122" : "5178",
      value: rendaPresumidaValue ? formatCurrency(rendaPresumidaValue) : "",
    },
    {
      label: isPessoaFisica ? "Limite Sugerido" : "Limite de Crédito PJ",
      insumoId: isPessoaFisica ? "5142" : "5179",
      value: limiteSugeridoValue ? formatCurrency(limiteSugeridoValue) : "",
    },
    ...(isPessoaFisica
      ? [
          {
            label: "Comprometimento",
            insumoId: "5194",
            value:
              spcData?.["comprometimento-renda-mensal-pf"]?.[
                "detalhe-comprometimento-renda-mensal-pf"
              ]?.faixa ?? "",
          },
          {
            label: "Alerta de Identidade à Fraude",
            insumoId: "5262",
            value:
              spcData?.["alerta-identidade-fraude"]?.[
                "detalhe-alerta-identidade-fraude"
              ]?.[0]?.["alerta-fraude"] === "true" ? (
                <span
                  className="inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: "#FEE2E2",
                    color: "#DC2626",
                  }}
                >
                  Alerta ativo
                </span>
              ) : spcData?.["alerta-identidade-fraude"]?.[
                  "detalhe-alerta-identidade-fraude"
                ]?.[0]?.["alerta-fraude"] === "false" ? (
                <span
                  className="inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: "#DCFCE7",
                    color: "#15803D",
                  }}
                >
                  Sem alertas
                </span>
              ) : (
                ""
              ),
          },
        ]
      : [
          {
            label: "Gasto Estimado PJ",
            insumoId: "5185",
            value: gastoEstimadoPjValue
              ? formatCurrency(gastoEstimadoPjValue)
              : "",
          },
          {
            label: "Quantidade de Funcionários",
            insumoId: "5267",
            value:
              quantidadeFuncionariosValue !== undefined &&
              quantidadeFuncionariosValue !== null
                ? Number(quantidadeFuncionariosValue ?? 0).toLocaleString(
                    "pt-BR",
                  )
                : "",
          },
        ]),
  ];

  const pontualidadePagamentoPercent = (() => {
    const segmentos =
      spcData?.["indice-pontualidade-pagamento-cadastro-positivo"]?.[
        "detalhe-indice-pontualidade-pagamento-cadastro-positivo"
      ]?.segmentos ?? [];

    const valores = segmentos.flatMap((segmento: any) =>
      (segmento?.periodos ?? [])
        .filter(
          (periodo: any) =>
            periodo?.descricao === "PAGAMENTO_EM_DIA" &&
            Number(periodo?.porcentual ?? 0) > 0,
        )
        .map((periodo: any) => Number(periodo?.porcentual ?? 0)),
    );

    if (!valores.length) return 0;

    const ordenados = [...valores].sort((a, b) => a - b);
    const meio = Math.floor(ordenados.length / 2);

    if (ordenados.length % 2 === 0) {
      return (ordenados[meio - 1] + ordenados[meio]) / 2;
    }

    return ordenados[meio];
  })();

  const hasPontualidadeData =
    spcData?.["indice-pontualidade-pagamento-cadastro-positivo"];

  const comprometimentoGastos = (() => {
    const segmentos =
      spcData?.["indice-comportamento-gastos-cadastro-positivo"]?.[
        "detalhe-indice-comportamento-gastos-cadastro-positivo"
      ]?.segmentos ?? [];

    const maiorSegmento = [...segmentos]
      .filter(
        (segmento: any) =>
          Number(segmento?.["porcentual-representatividade"] ?? 0) > 0,
      )
      .sort(
        (a: any, b: any) =>
          Number(b?.["porcentual-representatividade"] ?? 0) -
          Number(a?.["porcentual-representatividade"] ?? 0),
      )[0];

    return {
      percentual: Number(maiorSegmento?.["porcentual-representatividade"] ?? 0),
      nome: maiorSegmento?.nome ?? "-",
    };
  })();

  const hasComprometimentoData =
    spcData?.["indice-comportamento-gastos-cadastro-positivo"];

  const scrOperacao = (() => {
    const dados = spcData?.["insumo-operacao-scr"] ?? {};
    const detalhes = dados?.["detalhe-insumo-operacao-scr"] ?? [];
    const primeiro = detalhes[0] ?? {};

    return {
      quantidade: primeiro?.quantidade ?? "0",
      resumoQuantidadeTotal: primeiro?.quantidade ?? "0",
      "data-inicio-relacionamento":
        primeiro?.["data-inicio-relacionamento"] ?? null,
      "valor-total-contratado-inicial": Number(
        primeiro?.["valor-total-contratado-inicial"] ?? 0,
      ),
      "valor-total-contratado-final": Number(
        primeiro?.["valor-total-contratado-final"] ?? 0,
      ),
      "quantidade-instituicao-scr":
        primeiro?.["quantidade-instituicao-scr"] ?? null,
    };
  })();

  const historicoScrScoreData =
    spcData?.["insumo-historico-operacao-scr"]?.[
      "detalhe-insumo-historico-operacao-scr"
    ];

  const hasScrData = spcData?.["insumo-operacao-scr"];
  const hasComportamentoFinanceiroData =
    Boolean(hasPontualidadeData) ||
    Boolean(hasComprometimentoData) ||
    Boolean(hasScrData) ||
    Boolean(historicoScrScoreData);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const arcPercentage = 0.75;
  const arcLength = circumference * arcPercentage;

  const progressLength = (normalizedScore / 1000) * arcLength;

  console.log("spcData", spcData);

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#243871]" />

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              Consultando SPC MAXI
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Aguarde enquanto buscamos as informações.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">
            Erro ao realizar consulta
          </p>

          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error
              ? error.message
              : "Não há dados disponíveis."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/verticais/credito-risco/spc-maxi")}
            className="mt-4 rounded-lg bg-[#243871] px-4 py-2 text-sm font-semibold text-white"
          >
            Voltar para consulta
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ReloadConfirmationDialog
        open={showRedirectModal}
        onOpenChange={setShowRedirectModal}
        onCancel={handleCancelReload}
        onConfirm={handleConfirmReload}
      />

      <ConsultarInsumoDialog
        open={Boolean(pendingExtraInsumo)}
        label={pendingExtraInsumo?.label}
        disabled={extraConsultationExpired}
        onOpenChange={(open) => {
          if (!open) setPendingExtraInsumo(null);
        }}
        onCancel={() => setPendingExtraInsumo(null)}
        onConfirm={handleConfirmExtraInsumo}
      />

      <div className="w-full">
        <HeaderSection
          protocol="2026060900042"
          dateTime={formatConsultaDateTime(requestData.consultedAt)}
          operator="Leonardo Lima"
          documentLabel={
            spcData?.consumidor?.cpf
              ? `CPF: ${formatCPF(spcData?.consumidor?.cpf)}`
              : `CNPJ: ${formatCNPJ(spcData?.consumidor?.cnpj)}`
          }
          documentCopyValue={
            spcData?.consumidor?.cpf ?? spcData?.consumidor?.cnpj
          }
          consumerName={
            spcData?.consumidor?.cpf
              ? spcData?.consumidor?.nome
              : spcData?.consumidor?.["razao-social"]
          }
          consumerNameCopyValue={
            spcData?.consumidor?.nome ?? spcData?.consumidor?.["razao-social"]
          }
          documentTypeLabel={spcData?.consumidor?.cpf ? "CPF" : "CNPJ"}
          situacao={situacao}
          isRegular={isRegular}
          metadataText={
            spcData?.consumidor?.cpf
              ? `${spcData?.consumidor?.idade} anos · ${spcData?.consumidor?.sexo} · ${spcData?.consumidor?.endereco?.cidade}/${spcData?.consumidor?.endereco?.estado}`
              : `${getCompanyAge(spcData?.consumidor?.["data-fundacao"])} anos · ${spcData?.consumidor?.endereco?.cidade}/${spcData?.consumidor?.endereco?.estado}`
          }
          onPrint={() => window.print()}
          onReload={handleOpenReloadModal}
          onNewQuery={() => navigate("/verticais/credito-risco/spc-maxi")}
        />

        <div
          id="section-score"
          className="bg-white rounded-xl border border-gray-200 p-5 mb-4 mt-2"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Score</h2>

          {hasAnyScoreData || missingScoreCandidates.length > 0 ? (
            <div
              className={`grid grid-cols-1 items-center gap-6 ${scoreGridClassName}`}
            >
              {hasAnyScoreData && (
                <GraphScoreComponent
                  className="flex items-center gap-5 w-full"
                  normalizedScore={normalizedScore}
                  scoreColor={scoreColor}
                  radius={radius}
                  arcLength={arcLength}
                  circumference={circumference}
                  progressLength={progressLength}
                  badgeStyle={riscoInfo.badge}
                  badgeLabel={riscoInfo.label}
                  headerContent={
                    <strong className="text-xs text-gray-700">
                      {mainScoreLabel}
                    </strong>
                  }
                  message={mainScoreInterpretativeMessage}
                />
              )}

              {shouldShowDedicatedPeriodScores &&
                secondaryScoreCandidates.map((scoreItem) => {
                  const normalizedSecondaryScore = Math.min(
                    Math.max(scoreItem.score, 0),
                    1000,
                  );
                  const secondaryScoreColor = getScoreColor(
                    normalizedSecondaryScore,
                  );
                  const secondaryRiscoInfo = getRiscoInfo(
                    normalizedSecondaryScore,
                  );
                  const progressLengthSecondary =
                    (normalizedSecondaryScore / 1000) * arcLength;

                  return (
                    <Fragment key={scoreItem.source}>
                      <div className="flex items-center justify-center gap-5">
                        <GraphScoreComponent
                          className="flex items-center gap-5 w-full justify-start"
                          normalizedScore={normalizedSecondaryScore}
                          scoreColor={secondaryScoreColor}
                          radius={radius}
                          arcLength={arcLength}
                          circumference={circumference}
                          progressLength={progressLengthSecondary}
                          badgeStyle={secondaryRiscoInfo.badge}
                          badgeLabel={secondaryRiscoInfo.label}
                          headerContent={
                            <span className="text-xs text-gray-500">
                              Fonte:{" "}
                              <strong className="text-xs text-gray-700">
                                {scoreItem.label}
                              </strong>
                            </span>
                          }
                          message={scoreItem.message}
                        />
                      </div>
                    </Fragment>
                  );
                })}

              {missingScoreCandidates.map((scoreItem) => (
                <div
                  key={scoreItem.source}
                  className="flex h-fit min-w-0 items-center justify-between rounded-xl bg-slate-50 p-3"
                >
                  <p className="min-w-0 truncate text-sm font-semibold text-gray-700">
                    {scoreItem.label}
                  </p>

                  {scoreItem.source === "pj-mei" && scorePjMeiIndisponivel ? (
                    <span className="inline-flex shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700">
                      Não há dados disponíveis
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        openExtraInsumoConfirmation({
                          label: scoreItem.label,
                          insumoId: String(scoreItem.insumoId),
                        })
                      }
                      disabled={
                        hasExtraInsumoInProgress || extraConsultationExpired
                      }
                      className="flex shrink-0 items-center gap-2 self-start rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                      style={{
                        backgroundColor: "#C7D2FE",
                        color: "#243871",
                      }}
                    >
                      {consultingExtraInsumo?.label === scoreItem.label ? (
                        <span
                          className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"
                          style={{
                            borderColor: "#243871",
                            borderTopColor: "transparent",
                          }}
                        />
                      ) : (
                        <Search size={11} style={{ color: "#243871" }} />
                      )}

                      {consultingExtraInsumo?.label === scoreItem.label
                        ? "Consultando..."
                        : "Consultar"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : null}

          {consultingExtraInsumo &&
            scoreCandidates.some(
              (scoreItem) => scoreItem.label === consultingExtraInsumo.label,
            ) && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Consultando {consultingExtraInsumo.label}...
              </div>
            )}

          {extraInsumoErrorLabel &&
            scoreCandidates.some(
              (scoreItem) => scoreItem.label === extraInsumoErrorLabel,
            ) && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {extraInsumoErrorMessage}
              </div>
            )}
        </div>

        <div
          id="section-score"
          className="bg-white rounded-xl border border-gray-200 p-5 mb-4 mt-2"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Comportamento Financeiro
          </h2>

          <div className="flex items-stretch gap-4">
            <div className="flex h-full w-full flex-col justify-center self-stretch">
              {hasPontualidadeData &&
              !unavailableExtraInsumos.includes("Pontualidade de Pagamento") ? (
                <>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Pontualidade de Pagamento
                  </p>

                  <PercentageProgressIndicatorComponent
                    title="Pontualidade de Pagamento"
                    percentage={pontualidadePagamentoPercent}
                    barColor="#7EC8E3"
                    className="flex w-full flex-col justify-between rounded-lg bg-[#F8F9FB] shadow-none"
                  />
                </>
              ) : unavailableExtraInsumos.includes(
                  "Pontualidade de Pagamento",
                ) ? (
                <span className="inline-flex min-h-[65px] items-center rounded-lg bg-[#F8F9FB] px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700">
                  Não há dados disponíveis
                </span>
              ) : (
                <>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Pontualidade de Pagamento
                  </p>

                  <div className="w-full">
                    <div className="flex items-center justify-center w-[20%] rounded-xl bg-slate-50 p-3">
                      <ExtraInsumoButton
                        label="Pontualidade de Pagamento"
                        consultingLabel={consultingExtraInsumo?.label}
                        disabled={
                          extraConsultationExpired || hasExtraInsumoInProgress
                        }
                        onConsultar={() =>
                          openExtraInsumoConfirmation({
                            label: "Pontualidade de Pagamento",
                            insumoId: "5227",
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex h-full w-full flex-col justify-center self-stretch">
              {hasComprometimentoData &&
              !unavailableExtraInsumos.includes("Comportamento de Gastos") ? (
                <>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {spcData?.consumidor?.cpf
                      ? "Comprometimento de Gastos"
                      : "Comportamento de Gastos"}
                  </p>

                  <PercentageProgressIndicatorComponent
                    title={
                      spcData?.consumidor?.cpf
                        ? "Comprometimento de Gastos"
                        : "Comportamento de Gastos"
                    }
                    percentage={comprometimentoGastos.percentual}
                    barColor="#5B8DB8"
                    className="flex w-full flex-col justify-between rounded-lg bg-[#F8F9FB] shadow-none"
                    footer={
                      <span className="text-[8px] text-gray-500">
                        Maior concentração:{" "}
                        <strong className="text-[8px] text-gray-700">
                          {comprometimentoGastos.nome}
                        </strong>
                      </span>
                    }
                  />
                </>
              ) : unavailableExtraInsumos.includes(
                  "Comportamento de Gastos",
                ) ? (
                <span className="inline-flex min-h-[65px] items-center rounded-lg bg-[#F8F9FB] px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700">
                  Não há dados disponíveis
                </span>
              ) : (
                <>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {spcData?.consumidor?.cpf
                      ? "Comprometimento de Gastos"
                      : "Comportamento de Gastos"}
                  </p>

                  <div className="w-full">
                    <div className="flex items-center justify-center rounded-xl w-[20%] bg-slate-50 p-3">
                      <ExtraInsumoButton
                        label={
                          spcData?.consumidor?.cpf
                            ? "Comprometimento de Gastos"
                            : "Comportamento de Gastos"
                        }
                        consultingLabel={consultingExtraInsumo?.label}
                        disabled={
                          extraConsultationExpired || hasExtraInsumoInProgress
                        }
                        onConsultar={() =>
                          openExtraInsumoConfirmation({
                            label: spcData?.consumidor?.cpf
                              ? "Comprometimento de Gastos"
                              : "Comportamento de Gastos",
                            insumoId: "5224",
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {consultingExtraInsumo &&
            [
              "Pontualidade de Pagamento",
              "Comprometimento de Gastos",
              "Comportamento de Gastos",
            ].includes(consultingExtraInsumo.label) && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Consultando {consultingExtraInsumo.label}...
              </div>
            )}

          {extraInsumoErrorLabel &&
            ["Pontualidade de Pagamento", "Comportamento de Gastos"].includes(
              extraInsumoErrorLabel,
            ) && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {extraInsumoErrorMessage}
              </div>
            )}
        </div>

        <div
          id="section-score"
          className="bg-white rounded-xl border border-gray-200 p-5 mb-4 mt-2"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-4">SCR</h2>

          <div className="h-full min-w-0 w-full">
            <ScrSummarySection
              hasScrData={Boolean(hasScrData)}
              scrOperacao={scrOperacao}
              onConsultar={() =>
                handleConsultarInsumoExtra({
                  label: "Operações no SCR",
                  insumoId: "5256",
                })
              }
              isConsulting={consultingExtraInsumo?.label === "Operações no SCR"}
              consultationDisabled={
                extraConsultationExpired || hasExtraInsumoInProgress
              }
              isUnavailable={unavailableExtraInsumos.includes(
                "Operações no SCR",
              )}
            />
          </div>

          {consultingExtraInsumo?.label === "Operações no SCR" && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              Consultando {consultingExtraInsumo.label}...
            </div>
          )}

          {extraInsumoErrorLabel === "Operações no SCR" && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {extraInsumoErrorMessage}
            </div>
          )}
        </div>

        <div
          id="section-score"
          className="bg-white rounded-xl border border-gray-200 p-5 mb-4 mt-2"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Resumo Financeiro
          </h2>

          <ResumoFinanceiroSection
            items={resumoFinanceiroItens}
            onConsultar={handleConsultarInsumoExtra}
            isConsulting={Boolean(consultingExtraInsumo)}
            loadingItemLabel={consultingExtraInsumo?.label ?? null}
            unavailableLabels={[
              ...unavailableExtraInsumos,
              ...(limiteSugeridoIndisponivel ? ["Limite Sugerido"] : []),
            ]}
            consultationDisabled={
              extraConsultationExpired || hasExtraInsumoInProgress
            }
          />

          {consultingExtraInsumo &&
            resumoFinanceiroItens.some(
              (item) => item.label === consultingExtraInsumo.label,
            ) && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Consultando {consultingExtraInsumo.label}...
              </div>
            )}

          {extraInsumoErrorLabel &&
            resumoFinanceiroItens.some(
              (item) => item.label === extraInsumoErrorLabel,
            ) && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {extraInsumoErrorMessage}
              </div>
            )}
        </div>

        <NegativosConsolidadosSection
          groups={GROUPS}
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          expanded={expanded}
          setExpanded={setExpanded}
          resumoTabela={resumoTabela}
          visible={visible}
          remaining={remaining}
          shouldShowChart={shouldShowChart}
          chartData={chartData}
          handleSort={handleSort}
          sortKey={sortKey}
          sortDir={sortDir}
          expandedRowKey={expandedRowKey}
          setExpandedRowKey={setExpandedRowKey}
          spcData={spcData}
        />

        <AlertasSection alertas={alertas} />

        <InformacoesCadastraisSection spcData={spcData} body={body} />

        <GovernancaSection spcData={spcData} />

        <InformacoesPositivasSection spcData={spcData} />

        <ConsultasRealizadasSection
          spcData={spcData}
          consultasExpanded={consultasExpanded}
          setConsultasExpanded={setConsultasExpanded}
        />

        <HistoricoOperacoesScrSection
          spcData={spcData}
          scorePj={scorePj}
          getScoreColor={getScoreColor}
        />

        <QuickNavigationSection />
      </div>
    </>
  );
}
