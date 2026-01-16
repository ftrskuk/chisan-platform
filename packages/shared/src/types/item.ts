import type { Brand } from "./partner";

export const ITEM_FORMS = ["roll", "sheet"] as const;
export type ItemForm = (typeof ITEM_FORMS)[number];

export interface PaperType {
  id: string;
  code: string;
  nameEn: string;
  nameKo: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface Item {
  id: string;
  itemCode: string;
  displayName: string;
  paperTypeId: string;
  brandId: string | null;
  grammage: number;
  form: ItemForm;
  coreDiameterInch: number | null;
  lengthMm: number | null;
  sheetsPerReam: number | null;
  unitOfMeasure: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemWithRelations extends Item {
  paperType: PaperType;
  brand: Brand | null;
}
