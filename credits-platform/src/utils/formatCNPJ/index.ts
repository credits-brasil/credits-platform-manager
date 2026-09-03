type FormatCnpjMode = "input" | "display";

export function formatCnpj(cnpj?: string, mode: FormatCnpjMode = "display"): string {
  if (mode === "input") {
    const clean = (cnpj ?? "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 14);
    const p1 = clean.slice(0, 2);
    const p2 = clean.slice(2, 5);
    const p3 = clean.slice(5, 8);
    const p4 = clean.slice(8, 12);
    const p5 = clean.slice(12, 14);

    if (clean.length <= 2) return p1;
    if (clean.length <= 5) return `${p1}.${p2}`;
    if (clean.length <= 8) return `${p1}.${p2}.${p3}`;
    if (clean.length <= 12) return `${p1}.${p2}.${p3}/${p4}`;

    return `${p1}.${p2}.${p3}/${p4}-${p5}`;
  }

  if (!cnpj) return "-";

  const value = cnpj.replace(/\D/g, "");

  return value.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5",
  );
}

export function formatCNPJ(cnpj?: string): string {
  return formatCnpj(cnpj, "display");
}