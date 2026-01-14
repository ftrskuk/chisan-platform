export const SETTING_CATEGORIES = [
  "company",
  "regional",
  "inventory",
  "notifications",
] as const;
export type SettingCategory = (typeof SETTING_CATEGORIES)[number];

export interface Setting {
  id: string;
  category: SettingCategory;
  key: string;
  value: unknown;
  description: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

export interface SettingsMap {
  company: {
    name: string;
    address: string;
  };
  regional: {
    timezone: string;
    locale: string;
    currency: string;
  };
  inventory: {
    default_warehouse: string | null;
    fifo_enabled: boolean;
  };
  notifications: {
    email_enabled: boolean;
    slack_webhook: string | null;
  };
}
