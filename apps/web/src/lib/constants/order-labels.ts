import type {
  OrderType,
  OrderInReason,
  OrderOutReason,
  OrderStatus,
} from "@repo/shared";

export const typeLabels: Record<OrderType, string> = {
  stock_in: "입고",
  stock_out: "출고",
};

export const reasonLabels: Record<OrderInReason | OrderOutReason, string> = {
  container: "컨테이너 수입",
  domestic_purchase: "국내 구매",
  warehouse_transfer: "창고 이동",
  return: "반품",
  adjustment: "재고 조정",
  sales: "판매",
  sample: "샘플",
  slitting: "슬리팅",
  loss: "손실/폐기",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "대기중",
  field_processing: "현장처리중",
  awaiting_approval: "승인대기",
  approved: "승인완료",
  rejected: "반려",
  cancelled: "취소됨",
};

export const FIELD_QUEUE_DEFAULT_STATUSES: OrderStatus[] = [
  "pending",
  "field_processing",
];
