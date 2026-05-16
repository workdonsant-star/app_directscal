import type { AuthSession, AuthUser, SignInInput } from "@/lib/contracts";

export const authSessionCookieName = "directscal_session";

export const authCookieMaxAge = {
  default: 60 * 60 * 12,
  remember: 60 * 60 * 24 * 30,
};

type MockAuthUser = AuthUser & {
  password: string;
};

const seededAuthUsers: MockAuthUser[] = [
  {
    id: "user_superadmin",
    name: "Daniel Santos",
    email: "superadmin@directscal.com.br",
    company: "Directscal",
    role: "superadmin",
    password: "directscal123",
  },
  {
    id: "user_daniel",
    name: "Daniel Santos",
    email: "work.donsant@gmail.com",
    company: "Directscal",
    role: "admin",
    password: "directscal123",
  },
  {
    id: "user_cliente",
    name: "Marina Lopes",
    email: "cliente@directscal.com.br",
    company: "Vertex Logistics",
    role: "cliente",
    password: "omdx12345",
  },
];

export const demoAuthCredentials = {
  email: seededAuthUsers[0].email,
  password: seededAuthUsers[0].password,
};

const localSessionUser: AuthUser = {
  id: "user_local",
  name: "Conta de demonstração",
  email: "conta.local@directscal.local",
  company: "Directscal",
  role: "cliente",
};

function toAuthUser(user: MockAuthUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    company: user.company,
    role: user.role,
  };
}

function getExpiresAt(remember = false) {
  const maxAge = remember ? authCookieMaxAge.remember : authCookieMaxAge.default;

  return new Date(Date.now() + maxAge * 1000).toISOString();
}

export function getAuthCookieOptions(remember = false) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? authCookieMaxAge.remember : authCookieMaxAge.default,
  };
}

export function authenticateMockUser(input: SignInInput) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = seededAuthUsers.find(
    (candidate) => candidate.email.toLowerCase() === normalizedEmail,
  );

  if (!user || user.password !== input.password) {
    return null;
  }

  return toAuthUser(user);
}

export function createAuthSession(
  user: AuthUser,
  remember = false,
): AuthSession {
  return {
    token: `mock:${user.id}`,
    user,
    createdAt: new Date().toISOString(),
    expiresAt: getExpiresAt(remember),
  };
}

export function createLocalAuthSession(remember = false): AuthSession {
  const localId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());

  return {
    token: `local:${localId}`,
    user: localSessionUser,
    createdAt: new Date().toISOString(),
    expiresAt: getExpiresAt(remember),
  };
}

export function getAuthSessionFromCookie(cookieValue?: string | null) {
  if (!cookieValue) return null;

  const [kind, id] = cookieValue.split(":");

  if (kind === "mock" && id) {
    const user = seededAuthUsers.find((candidate) => candidate.id === id);

    if (!user) return null;

    return createAuthSession(toAuthUser(user), true);
  }

  if (kind === "local" && id) {
    return {
      token: cookieValue,
      user: localSessionUser,
      createdAt: new Date().toISOString(),
      expiresAt: getExpiresAt(true),
    } satisfies AuthSession;
  }

  return null;
}
