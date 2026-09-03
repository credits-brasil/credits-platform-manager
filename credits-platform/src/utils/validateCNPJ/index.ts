function cnpjCharValue(ch: string): number {
  return ch.toUpperCase().charCodeAt(0) - 48;
}

export function validateCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  if (clean.length !== 14) return false;
  if (/^(.)\1+$/.test(clean)) return false;
  if (!/^\d$/.test(clean[12]) || !/^\d$/.test(clean[13])) return false;

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const calcDigit = (weights: number[]) => {
    const sum = weights.reduce(
      (acc, w, i) => acc + cnpjCharValue(clean[i]) * w,
      0,
    );
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return (
    calcDigit(w1) === Number.parseInt(clean[12], 10) &&
    calcDigit(w2) === Number.parseInt(clean[13], 10)
  );
}