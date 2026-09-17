import { cpf } from "cpf-cnpj-validator";

type FormatCpfMode = "input" | "display";

export function formatCpf(value?: string, mode: FormatCpfMode = "display"): string {
  const clean = cpf.strip(value ?? "");

  if (mode === "input") {
    const limited = clean.slice(0, 11);

    if (!limited) return "";

    return limited
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  if (!value) return "-";

  return cpf.format(clean) || "-";
}

export function formatCPF(value?: string): string {
  return formatCpf(value, "display");
}