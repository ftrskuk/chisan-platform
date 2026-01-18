import type { PaperType } from "@repo/shared";

export interface DbPaperType {
  id: string;
  code: string;
  name_en: string;
  name_ko: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export function mapPaperType(db: DbPaperType): PaperType {
  return {
    id: db.id,
    code: db.code,
    nameEn: db.name_en,
    nameKo: db.name_ko,
    description: db.description,
    sortOrder: db.sort_order,
    isActive: db.is_active,
    createdAt: db.created_at,
  };
}
