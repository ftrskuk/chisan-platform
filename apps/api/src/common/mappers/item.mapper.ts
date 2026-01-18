import type { Item, ItemForm } from "@repo/shared";

export interface DbItem {
  id: string;
  item_code: string;
  display_name: string;
  paper_type_id: string;
  brand_id: string | null;
  grammage: number;
  form: string;
  core_diameter_inch: string | number | null;
  length_mm: number | null;
  sheets_per_ream: number | null;
  unit_of_measure: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function mapItem(db: DbItem): Item {
  return {
    id: db.id,
    itemCode: db.item_code,
    displayName: db.display_name,
    paperTypeId: db.paper_type_id,
    brandId: db.brand_id,
    grammage: db.grammage,
    form: db.form as ItemForm,
    coreDiameterInch: db.core_diameter_inch
      ? Number(db.core_diameter_inch)
      : null,
    lengthMm: db.length_mm,
    sheetsPerReam: db.sheets_per_ream,
    unitOfMeasure: db.unit_of_measure,
    isActive: db.is_active,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}
