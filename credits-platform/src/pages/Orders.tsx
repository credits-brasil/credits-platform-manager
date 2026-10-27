import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, Search, XCircle } from "lucide-react";

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
  company_name: string;
  protocol?: string | null;
  typeDocument: "CPF" | "CNPJ";
  document: string;
  duration: number;
  inputs: Record<string, unknown>;
  inputCodes?: string[];
  inputDetails?: OrderInputDetail[];
  origin: string;
  ip: string;
  host: string;
  status: OrderStatus;
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

function StatusIcon({ status }: { status: OrderStatus }) {
  if (status === "SUCCESS") return <CheckCircle2 size={15} className="text-emerald-600" />;
  if (status === "FAILED") return <XCircle size={15} className="text-red-600" />;
  return <Clock3 size={15} className="text-amber-600" />;
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [inputModalOrder, setInputModalOrder] = useState<Order | null>(null);

  const { data: companyOptions = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => listCompanies(),
  });

  const query = useQuery({
    queryKey: ["orders", page, search, status, companyFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search.trim()) params.set("search", search.trim());
      if (status !== "ALL") params.set("status", status);
      if (companyFilter !== "ALL") params.set("companyId", companyFilter);

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
      return data as { orders: Order[]; pagination: { total: number; totalPages: number } };
    },
  });

  const data = query.data;
  const orders = data?.orders ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const hasSpcSnapshot = (order: Order) => Boolean(order.xml || order.result !== null || order.json !== null);
  const hasSnapshot = Boolean(selectedOrder && hasSpcSnapshot(selectedOrder));
  const selectedInputRows = inputModalOrder
    ? (inputModalOrder.inputDetails?.length
        ? inputModalOrder.inputDetails.map((detail) => ({
            id: detail.code,
            code: detail.code,
            label: detail.label,
            typeDocument: inputModalOrder.typeDocument,
            active: true,
            createdAt: inputModalOrder.createdAt,
            updatedAt: inputModalOrder.createdAt,
          }))
        : (inputModalOrder.inputCodes ?? []).map((code) => ({
            id: code,
            code,
            label: `Código ${code}`,
            typeDocument: inputModalOrder.typeDocument,
            active: true,
            createdAt: inputModalOrder.createdAt,
            updatedAt: inputModalOrder.createdAt,
          })))
    : [];

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
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="font-medium">{order.user_name}</TableCell>
                      <TableCell>{order.company_name}</TableCell>
                      <TableCell>{formatDocument(order.document, order.typeDocument)}</TableCell>
                      <TableCell className="font-medium text-slate-700">{order.protocol || "-"}</TableCell>
                      <TableCell>{order.duration} ms</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">{order.ip || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">{order.host || "-"}</TableCell>
                      <TableCell>{order.origin || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === "SUCCESS" ? "default" : order.status === "FAILED" ? "destructive" : "secondary"} className="gap-1">
                          <StatusIcon status={order.status} />{statusLabels[order.status]}
                        </Badge>
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
                    <th className="border-b border-slate-200 px-3 py-2 font-semibold">Label</th>
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
                      <tr key={`${inputModalOrder?.id ?? "input"}-${input.id}`} className="odd:bg-white even:bg-slate-50">
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