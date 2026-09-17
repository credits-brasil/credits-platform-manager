export type UserStatus = "ACTIVE" | "INACTIVE" | "DELETED";

export interface User {
  id: string;
  name: string;
  cpf: string;
  email: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreatePayload {
  name: string;
  cpf: string;
  email: string;
  password?: string;
}

export type UserUpdatePayload = Partial<UserCreatePayload> & {
  status?: "ACTIVE" | "INACTIVE";
};

const API_URL = import.meta.env.VITE_API_URL

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível completar a operação.");
  }

  return data;
}

export async function listUsers(search?: string): Promise<User[]> {
  const query = search?.trim();
  const url = new URL(`${API_URL}/api/users`);

  if (query) {
    url.searchParams.set("q", query);
  }

  const response = await fetch(url.toString());
  const data = await handleResponse<{ users: User[] }>(response);

  return data.users;
}

export async function createUser(payload: UserCreatePayload): Promise<User> {
  const response = await fetch(`${API_URL}/api/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ user: User }>(response);

  return data.user;
}

export async function updateUser(
  id: string,
  payload: UserUpdatePayload,
): Promise<User> {
  const response = await fetch(`${API_URL}/api/user/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ user: User }>(response);

  return data.user;
}

export async function toggleUserStatus(id: string): Promise<User> {
  const response = await fetch(`${API_URL}/api/user/${id}/status`, {
    method: "PATCH",
  });
  const data = await handleResponse<{ user: User }>(response);

  return data.user;
}

export async function deleteUser(id: string): Promise<User> {
  const response = await fetch(`${API_URL}/api/user/${id}`, {
    method: "DELETE",
  });
  const data = await handleResponse<{ user: User }>(response);

  return data.user;
}
