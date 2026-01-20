import type {
  ImportOrderStatus,
  ShipmentStatus,
  ImportCostType,
  Currency,
} from "@repo/shared";

export const importOrderStatusLabels: Record<ImportOrderStatus, string> = {
  draft: "초안",
  confirmed: "확정",
  partially_shipped: "부분선적",
  shipped: "선적완료",
  arrived: "도착",
  customs_clearing: "통관중",
  cleared: "통관완료",
  completed: "완료",
  cancelled: "취소",
};

export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  pending: "대기",
  departed: "출항",
  in_transit: "운송중",
  arrived: "도착",
  customs_hold: "통관보류",
  customs_cleared: "통관완료",
  delivered: "입고완료",
  cancelled: "취소",
};

export const importCostTypeLabels: Record<ImportCostType, string> = {
  freight: "운임",
  insurance: "보험료",
  tariff: "관세",
  vat: "부가세",
  customs_fee: "통관수수료",
  inland_transport: "내륙운송",
  port_charge: "항만비용",
  bank_charge: "은행수수료",
  inspection: "검사비용",
  storage: "보관료",
  other: "기타",
};

export const currencyLabels: Record<Currency, string> = {
  USD: "USD ($)",
  EUR: "EUR (€)",
  JPY: "JPY (¥)",
  CNY: "CNY (¥)",
  KRW: "KRW (₩)",
};

export const currencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  JPY: "¥",
  CNY: "¥",
  KRW: "₩",
};
