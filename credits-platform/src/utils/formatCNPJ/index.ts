import { cnpj } from "cpf-cnpj-validator";

type FormatCnpjMode = "input" | "display";

export function formatCnpj(value?: string, mode: FormatCnpjMode = "display"): string {
  const clean = cnpj.strip(value ?? "");

  if (mode === "input") {
    const limited = clean.slice(0, 14);

    if (!limited) return "";

    const p1 = limited.slice(0, 2);
    const p2 = limited.slice(2, 5);
    const p3 = limited.slice(5, 8);
    const p4 = limited.slice(8, 12);
    const p5 = limited.slice(12, 14);

    if (limited.length <= 2) return p1;
    if (limited.length <= 5) return `${p1}.${p2}`;
    if (limited.length <= 8) return `${p1}.${p2}.${p3}`;
    if (limited.length <= 12) return `${p1}.${p2}.${p3}/${p4}`;

    return `${p1}.${p2}.${p3}/${p4}-${p5}`;
  }

  if (!value) return "-";

  return cnpj.format(clean) || "-";
}

export function formatCNPJ(value?: string): string {
  return formatCnpj(value, "display");
}
