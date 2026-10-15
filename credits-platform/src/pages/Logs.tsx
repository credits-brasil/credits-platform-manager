import { useEffect, useState } from "react";

import { FileText, KeyRound, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type LogLevel = "SUCCESS" | "INFO" | "WARNING" | "ERROR";

type PlatformLog = {
  id: string;
  title: string;
  description: string;
  entity: string;
  actor: string;
  source: string;
  level: LogLevel;
  time: string;
  requestPath?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  previousState?: unknown | null;
  newState?: unknown | null;
};

const API_URL = import.meta.env.VITE_API_URL ?? "";

const levelStyles: Record<LogLevel, string> = {
  SUCCESS: "bg-emerald-100 text-emerald-700",
  INFO: "bg-sky-100 text-sky-700",
  WARNING: "bg-amber-100 text-amber-700",
  ERROR: "bg-red-100 text-red-700",
};

const getLevelByAction = (action: string): LogLevel => {
  const normalized = action.toUpperCase();

  if (normalized.includes("ERROR") || normalized.includes("FAIL")) {
    return "ERROR";
  }

  if (normalized.includes("DELETE") || normalized.includes("INACTIVE") || normalized.includes("WARNING")) {
    return "WARNING";
  }

  if (normalized.includes("LOGIN") || normalized.includes("CREATE") || normalized.includes("UPDATE")) {
    return "SUCCESS";
  }

  return "INFO";
};

const formatJsonValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "null";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const formatMetadataValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatMetadataValue(item)).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const getFriendlyMetadataEntries = (log: PlatformLog): Array<{ label: string; value: string }> => {
  const entries: Array<[string, unknown]> = [
    ["Host", log.metadata?.host ?? null],
    ["Origem", log.metadata?.origin ?? null],
    ["Referer", log.metadata?.referer ?? null],
    ["Forwarded For", log.metadata?.forwardedFor ?? log.metadata?.["x-forwarded-for"] ?? null],
    ["Protocolo", log.metadata?.protocol ?? log.metadata?.["x-forwarded-proto"] ?? null],
    ["User Agent", log.userAgent ?? log.metadata?.userAgent ?? null],
    ["IP", log.ip ?? log.metadata?.ip ?? null],
  ];

  const extraEntries = Object.entries(log.metadata ?? {}).filter(([key]) => {
    const normalizedKey = key.toLowerCase();
    return ![
      "host",
      "origin",
      "referer",
      "forwardedfor",
      "x-forwarded-for",
      "protocol",
      "x-forwarded-proto",
      "useragent",
      "ip",
    ].includes(normalizedKey);
  });

  extraEntries.forEach(([key, value]) => {
    entries.push([key, value]);
  });

  return entries
    .map(([label, value]) => ({
      label,
      value: formatMetadataValue(value),
    }))
    .filter(({ value }) => value !== "")
    .slice(0, 8);
};

const mapApiLog = (entry: any): PlatformLog => {
  const action = String(entry?.action ?? "PLATFORM_EVENT");
  const actor = entry?.actor;
  const actorName = actor?.name ?? actor?.userId ?? "Sistema";

  return {
    id: entry?.id ?? entry?._id ?? `${Date.now()}-${Math.random()}`,
    title: action
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" "),
    description: entry?.newState
      ? `Estado atual: ${formatJsonValue(entry.newState)}`
      : "Registro de atividade da plataforma.",
    entity: entry?.entity ?? "Sistema",
    actor: actor ? `${actor.kind ?? "Sistema"} · ${actorName}` : actorName,
    source: entry?.source ?? "SYSTEM",
    requestPath: entry?.requestPath ?? null,
    ip: entry?.ip ?? null,
    userAgent: entry?.userAgent ?? null,
    metadata: entry?.metadata ?? null,
    level: getLevelByAction(action),
    time: entry?.createdAt
      ? new Date(entry.createdAt).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Agora",
    previousState: entry?.previousState ?? null,
    newState: entry?.newState ?? null,
  };
};

export default function LogsPage() {
  const [logs, setLogs] = useState<PlatformLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<PlatformLog | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadLogs = async () => {
      if (!API_URL) {
        setLogs([]);
        setTotalLogs(0);
        setTotalPages(1);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`${API_URL}/api/platform-logs?page=${page}&limit=10`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Logs indisponíveis");
        }

        const payload = await response.json();
        const nextLogs = (payload?.logs ?? []).map(mapApiLog);

        setLogs(nextLogs);
        setTotalLogs(Number(payload?.total ?? nextLogs.length));
        setTotalPages(Number(payload?.totalPages ?? 1));
      } catch {
        setLogs([]);
        setTotalLogs(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    void loadLogs();

    return () => {
      controller.abort();
    };
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Operações</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Logs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Visão centralizada de tudo que acontece na plataforma: autenticação, usuários, empresas, consultas e ações administrativas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText size={16} className="text-slate-600" />
            Feed de atividades da plataforma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Carregando logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Nenhum evento foi registrado pela API no momento.
            </div>
          ) : (
            logs.map((log) => {
              const metadataEntries = getFriendlyMetadataEntries(log);

              return (
                <div
                  key={log.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-start md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-800">{log.title}</p>
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${levelStyles[log.level]}`}>
                        {log.level}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-600">{log.description}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles size={12} className="text-orange-500" />
                        {log.entity}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <KeyRound size={12} className="text-slate-400" />
                        {log.actor}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                        {log.source === "SYSTEM" ? "Sistema" : log.source}
                      </span>
                    </div>

                    {(log.requestPath || metadataEntries.length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
                        {log.requestPath && (
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-1">Rota: {log.requestPath}</span>
                        )}
                        {metadataEntries.map(({ label, value }) => (
                          <span
                            key={`${log.id}-${label}`}
                            className="rounded-full border border-slate-200 bg-white px-2 py-1"
                            title={`${label}: ${value}`}
                          >
                            {label}: {value.length > 36 ? `${value.slice(0, 33)}...` : value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 md:min-w-[120px] md:flex-col md:items-end">
                    <span className="text-xs text-slate-500">{log.time}</span>
                    {(log.previousState !== null || log.newState !== null) && (
                      <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                        Ver JSON
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-xs text-slate-500">
                Página {page} de {totalPages} · {totalLogs} registros
              </span>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DrawerContent className="inset-y-0 right-0 bottom-auto left-auto m-0 h-full w-full max-w-[80vw] rounded-none border-l border-slate-200 bg-white text-slate-900 shadow-2xl">
          <DrawerHeader className="border-b border-slate-200 bg-slate-50 px-5 py-4 text-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <DrawerTitle className="text-lg font-semibold text-slate-900">Estado anterior e posterior</DrawerTitle>
                <DrawerDescription className="mt-1 text-sm text-slate-600">
                  {selectedLog ? `${selectedLog.title} · ${selectedLog.actor}` : "Comparação do payload antes e depois da ação."}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          {selectedLog && (
            <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
              <div className="mb-3 grid grid-cols-2 items-end gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="text-center text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
                  Antes
                </div>
                <div className="text-center text-2xl font-bold tracking-tight text-slate-700 md:text-3xl">
                  Depois
                </div>
              </div>

              <div className="mb-4 flex items-center justify-center text-xl font-medium text-slate-400">vs.</div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Estado anterior
                  </div>
                  <pre className="max-h-[70vh] overflow-auto bg-white p-3 text-[11px] leading-5 text-slate-800 whitespace-pre-wrap font-mono">
                    {formatJsonValue(selectedLog.previousState)}
                  </pre>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Estado posterior
                  </div>
                  <pre className="max-h-[70vh] overflow-auto bg-white p-3 text-[11px] leading-5 text-slate-800 whitespace-pre-wrap font-mono">
                    {formatJsonValue(selectedLog.newState)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
