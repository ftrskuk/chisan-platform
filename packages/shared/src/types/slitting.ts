import type { Item, PaperType } from "./item";
import type { Brand } from "./partner";
import type { Stock } from "./stock";
import type { User } from "./user";

export const MACHINE_STATUSES = ["idle", "running", "maintenance"] as const;
export type MachineStatus = (typeof MACHINE_STATUSES)[number];

export const SCHEDULE_STATUSES = [
  "draft",
  "published",
  "in_progress",
  "completed",
] as const;
export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

export const JOB_STATUSES = [
  "pending",
  "ready",
  "in_progress",
  "completed",
  "approved",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const SLITTING_ENTITY_TYPES = ["schedule", "job"] as const;
export type SlittingEntityType = (typeof SLITTING_ENTITY_TYPES)[number];

export const SLITTING_HISTORY_ACTIONS = [
  "created",
  "updated",
  "published",
  "ready",
  "started",
  "completed",
  "approved",
  "cancelled",
] as const;
export type SlittingHistoryAction = (typeof SLITTING_HISTORY_ACTIONS)[number];

export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SlittingSchedule {
  id: string;
  scheduleNumber: string;
  scheduledDate: string;
  status: ScheduleStatus;
  createdBy: string;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SlittingJob {
  id: string;
  scheduleId: string;
  machineId: string;
  parentStockId: string;
  operatorId: string | null;
  sequenceNumber: number;
  status: JobStatus;
  startedAt: string | null;
  completedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SlittingOutput {
  id: string;
  jobId: string;
  itemId: string;
  widthMm: number;
  quantity: number;
  weightKg: number | null;
  qrCode: string | null;
  isLoss: boolean;
  notes: string | null;
  createdAt: string;
}

export interface SlittingHistory {
  id: string;
  entityType: SlittingEntityType;
  entityId: string;
  action: SlittingHistoryAction;
  actorId: string;
  previousStatus: string | null;
  newStatus: string | null;
  changes: Record<string, unknown> | null;
  memo: string | null;
  createdAt: string;
}

export interface SlittingOutputWithRelations extends SlittingOutput {
  item: Item & { paperType: PaperType; brand: Brand | null };
}

export interface SlittingJobWithRelations extends SlittingJob {
  schedule: SlittingSchedule;
  machine: Machine;
  parentStock: Stock & {
    item: Item & { paperType: PaperType; brand: Brand | null };
  };
  operator: Pick<User, "id" | "displayName" | "email"> | null;
  approvedByUser: Pick<User, "id" | "displayName" | "email"> | null;
  outputs: SlittingOutputWithRelations[];
}

export interface SlittingScheduleWithRelations extends SlittingSchedule {
  createdByUser: Pick<User, "id" | "displayName" | "email">;
  jobs: SlittingJobWithRelations[];
  totalJobs: number;
  pendingJobs: number;
  readyJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  approvedJobs: number;
}

export interface SlittingScheduleWithStats extends SlittingSchedule {
  createdByName: string | null;
  totalJobs: number;
  pendingJobs: number;
  readyJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  approvedJobs: number;
}

export interface SlittingHistoryWithActor extends SlittingHistory {
  actor: Pick<User, "id" | "displayName" | "email">;
}

export interface MachinesResponse {
  data: Machine[];
  total: number;
}

export interface SlittingSchedulesResponse {
  data: SlittingScheduleWithStats[];
  total: number;
  limit: number;
  offset: number;
}

export interface SlittingJobsResponse {
  data: SlittingJobWithRelations[];
  total: number;
  limit: number;
  offset: number;
}

export interface SlittingScheduleResult {
  schedule: SlittingScheduleWithRelations;
  history: SlittingHistory;
}

export interface SlittingJobResult {
  job: SlittingJobWithRelations;
  history: SlittingHistory;
}

export interface ApproveJobResult {
  success: boolean;
  jobId: string;
  parentStockId: string;
  totalOutputQty: number;
  totalOutputWeight: number;
  totalLossQty: number;
  totalLossWeight: number;
  outputs: Array<{
    outputId: string;
    stockId: string;
    movementId: string;
    batchNumber: string;
    widthMm: number;
    quantity: number;
    weightKg: number | null;
  }>;
}
