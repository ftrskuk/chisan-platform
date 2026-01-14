export const PARTNER_TYPES = ["supplier", "customer", "both"] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export interface Partner {
  id: string;
  partnerCode: string;
  name: string;
  nameLocal: string | null;
  partnerType: PartnerType;
  countryCode: string;
  address: string | null;
  city: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  supplierCurrency: string | null;
  supplierPaymentTerms: string | null;
  leadTimeDays: number | null;
  customerCurrency: string | null;
  customerPaymentTerms: string | null;
  creditLimit: number | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  partnerId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerWithBrands extends Partner {
  brands: Brand[];
}
