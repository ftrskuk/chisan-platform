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

export const JOB_ROLL_STATUSES = [
  "registered",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type JobRollStatus = (typeof JOB_ROLL_STATUSES)[number];

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
  /** @deprecated V1 field - Use slitting_job_rolls for V2 jobs */
  parentStockId: string | null;
  itemId: string | null;
  parentWidthMm: number | null;
  plannedRollCount: number;
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

export interface SlittingPlannedOutput {
  id: string;
  jobId: string;
  itemId: string;
  widthMm: number;
  quantity: number;
  sequenceNumber: number;
  notes: string | null;
  createdAt: string;
}

export interface SlittingJobRoll {
  id: string;
  jobId: string;
  stockId: string;
  sequenceNumber: number;
  status: JobRollStatus;
  registeredAt: string;
  registeredBy: string;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SlittingActualOutput {
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
  jobRollId: string | null;
  plannedOutputId: string | null;
  lengthM: number | null;
  rollId: string | null;
  recordedBy: string | null;
  recordedAt: string | null;
}

/** @deprecated Use SlittingActualOutput instead */
export type SlittingOutput = SlittingActualOutput;

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

export interface SlittingPlannedOutputWithRelations extends SlittingPlannedOutput {
  item: Item & { paperType: PaperType; brand: Brand | null };
}

export interface SlittingJobRollWithRelations extends SlittingJobRoll {
  stock: Stock & { item: Item & { paperType: PaperType; brand: Brand | null } };
  registeredByUser: Pick<User, "id" | "displayName" | "email">;
  actualOutputs?: SlittingActualOutputWithRelations[];
}

export interface SlittingActualOutputWithRelations extends SlittingActualOutput {
  item: Item & { paperType: PaperType; brand: Brand | null };
  jobRoll?: SlittingJobRoll;
  plannedOutput?: SlittingPlannedOutput;
  recordedByUser?: Pick<User, "id" | "displayName" | "email">;
}

/** @deprecated Use SlittingActualOutputWithRelations instead */
export type SlittingOutputWithRelations = SlittingActualOutputWithRelations;

export interface SlittingJobWithRelations extends SlittingJob {
  schedule: SlittingSchedule;
  machine: Machine;
  /** @deprecated V1 field - null for V2 jobs */
  parentStock:
    | (Stock & { item: Item & { paperType: PaperType; brand: Brand | null } })
    | null;
  item: (Item & { paperType: PaperType; brand: Brand | null }) | null;
  operator: Pick<User, "id" | "displayName" | "email"> | null;
  approvedByUser: Pick<User, "id" | "displayName" | "email"> | null;
  /** @deprecated Use actualOutputs instead */
  outputs: SlittingActualOutputWithRelations[];
  plannedOutputs?: SlittingPlannedOutputWithRelations[];
  jobRolls?: SlittingJobRollWithRelations[];
  actualOutputs?: SlittingActualOutputWithRelations[];
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
  totalPlannedRolls: number;
  totalRegisteredRolls: number;
  totalCompletedRolls: number;
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

export interface ApproveJobV2Result {
  success: boolean;
  version: "v2";
  jobId: string;
  processedRolls: number;
  totalInputWeight: number;
  totalOutputQty: number;
  totalOutputWeight: number;
  totalLossQty: number;
  totalLossWeight: number;
  lossPercentage: number;
  rolls: Array<{
    jobRollId: string;
    stockId: string;
    sequenceNumber: number;
    parentWeightKg: number | null;
    outputs: Array<{
      outputId: string;
      stockId: string;
      movementId: string;
      batchNumber: string;
      widthMm: number;
      quantity: number;
      weightKg: number | null;
    }>;
  }>;
}

export interface SlittingVarianceAnalysis {
  jobId: string;
  scheduleId: string;
  scheduledDate: string;
  plannedOutputId: string;
  itemId: string;
  itemName: string;
  plannedWidthMm: number;
  plannedQuantity: number;
  actualCount: number;
  actualQuantity: number;
  actualWeightKg: number;
  lossQuantity: number;
  lossWeightKg: number;
  quantityVariance: number;
  avgActualWidthMm: number;
  avgWidthVarianceMm: number;
}

export interface SlittingLossAnalysis {
  jobId: string;
  scheduleId: string;
  scheduledDate: string;
  jobRollId: string;
  rollSequence: number;
  stockId: string;
  stockBatchNumber: string | null;
  inputWeightKg: number | null;
  outputWeightKg: number;
  lossWeightKg: number;
  lossPercentage: number;
  outputCount: number;
  lossCount: number;
  completedAt: string | null;
}

export interface SlittingMonthlyLossSummary {
  month: string;
  totalJobs: number;
  totalRolls: number;
  totalInputWeightKg: number;
  totalOutputWeightKg: number;
  totalLossWeightKg: number;
  lossRatePct: number;
}
