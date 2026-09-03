export function formatCurrency(valor?: string | number): string {
  const numero = Number(valor ?? 0);

  return numero === 0
    ? "R$ 0"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(numero);
}