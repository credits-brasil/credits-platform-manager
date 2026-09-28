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

const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "credits-platform-access-token";
const REFRESH_TOKEN_KEY = "credits-platform-refresh-token";

type OrderStatus = "PROCESS" | "SUCCESS" | "FAILED";
type Order = {
  id: string;
  user_name: string;
  company_name: string;
  typeDocument: "CPF" | "CNPJ";
  document: string;
  duration: number;
  inputs: Record<string, unknown>;
  origin: string;
  ip: string;
  host: string;
  status: OrderStatus;
  createdAt: string;
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
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const query = useQuery({
    queryKey: ["orders", page, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search.trim()) params.set("search", search.trim());
      if (status !== "ALL") params.set("status", status);

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
                placeholder="Buscar usuário, empresa ou documento"
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
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                          Ver inputs
                        </Button>
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

      <Drawer open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DrawerContent className="inset-y-0 right-0 bottom-auto left-auto m-0 h-full w-full max-w-xl rounded-none border-l bg-background shadow-lg">
          <DrawerHeader>
            <DrawerTitle>Inputs da consulta</DrawerTitle>
            <DrawerDescription>
              {selectedOrder
                ? `${selectedOrder.user_name} · ${formatDate(selectedOrder.createdAt)}`
                : "Detalhes enviados para a consulta."}
            </DrawerDescription>
          </DrawerHeader>

          {selectedOrder && (
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border bg-slate-50 p-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Documento</p>
                  <p className="font-medium">{formatDocument(selectedOrder.document, selectedOrder.typeDocument)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Duração</p>
                  <p className="font-medium">{selectedOrder.duration} ms</p>
                </div>
              </div>

              <h2 className="mb-2 text-sm font-semibold text-slate-800">Payload enviado</h2>
              <pre className="overflow-x-auto rounded-lg border bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(selectedOrder.inputs ?? {}, null, 2)}
              </pre>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}