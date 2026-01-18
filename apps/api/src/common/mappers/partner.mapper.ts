import type { Partner, PartnerType } from "@repo/shared";

export interface DbPartner {
  id: string;
  partner_code: string;
  name: string;
  name_local: string | null;
  partner_type: string;
  country_code: string;
  address: string | null;
  city: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  supplier_currency: string | null;
  supplier_payment_terms: string | null;
  lead_time_days: number | null;
  customer_currency: string | null;
  customer_payment_terms: string | null;
  credit_limit: string | number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function mapPartner(db: DbPartner): Partner {
  return {
    id: db.id,
    partnerCode: db.partner_code,
    name: db.name,
    nameLocal: db.name_local,
    partnerType: db.partner_type as PartnerType,
    countryCode: db.country_code,
    address: db.address,
    city: db.city,
    contactName: db.contact_name,
    contactEmail: db.contact_email,
    contactPhone: db.contact_phone,
    supplierCurrency: db.supplier_currency,
    supplierPaymentTerms: db.supplier_payment_terms,
    leadTimeDays: db.lead_time_days,
    customerCurrency: db.customer_currency,
    customerPaymentTerms: db.customer_payment_terms,
    creditLimit: db.credit_limit ? Number(db.credit_limit) : null,
    isActive: db.is_active,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapPartnerNullable(db: DbPartner | null): Partner | null {
  if (!db) return null;
  return mapPartner(db);
}
