export type OperatorRole = "ADMIN" | "OPERATOR";
export type OperatorCompanyStatus = "ACTIVE" | "INACTIVE";

export interface Operator {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyOperator {
  id: string;
  companyId: string;
  operatorId: string;
  role: OperatorRole;
  status: OperatorCompanyStatus;
  createdAt: string;
  updatedAt: string;
  operator: Operator;
  company: {
    id: string;
    name: string;
    cnpj: string;
    status: "ACTIVE" | "INACTIVE" | "DELETED";
  };
}

export interface CompanyOperatorCreatePayload {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  password?: string;
  role?: OperatorRole;
  status?: OperatorCompanyStatus;
}

export type CompanyOperatorUpdatePayload = Partial<CompanyOperatorCreatePayload>;

const API_URL = import.meta.env.VITE_API_URL

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível completar a operação.");
  }

  return data;
}

export async function listCompanyOperators(companyId: string): Promise<CompanyOperator[]> {
  const response = await fetch(`${API_URL}/api/company/${companyId}/operators`);
  const data = await handleResponse<{ operators: CompanyOperator[] }>(response);

  return data.operators;
}

export async function getCompanyOperatorByCpf(companyId: string, cpf: string): Promise<{
  exists: boolean;
  operator: Operator | null;
  alreadyLinkedToCompany: boolean;
}> {
  const response = await fetch(
    `${API_URL}/api/company/${companyId}/operators/lookup?cpf=${encodeURIComponent(cpf)}`,
  );

  const data = await handleResponse<{
    exists: boolean;
    operator: Operator | null;
    alreadyLinkedToCompany: boolean;
  }>(response);

  return data;
}

export async function createCompanyOperator(
  companyId: string,
  payload: CompanyOperatorCreatePayload,
): Promise<CompanyOperator> {
  const response = await fetch(`${API_URL}/api/company/${companyId}/operators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ companyOperator: CompanyOperator }>(response);

  return data.companyOperator;
}

export async function updateCompanyOperator(
  companyId: string,
  id: string,
  payload: CompanyOperatorUpdatePayload,
): Promise<CompanyOperator> {
  const response = await fetch(`${API_URL}/api/company/${companyId}/operators/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ companyOperator: CompanyOperator }>(response);

  return data.companyOperator;
}

export async function deleteCompanyOperator(
  companyId: string,
  id: string,
): Promise<CompanyOperator> {
  const response = await fetch(`${API_URL}/api/company/${companyId}/operators/${id}`, {
    method: "DELETE",
  });
  const data = await handleResponse<{ companyOperator: CompanyOperator }>(response);

  return data.companyOperator;
}
