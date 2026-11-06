import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileSpreadsheet, Loader2, Search, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { refreshAdminSession } from "@/lib/auth";
import { listCompanies } from "@/lib/company";
import { exportOrdersToXlsx, type OrderExportInput } from "@/lib/ordersExport";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "credits-platform-access-token";
const REFRESH_TOKEN_KEY = "credits-platform-refresh-token";

type OrderStatus = "PROCESS" | "SUCCESS" | "FAILED";
type OrderInputDetail = {
  code: string;
  label: string;
};

type Order = {
  id: string;
  user_name: string;
  company_document: string;
  company_name: string;
  protocol?: string | null;
  typeDocument: "CPF" | "CNPJ";
  product_name: string;
  document: string;
  duration: number;
  inputs: Record<string, unknown>;
  inputCodes?: string[];
  inputDetails?: OrderInputDetail[];
  origin: string;
  ip: string;
  host: string;
  status: OrderStatus;
  error?: string | null;
  createdAt: string;
  xml?: string | null;
  result?: unknown | null;
  json?: unknown | null;
};

const statusLabels: Record<OrderStatus, string> = {
  PROCESS: "Processando",
  SUCCESS: "Sucesso",
  FAILED: "Falhou",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDocument(value: string, type: Order["typeDocument"]) {
  const digits = value.replace(/\D/g, "");
  if (type === "CPF" && digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (type === "CNPJ" && digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return value;
}

function getOrderInputs(order: Order): OrderExportInput[] {
  if (order.inputDetails?.length) {
    return order.inputDetails.map((detail) => ({
      code: detail.code,
      label: detail.label,
      typeDocument: order.typeDocument,
      active: true,
    }));
  }
  return (order.inputCodes ?? []).map((code) => ({
    code,
    label: `Código ${code}`,
    typeDocument: order.typeDocument,
    active: true,
  }));
}

/**
 * Colunas da tabela principal; o mesmo array alimenta o cabeçalho e a exportação.
 * `exportable: false` mantém a coluna na tela, mas a omite da planilha.
 */
const ORDER_COLUMNS: { header: string; exportValue: (order: Order) => string; exportable?: false }[] = [
  { header: "ID Empresa", exportValue: (order) => formatDocument(order.company_document, "CNPJ") },
  { header: "Empresa", exportValue: (order) => order.company_name },
  { header: "Documento", exportValue: (order) => formatDocument(order.document, order.typeDocument) },
  { header: "Usuário", exportValue: (order) => order.user_name },
  { header: "Data", exportValue: (order) => formatDate(order.createdAt) },
  { header: "Tipo", exportValue: () => "Produto" },
  { header: "Produto", exportValue: (order) => order.product_name },
  { header: "Protocolo", exportValue: (order) => order.protocol || "-" },
  { header: "Duração", exportValue: (order) => `${order.duration} ms`, exportable: false },
  { header: "IP", exportValue: (order) => order.ip || "-", exportable: false },
  { header: "Host", exportValue: (order) => order.host || "-", exportable: false },
  { header: "Origem", exportValue: (order) => order.origin || "-" },
  { header: "Status", exportValue: (order) => statusLabels[order.status] },
  { header: "Erro", exportValue: (order) => (order.status === "FAILED" ? order.error || "Erro desconhecido." : "-") },
];

const EXPORT_COLUMNS = ORDER_COLUMNS.filter((column) => column.exportable !== false);
const INPUT_EXPORT_HEADERS = ["Código Insumo", "Insumo"];

/**
 * Achata a consulta para a planilha: uma linha "Produto" (colunas de insumo vazias)
 * seguida de uma cópia dela por insumo, com Tipo = "Insumo" e os dados do insumo.
 * Assim dá para filtrar/somar no Excel por Tipo, Produto, Insumo etc.
 */
function getOrderExportRows(order: Order): string[][] {
  const productCells = EXPORT_COLUMNS.map((column) => column.exportValue(order));
  const typeIndex = EXPORT_COLUMNS.findIndex((column) => column.header === "Tipo");
  const inputRows = getOrderInputs(order).map((input) => {
    const cells = [...productCells, input.code, input.label];
    if (typeIndex >= 0) cells[typeIndex] = "Insumo";
    return cells;
  });
  return [[...productCells, "", ""], ...inputRows];
}

type OrdersFilters = { search: string; status: "ALL" | OrderStatus; companyFilter: string };
type OrdersResponse = { orders: Order[]; pagination: { total: number; totalPages: number } };

async function fetchOrdersPage(page: number, pageSize: number, filters: OrdersFilters): Promise<OrdersResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.status !== "ALL") params.set("status", filters.status);
  if (filters.companyFilter !== "ALL") params.set("companyId", filters.companyFilter);

  const requestOrders = (accessToken: string) => fetch(`${API_URL}/api/orders?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let response = await requestOrders(localStorage.getItem(TOKEN_KEY) ?? "");
  if (response.status === 401) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const tokens = await refreshAdminSession(refreshToken);
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    response = await requestOrders(tokens.accessToken);
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Não foi possível carregar as consultas.");
  return data as OrdersResponse;
}

/** Busca todas as páginas que correspondem aos filtros atuais. */
async function fetchAllOrders(filters: OrdersFilters): Promise<Order[]> {
  const pageSize = 100;
  const first = await fetchOrdersPage(1, pageSize, filters);
  const all = [...first.orders];
  for (let page = 2; page <= first.pagination.totalPages; page++) {
    const next = await fetchOrdersPage(page, pageSize, filters);
    all.push(...next.orders);
  }
  return all;
}

function StatusIcon({ status }: { status: OrderStatus }) {
  if (status === "SUCCESS") return <CheckCircle2 size={15} className="text-emerald-600" />;
  if (status === "FAILED") return <XCircle size={15} className="text-red-300" />;
  return <Clock3 size={15} className="text-amber-600" />;
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [inputModalOrder, setInputModalOrder] = useState<Order | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: companyOptions = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => listCompanies(),
  });

  const query = useQuery({
    queryKey: ["orders", page, search, status, companyFilter],
    queryFn: () => fetchOrdersPage(page, 20, { search, status, companyFilter }),
  });

  const data = query.data;
  const orders = data?.orders ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const hasSpcSnapshot = (order: Order) => Boolean(order.xml || order.result !== null || order.json !== null);
  const hasSnapshot = Boolean(selectedOrder && hasSpcSnapshot(selectedOrder));
  const selectedInputRows = inputModalOrder ? getOrderInputs(inputModalOrder) : [];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const allOrders = await fetchAllOrders({ search, status, companyFilter });
      const timestamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
      await exportOrdersToXlsx({
        sheetName: "Consultas",
        columns: [...EXPORT_COLUMNS.map((column) => column.header), ...INPUT_EXPORT_HEADERS],
        rows: allOrders.flatMap(getOrderExportRows),
        fileName: `consultas_${timestamp}.xlsx`,
      });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Não foi possível exportar as consultas.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Operações</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Consultas</h1>
        <p className="mt-1 text-sm text-slate-500">Histórico das consultas realizadas na plataforma.</p>
      </div>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">Histórico de consultas</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <div className="relative min-w-0 sm:w-72">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Buscar usuário, empresa, documento ou protocolo"
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={(value: "ALL" | OrderStatus) => { setStatus(value); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="PROCESS">Processando</SelectItem>
                <SelectItem value="SUCCESS">Sucesso</SelectItem>
                <SelectItem value="FAILED">Falhou</SelectItem>
              </SelectContent>
            </Select>
            <Select value={companyFilter} onValueChange={(value) => { setCompanyFilter(value); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as empresas</SelectItem>
                {companyOptions.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              disabled={isExporting || !data?.pagination.total}
              className="gap-2 border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              {isExporting ? "Exportando..." : "Exportar XLS"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {query.isError ? (
            <p className="py-10 text-center text-sm text-red-600">{(query.error as Error).message}</p>
          ) : query.isLoading ? (
            <p className="py-10 text-center text-sm text-slate-500">Carregando consultas...</p>
          ) : orders.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Nenhuma consulta encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {ORDER_COLUMNS.map((column) => (
                      <TableHead key={column.header}>{column.header}</TableHead>
                    ))}
                    <TableHead className="text-right">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">{formatDocument(order.company_document, "CNPJ")}</TableCell>
                      <TableCell>{order.company_name}</TableCell>
                      <TableCell>{formatDocument(order.document, order.typeDocument)}</TableCell>
                      <TableCell className="font-medium">{order.user_name}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">Produto</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">{order.product_name}</TableCell>
                      <TableCell className="font-medium text-slate-700">{order.protocol || "-"}</TableCell>
                      <TableCell>{order.duration} ms</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">{order.ip || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">{order.host || "-"}</TableCell>
                      <TableCell>{order.origin || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === "SUCCESS" ? "success" : order.status === "FAILED" ? "destructive" : "secondary"} className="gap-1">
                          <StatusIcon status={order.status} />{statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[240px] text-xs text-slate-600">
                        {order.status === "FAILED" ? (
                          <span title={order.error ?? "Erro desconhecido."} className="line-clamp-2 break-words text-red-700">
                            {order.error || "Erro desconhecido."}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {(order.inputDetails?.length || order.inputCodes?.length) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setInputModalOrder(order)}
                            >
                              Ver inputs
                            </Button>
                          ) : null}
                          {hasSpcSnapshot(order) ? (
                            <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                              Ver SPC
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-slate-500">
            <span>{data?.pagination.total ?? 0} consultas</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} /></Button>
              <span>{page} / {Math.max(totalPages, 1)}</span>
              <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}><ChevronRight size={16} /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Drawer open={Boolean(inputModalOrder)} onOpenChange={(open) => !open && setInputModalOrder(null)}>
        <DrawerContent className="inset-y-0 right-0 bottom-auto left-auto m-0 h-full w-full max-w-[42rem] rounded-none border-l border-slate-200 bg-white text-slate-900 shadow-2xl">
          <DrawerHeader className="border-b border-slate-200 bg-slate-50 px-5 py-4 text-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <DrawerTitle className="text-lg font-semibold text-slate-900">Inputs utilizados</DrawerTitle>
                <DrawerDescription className="mt-1 text-sm text-slate-600">
                  {inputModalOrder ? `${inputModalOrder.user_name} · ${formatDate(inputModalOrder.createdAt)}` : "Detalhes dos inputs."}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="max-h-[calc(100vh-90px)] overflow-auto px-5 py-4">
            <div className="overflow-hidden rounded-md border border-slate-200">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="border-b border-slate-200 px-3 py-2 font-semibold">Código</th>
                    <th className="border-b border-slate-200 px-3 py-2 font-semibold">Insumo</th>
                    <th className="border-b border-slate-200 px-3 py-2 font-semibold">Tipo</th>
                    <th className="border-b border-slate-200 px-3 py-2 font-semibold">Ativo</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInputRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-500">Nenhum input disponível para esta consulta.</td>
                    </tr>
                  ) : (
                    selectedInputRows.map((input) => (
                      <tr key={`${inputModalOrder?.id ?? "input"}-${input.code}`} className="odd:bg-white even:bg-slate-50">
                        <td className="border-b border-slate-200 px-3 py-2 font-medium text-slate-900">{input.code}</td>
                        <td className="border-b border-slate-200 px-3 py-2 text-slate-700">{input.label}</td>
                        <td className="border-b border-slate-200 px-3 py-2 text-slate-600">{input.typeDocument}</td>
                        <td className="border-b border-slate-200 px-3 py-2">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${input.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {input.active ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DrawerContent className="inset-y-0 right-0 bottom-auto left-auto m-0 h-full w-full max-w-[80vw] rounded-none border-l border-slate-200 bg-white text-slate-900 shadow-2xl">
          <DrawerHeader className="border-b border-slate-200 bg-slate-50 px-5 py-4 text-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <DrawerTitle className="text-lg font-semibold text-slate-900">Detalhes da consulta</DrawerTitle>
                <DrawerDescription className="mt-1 text-sm text-slate-600">
                  {selectedOrder ? `${selectedOrder.user_name} · ${formatDate(selectedOrder.createdAt)}` : "Detalhes enviados para a consulta."}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          {selectedOrder && (
            <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
              <div className="mb-3 grid grid-cols-2 items-end gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="text-center text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
                  XML
                </div>
                <div className="text-center text-2xl font-bold tracking-tight text-slate-700 md:text-3xl">
                  JSON
                </div>
              </div>

              <div className="mb-4 flex items-center justify-center text-xl font-medium text-slate-400">vs.</div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    XML do SPC
                  </div>
                  <pre className="max-h-[70vh] overflow-auto bg-white p-3 text-[11px] leading-5 text-slate-800 whitespace-pre-wrap font-mono">
                    {selectedOrder.xml ?? "Nenhum XML salvo para esta consulta."}
                  </pre>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Result
                  </div>
                  <pre className="max-h-[70vh] overflow-auto bg-white p-3 text-[11px] leading-5 text-slate-800 whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedOrder.result ?? {}, null, 2)}
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