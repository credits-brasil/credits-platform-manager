export interface AuthAdmin {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  accessToken: string;
  admin: AuthAdmin;
}

const API_URL = import.meta.env.VITE_API_URL

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthSession> {
  const normalizedEmail = email.trim();


  const response = await fetch(`${API_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizedEmail, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível autenticar.");
  }

  return data.session as AuthSession;
}
