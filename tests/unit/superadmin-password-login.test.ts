import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
type Filter = { column: string; mode: "eq" | "ilike"; value: unknown };
type Operation = "insert" | "select" | "update" | "upsert";

const supabaseMock = vi.hoisted(() => ({
  state: {
    credentials: [] as Row[],
    leads: [] as Row[],
    members: [] as Row[],
    organizations: [] as Row[],
    skipMemberUpsert: false,
    users: [] as Row[],
  },
}));

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function matchesFilter(row: Row, filter: Filter) {
  const value = row[filter.column];

  if (filter.mode === "ilike") {
    return normalizeEmail(value) === normalizeEmail(filter.value);
  }

  return value === filter.value;
}

function getRows(table: string) {
  if (table === "users") return supabaseMock.state.users;
  if (table === "organizations") return supabaseMock.state.organizations;
  if (table === "organization_members") return supabaseMock.state.members;
  if (table === "user_password_credentials") {
    return supabaseMock.state.credentials;
  }
  if (table === "acquisition_leads") return supabaseMock.state.leads;

  return [];
}

function getConflictColumns(table: string) {
  if (table === "organization_members") return ["organization_id", "user_id"];
  if (table === "user_password_credentials") return ["user_id"];

  return ["id"];
}

let generatedId = 0;

class QueryBuilder {
  private committedRows: Row[] | null = null;
  private filters: Filter[] = [];
  private limitSize: number | null = null;
  private operation: Operation = "select";
  private payload: Row | null = null;

  constructor(private readonly table: string) {}

  eq(column: string, value: unknown) {
    this.filters.push({ column, mode: "eq", value });

    return this;
  }

  ilike(column: string, value: unknown) {
    this.filters.push({ column, mode: "ilike", value });

    return this;
  }

  insert(payload: Row) {
    this.operation = "insert";
    this.payload = payload;

    return this;
  }

  limit(value: number) {
    this.limitSize = value;

    return this;
  }

  order() {
    return this;
  }

  select() {
    return this;
  }

  update(payload: Row) {
    this.operation = "update";
    this.payload = payload;

    return this;
  }

  upsert(payload: Row) {
    this.operation = "upsert";
    this.payload = payload;
    this.committedRows = this.upsertRow();

    return this;
  }

  async maybeSingle<T = Row>() {
    return { data: (this.commit()[0] ?? null) as T | null, error: null };
  }

  async single<T = Row>() {
    return { data: (this.commit()[0] ?? null) as T | null, error: null };
  }

  async returns<T = Row[]>() {
    return { data: this.commit() as T, error: null };
  }

  private commit() {
    if (this.committedRows) return this.committedRows;
    if (this.operation === "insert") return this.insertRow();
    if (this.operation === "update") return this.updateRows();
    if (this.operation === "upsert") return this.upsertRow();

    return this.selectRows();
  }

  private insertRow() {
    const rows = getRows(this.table);
    const row = {
      id: `generated_${++generatedId}`,
      ...this.payload,
    };

    rows.push(row);

    return [row];
  }

  private selectRows() {
    const rows = getRows(this.table).filter((row) =>
      this.filters.every((filter) => matchesFilter(row, filter)),
    );

    return this.limitSize === null ? rows : rows.slice(0, this.limitSize);
  }

  private updateRows() {
    const rows = this.selectRows();

    for (const row of rows) {
      Object.assign(row, this.payload);
    }

    return rows;
  }

  private upsertRow() {
    if (this.table === "organization_members" && supabaseMock.state.skipMemberUpsert) {
      return [this.payload ?? {}];
    }

    const rows = getRows(this.table);
    const payload = this.payload ?? {};
    const conflictColumns = getConflictColumns(this.table);
    const existing = rows.find((row) =>
      conflictColumns.every((column) => row[column] === payload[column]),
    );

    if (existing) {
      Object.assign(existing, payload);

      return [existing];
    }

    const row = {
      id: `generated_${++generatedId}`,
      ...payload,
    };

    rows.push(row);

    return [row];
  }
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => new QueryBuilder(table),
    schema: () => ({
      from: (table: string) => new QueryBuilder(table),
    }),
  }),
}));

import {
  authenticateSuperadminPasswordUser,
  checkUserHasActiveAccess,
  resolveSupabaseAuthUser,
} from "@/lib/auth/supabase-auth";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = {
    ...originalEnv,
    AUTH_ORG_BY_DOMAIN: '{"directscal.com":"Directscal"}',
    AUTH_ENABLE_SUPERADMIN_PASSWORD_LOGIN: "true",
    AUTH_SUPERADMIN_EMAILS: "admin@directscal.com",
    AUTH_SUPERADMIN_PASSWORD: "senha-secreta",
    SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    SUPABASE_URL: "https://example.supabase.co",
  };

  generatedId = 0;
  supabaseMock.state.credentials = [];
  supabaseMock.state.leads = [];
  supabaseMock.state.members = [];
  supabaseMock.state.organizations = [];
  supabaseMock.state.skipMemberUpsert = false;
  supabaseMock.state.users = [];
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.clearAllMocks();
});

describe("resolveSupabaseAuthUser", () => {
  it("prioritizes a superadmin membership when the user has multiple roles", async () => {
    supabaseMock.state.users.push({
      email: "admin@directscal.com",
      id: "user_admin",
      image: null,
      name: "Admin",
    });
    supabaseMock.state.organizations.push(
      {
        employee_count: 10,
        id: "organization_client",
        name: "Cliente",
      },
      {
        employee_count: 1,
        id: "organization_admin",
        name: "Directscal",
      },
    );
    supabaseMock.state.members.push(
      {
        organization_id: "organization_client",
        role: "cliente",
        user_id: "user_admin",
      },
      {
        organization_id: "organization_admin",
        role: "superadmin",
        user_id: "user_admin",
      },
    );

    await expect(
      resolveSupabaseAuthUser("user_admin", "admin@directscal.com"),
    ).resolves.toMatchObject({
      company: "Directscal",
      role: "superadmin",
    });
  });
});

describe("authenticateSuperadminPasswordUser", () => {
  it("authenticates and provisions the configured superadmin", async () => {
    await expect(
      authenticateSuperadminPasswordUser({
        email: "ADMIN@directscal.com",
        password: "senha-secreta",
      }),
    ).resolves.toMatchObject({
      company: "Directscal",
      email: "admin@directscal.com",
      role: "superadmin",
    });

    expect(supabaseMock.state.credentials).toHaveLength(1);
    expect(supabaseMock.state.credentials[0]?.password_hash).not.toBe(
      "senha-secreta",
    );
  });

  it("rejects emails outside AUTH_SUPERADMIN_EMAILS", async () => {
    await expect(
      authenticateSuperadminPasswordUser({
        email: "cliente@directscal.com",
        password: "senha-secreta",
      }),
    ).resolves.toBeNull();

    expect(supabaseMock.state.users).toHaveLength(0);
  });

  it("rejects invalid passwords", async () => {
    await expect(
      authenticateSuperadminPasswordUser({
        email: "admin@directscal.com",
        password: "senha-errada",
      }),
    ).resolves.toBeNull();

    expect(supabaseMock.state.users).toHaveLength(0);
  });

  it("rejects when the feature flag is disabled", async () => {
    process.env.AUTH_ENABLE_SUPERADMIN_PASSWORD_LOGIN = "false";

    await expect(
      authenticateSuperadminPasswordUser({
        email: "admin@directscal.com",
        password: "senha-secreta",
      }),
    ).resolves.toBeNull();

    expect(supabaseMock.state.users).toHaveLength(0);
  });

  it("rejects when the final membership is not superadmin", async () => {
    supabaseMock.state.skipMemberUpsert = true;

    await expect(
      authenticateSuperadminPasswordUser({
        email: "admin@directscal.com",
        password: "senha-secreta",
      }),
    ).resolves.toBeNull();
  });
});

describe("checkUserHasActiveAccess", () => {
  it("rejects adapter-only users without membership or completed lead", async () => {
    supabaseMock.state.users = [
      { email: "diretorio@fahtomediagroup.com", id: "user_1" },
    ];

    await expect(
      checkUserHasActiveAccess("diretorio@fahtomediagroup.com"),
    ).resolves.toBe(false);
  });

  it("accepts users with an organization membership", async () => {
    supabaseMock.state.users = [
      { email: "diretorio@fahtomediagroup.com", id: "user_1" },
    ];
    supabaseMock.state.members = [{ id: "member_1", user_id: "user_1" }];

    await expect(
      checkUserHasActiveAccess("diretorio@fahtomediagroup.com"),
    ).resolves.toBe(true);
  });

  it("accepts users with a completed acquisition lead", async () => {
    supabaseMock.state.users = [
      { email: "diretorio@fahtomediagroup.com", id: "user_1" },
    ];
    supabaseMock.state.leads = [
      { id: "lead_1", status: "account_created", user_id: "user_1" },
    ];

    await expect(
      checkUserHasActiveAccess("diretorio@fahtomediagroup.com"),
    ).resolves.toBe(true);
  });
});
