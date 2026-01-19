import type {
  SlittingJobWithRelations,
  Item,
  PaperType,
  Brand,
  Stock,
} from "@repo/shared";

/**
 * V2 slitting job type - roll-based workflow
 * V2 jobs have itemId and parentWidthMm set, with plannedRollCount for roll tracking
 */
export type V2SlittingJob = Omit<
  SlittingJobWithRelations,
  "itemId" | "parentWidthMm" | "item"
> & {
  itemId: string;
  parentWidthMm: number;
  item: Item & { paperType: PaperType; brand: Brand | null };
};

/**
 * V1 slitting job type - stock-based workflow (legacy)
 * V1 jobs use parentStockId to reference a specific stock item
 */
export type V1SlittingJob = Omit<
  SlittingJobWithRelations,
  "parentStock" | "parentStockId"
> & {
  parentStockId: string;
  parentStock: Stock & {
    item: Item & { paperType: PaperType; brand: Brand | null };
  };
};

/**
 * Type guard to check if a slitting job is V2 (roll-based workflow)
 * V2 jobs are identified by having both itemId and parentWidthMm set
 */
export function isV2SlittingJob(
  job: SlittingJobWithRelations,
): job is V2SlittingJob {
  return job.itemId !== null && job.parentWidthMm !== null && job.item !== null;
}

/**
 * Type guard to check if a slitting job is V1 (stock-based workflow)
 * V1 jobs are identified by having parentStockId set with valid parentStock relation
 */
export function isV1SlittingJob(
  job: SlittingJobWithRelations,
): job is V1SlittingJob {
  return (
    job.parentStockId !== null &&
    job.parentStock !== null &&
    job.parentStock.item !== null
  );
}

type ItemWithPaperType = {
  paperType?: { nameKo?: string | null; nameEn?: string | null } | null;
  grammage?: number | null;
  displayName?: string | null;
};

/**
 * Format item label for display
 * Shows paper type name (Korean preferred) with grammage
 * Falls back to displayName if paperType is not available
 * @example "백상지 80g" or "Custom Paper 120g"
 */
export function formatItemLabel(
  item: ItemWithPaperType | null | undefined,
): string {
  if (!item) return "-";

  const paperTypeName =
    item.paperType?.nameKo ?? item.paperType?.nameEn ?? item.displayName ?? "-";
  const grammage = item.grammage ? `${item.grammage}g` : "";

  return `${paperTypeName} ${grammage}`.trim() || "-";
}

/**
 * Format date string to Korean locale datetime
 * Compact format for tables: "1월 15일 14:30"
 * @param dateStr - ISO date string or null
 * @returns Formatted date string or "-" if null
 */
export function formatKoDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format date string to full Korean locale datetime
 * Full format: "2024. 1. 15. 오후 2:30:00"
 * @param dateStr - ISO date string or null
 * @returns Formatted date string or "-" if null
 */
export function formatKoDateTimeFull(
  dateStr: string | null | undefined,
): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ko-KR");
}
