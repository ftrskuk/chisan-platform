import type { Brand } from "@repo/shared";

export interface DbBrand {
  id: string;
  partner_id: string;
  code: string;
  name: string;
  internal_code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function mapBrand(db: DbBrand): Brand {
  return {
    id: db.id,
    partnerId: db.partner_id,
    code: db.code,
    name: db.name,
    internalCode: db.internal_code,
    description: db.description,
    isActive: db.is_active,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}
