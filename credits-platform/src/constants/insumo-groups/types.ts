import type { ElementType } from "react";

export interface Insumo {
  id: string;
  label: string;
}

export interface InsumoGroup {
  id: string;
  title: string;
  icon: ElementType;
  items: Insumo[];
}