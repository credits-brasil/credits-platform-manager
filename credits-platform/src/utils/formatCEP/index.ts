export function formatCEP(cep?: string): string {
  if (!cep) return "-";

  const value = cep.replace(/\D/g, "").padStart(8, "0");

  return value.replace(/(\d{5})(\d{3})/, "$1-$2");
}