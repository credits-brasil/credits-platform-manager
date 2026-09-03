import {
  ShieldCheck,
  TrendingUp,
  Users,
  FileText,
  HatGlasses,
} from "lucide-react";
import type { InsumoGroup } from "./types";

export const CPF_INSUMO_GROUPS: InsumoGroup[] = [
  {
    id: "risco-credito",
    title: "Risco de Crédito",
    icon: ShieldCheck,
    items: [
      { id: "78", label: "Score 12 meses" },
      { id: "77", label: "Score 3 meses" },
      {
        id: "5239",
        label: "Classificação de Risco dos Débitos Ativos",
      },
    ],
  },
  {
    id: "informacoes-positivas",
    title: "Informações Positivas",
    icon: TrendingUp,
    items: [
      { id: "5228", label: "Score + Positivo" },
      { id: "5122", label: "Renda Presumida + Positivo" },
      { id: "5224", label: "Índice de Comportamento de Gastos" },
      { id: "5227", label: "Índice Pontualidade de Pagamento" },
    ],
  },
  {
    id: "comportamentais-cadastrais",
    title: "Comportamentais & Cadastrais",
    icon: Users,
    items: [
      { id: "5142", label: "Limite de Crédito Sugerido" },
      { id: "5194", label: "Comprometimento de Renda Mensal" },
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
  {
    id: "solucoes-antifraude",
    title: "Soluções Antifraude",
    icon: HatGlasses,
    items: [
      { id: "5264", label: "Alerta de CPF suspeito" },
      // { id: "5268", label: "SPC Valida Celular" },
      { id: "5262", label: "Alerta de Identidade à Fraude" },
    ],
  },
];