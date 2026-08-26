import { z } from "zod";

const minhaReceitaCompanySchema = z
  .object({
    cnpj: z.string(),
    razao_social: z.string().min(1),
    nome_fantasia: z.string().nullish(),
    descricao_situacao_cadastral: z.string().nullish(),
    data_inicio_atividade: z.string().nullish(),
    cnae_fiscal: z.union([z.number(), z.string()]).nullish(),
    cnae_fiscal_descricao: z.string().nullish(),
    natureza_juridica: z.string().nullish(),
    porte: z.string().nullish(),
    descricao_tipo_de_logradouro: z.string().nullish(),
    logradouro: z.string().nullish(),
    numero: z.string().nullish(),
    complemento: z.string().nullish(),
    bairro: z.string().nullish(),
    cep: z.string().nullish(),
    municipio: z.string().nullish(),
    uf: z.string().nullish(),
  })
  .passthrough();

export type CompanyRegistryLookup = {
  companyName: string;
  values: Record<string, string>;
};

export class CompanyRegistryLookupError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 503,
  ) {
    super(message);
    this.name = "CompanyRegistryLookupError";
  }
}

export function normalizeCnpj(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCnpj(value: string) {
  const cnpj = normalizeCnpj(value);

  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calculateDigit = (length: number) => {
    const weights = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const total = weights.reduce(
      (sum, weight, index) => sum + Number(cnpj[index]) * weight,
      0,
    );
    const remainder = total % 11;

    return remainder < 2 ? 0 : 11 - remainder;
  };

  return (
    Number(cnpj[12]) === calculateDigit(12) &&
    Number(cnpj[13]) === calculateDigit(13)
  );
}

function compact(parts: Array<string | null | undefined>, separator = ", ") {
  return parts.map((part) => part?.trim()).filter(Boolean).join(separator);
}

export function mapMinhaReceitaCompany(rawData: unknown): CompanyRegistryLookup {
  const company = minhaReceitaCompanySchema.parse(rawData);
  const addressLine = compact([
    compact([company.descricao_tipo_de_logradouro, company.logradouro], " "),
    company.numero,
    company.complemento,
    company.bairro,
    company.cep,
  ]);
  const values: Record<string, string | null | undefined> = {
    cnpj: normalizeCnpj(company.cnpj),
    razao_social: company.razao_social.trim(),
    nome_fantasia: company.nome_fantasia,
    situacao_cadastral: company.descricao_situacao_cadastral,
    data_inicio_atividade: company.data_inicio_atividade,
    cnae_fiscal:
      company.cnae_fiscal === null || company.cnae_fiscal === undefined
        ? null
        : String(company.cnae_fiscal),
    cnae_fiscal_descricao: company.cnae_fiscal_descricao,
    natureza_juridica: company.natureza_juridica,
    porte_receita: company.porte,
    endereco_registrado: addressLine || null,
    municipio_registro: company.municipio,
    uf_registro: company.uf,
  };

  return {
    companyName: company.razao_social.trim(),
    values: Object.fromEntries(
      Object.entries(values).flatMap(([key, value]) => {
        const normalizedValue = value?.trim();
        return normalizedValue ? [[key, normalizedValue]] : [];
      }),
    ),
  };
}

export async function lookupCompanyByCnpj(
  rawCnpj: string,
): Promise<CompanyRegistryLookup> {
  const cnpj = normalizeCnpj(rawCnpj);

  if (!isValidCnpj(cnpj)) {
    throw new CompanyRegistryLookupError("Informe um CNPJ válido.", 400);
  }

  let response: Response;

  try {
    response = await fetch(`https://minhareceita.org/${cnpj}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new CompanyRegistryLookupError(
      "Não foi possível consultar o CNPJ agora. Tente novamente.",
      503,
    );
  }

  if (response.status === 404) {
    throw new CompanyRegistryLookupError("CNPJ não encontrado.", 404);
  }

  if (!response.ok) {
    throw new CompanyRegistryLookupError(
      "Não foi possível consultar o CNPJ agora. Tente novamente.",
      503,
    );
  }

  const rawData: unknown = await response.json().catch(() => null);

  try {
    return mapMinhaReceitaCompany(rawData);
  } catch {
    throw new CompanyRegistryLookupError(
      "A consulta do CNPJ retornou dados incompletos. Tente novamente.",
      503,
    );
  }
}
