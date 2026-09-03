import { ShieldCheck, Users, Building2, TrendingUp, FileText } from "lucide-react";
import type { InsumoGroup } from "./types";

export const CNPJ_INSUMO_GROUPS: InsumoGroup[] = [
  {
    id: "risco-credito",
    title: "Risco de Crédito",
    icon: ShieldCheck,
    items: [
      { id: "78", label: "Score 12 meses" },
      { id: "77", label: "Score 3 meses" },
      { id: "5229", label: "Score PJ" },
      { id: "5247", label: "Score PJ MEI" },
    ],
  },
  {
    id: "comportamentais-cadastrais",
    title: "Comportamentais & Cadastrais",
    icon: Users,
    items: [
      { id: "5179", label: "Limite de Crédito PJ" },
      { id: "5265", label: "Participação no Mercado de Capitais" },
      { id: "5267", label: "Quantidade de funcionários" },
    ],
  },
  {
    id: "socios-administradores",
    title: "Sócios & Administradores",
    icon: Building2,
    items: [
      { id: "24", label: "Participação Empresa" },
      { id: "49", label: "Quadro administrativo" },
      { id: "23", label: "Controle Societário" },
      { id: "5186", label: "Quadro Social Mais Completo PJ" },
    ],
  },
  {
    id: "informacoes-positivas",
    title: "Informações Positivas",
    icon: TrendingUp,
    items: [
      { id: "5185", label: "Gasto Financeiro Estimado PJ " },
      { id: "5178", label: "Faturamento Presumido" },
      { id: "5224", label: "Índice de Comportamento de Gastos" },
      { id: "5227", label: "Índice Pontualidade de Pagamento" },
    ],
  },
  {
    id: "informacoes-scr",
    title: "Informações do SCR",
    icon: FileText,
    items: [
      { id: "5256", label: "Operações no SCR" },
      { id: "5257", label: "Histórico de Operações no SCR" },
    ],
  },
];