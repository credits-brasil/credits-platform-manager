export function getCompanyAge(foundationDate?: string): number | string {
  if (!foundationDate) return "-";

  const date = new Date(foundationDate);

  if (Number.isNaN(date.getTime())) return "-";

  const today = new Date();

  let years = today.getFullYear() - date.getFullYear();

  const hasNotHadBirthdayThisYear =
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());

  if (hasNotHadBirthdayThisYear) {
    years--;
  }

  return years;
}