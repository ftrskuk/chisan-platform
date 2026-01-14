export const LOCATION_TYPES = [
  "default",
  "zone",
  "rack",
  "shelf",
  "floor",
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  contactName: string | null;
  contactPhone: string | null;
  isActive: boolean;
  isDefault: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  warehouseId: string;
  code: string;
  name: string | null;
  type: LocationType;
  parentId: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseWithLocations extends Warehouse {
  locations: Location[];
}
