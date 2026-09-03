type FormatCpfMode = "input" | "display";

export function formatCpf(cpf?: string, mode: FormatCpfMode = "display"): string {
  const value = (cpf ?? "").replace(/\D/g, "");

  if (mode === "input") {
    return value
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  if (!cpf) return "-";

  return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatCPF(cpf?: string): string {
  return formatCpf(cpf, "display");
}