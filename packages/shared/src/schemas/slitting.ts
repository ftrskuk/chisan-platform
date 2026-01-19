import { z } from "zod";
import {
  MACHINE_STATUSES,
  SCHEDULE_STATUSES,
  JOB_STATUSES,
  JOB_ROLL_STATUSES,
  SLITTING_ENTITY_TYPES,
  SLITTING_HISTORY_ACTIONS,
} from "../types/slitting";

export const machineStatusSchema = z.enum(MACHINE_STATUSES);
export const scheduleStatusSchema = z.enum(SCHEDULE_STATUSES);
export const jobStatusSchema = z.enum(JOB_STATUSES);
export const jobRollStatusSchema = z.enum(JOB_ROLL_STATUSES);
export const slittingEntityTypeSchema = z.enum(SLITTING_ENTITY_TYPES);
export const slittingHistoryActionSchema = z.enum(SLITTING_HISTORY_ACTIONS);

export const machineSearchSchema = z.object({
  status: machineStatusSchema.optional(),
  q: z.string().optional(),
});

export type MachineSearchInput = z.infer<typeof machineSearchSchema>;

export const updateMachineStatusSchema = z.object({
  status: machineStatusSchema,
});

export type UpdateMachineStatusInput = z.infer<
  typeof updateMachineStatusSchema
>;

export const scheduleSearchSchema = z.object({
  status: scheduleStatusSchema.optional(),
  statuses: z
    .string()
    .transform(
      (val) =>
        val.split(",").filter(Boolean) as Array<
          (typeof SCHEDULE_STATUSES)[number]
        >,
    )
    .optional(),
  scheduledDateFrom: z.string().optional(),
  scheduledDateTo: z.string().optional(),
  createdBy: z.string().uuid().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ScheduleSearchInput = z.infer<typeof scheduleSearchSchema>;

export const jobSearchSchema = z.object({
  scheduleId: z.string().uuid().optional(),
  machineId: z.string().uuid().optional(),
  operatorId: z.string().uuid().optional(),
  status: jobStatusSchema.optional(),
  statuses: z
    .string()
    .transform(
      (val) =>
        val.split(",").filter(Boolean) as Array<(typeof JOB_STATUSES)[number]>,
    )
    .optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type JobSearchInput = z.infer<typeof jobSearchSchema>;

export const createScheduleSchema = z.object({
  scheduledDate: z.string(),
  memo: z.string().max(1000).optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = z.object({
  scheduledDate: z.string().optional(),
  memo: z.string().max(1000).nullable().optional(),
});

export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

export const createJobSchema = z.object({
  scheduleId: z.string().uuid(),
  machineId: z.string().uuid(),
  parentStockId: z.string().uuid(),
  operatorId: z.string().uuid().optional(),
  sequenceNumber: z.coerce.number().int().min(1).optional(),
  memo: z.string().max(1000).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const plannedOutputSchema = z.object({
  itemId: z.string().uuid(),
  widthMm: z.coerce.number().int().min(50).max(2500),
  quantity: z.coerce.number().int().positive(),
  notes: z.string().max(500).optional(),
});

export type PlannedOutputInput = z.infer<typeof plannedOutputSchema>;

export const createJobV2Schema = z.object({
  scheduleId: z.string().uuid(),
  machineId: z.string().uuid(),
  itemId: z.string().uuid(),
  parentWidthMm: z.coerce.number().int().min(50).max(2500),
  plannedRollCount: z.coerce.number().int().min(1).max(100).default(1),
  plannedOutputs: z.array(plannedOutputSchema).min(1).max(50),
  operatorId: z.string().uuid().optional(),
  sequenceNumber: z.coerce.number().int().min(1).optional(),
  memo: z.string().max(1000).optional(),
});

export type CreateJobV2Input = z.infer<typeof createJobV2Schema>;

export const updateJobSchema = z.object({
  machineId: z.string().uuid().optional(),
  operatorId: z.string().uuid().nullable().optional(),
  sequenceNumber: z.coerce.number().int().min(1).optional(),
  memo: z.string().max(1000).nullable().optional(),
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export const updatePlannedOutputsSchema = z.object({
  plannedOutputs: z.array(plannedOutputSchema).min(1).max(50),
});

export type UpdatePlannedOutputsInput = z.infer<
  typeof updatePlannedOutputsSchema
>;

export const markJobReadySchema = z.object({
  memo: z.string().max(1000).optional(),
});

export type MarkJobReadyInput = z.infer<typeof markJobReadySchema>;

export const startJobSchema = z.object({
  operatorId: z.string().uuid().optional(),
  memo: z.string().max(1000).optional(),
});

export type StartJobInput = z.infer<typeof startJobSchema>;

export const slittingOutputSchema = z.object({
  itemId: z.string().uuid(),
  widthMm: z.coerce.number().int().min(50).max(2500),
  quantity: z.coerce.number().int().positive(),
  weightKg: z.coerce.number().positive().optional(),
  isLoss: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export const completeJobSchema = z.object({
  outputs: z.array(slittingOutputSchema).min(1).max(50),
  memo: z.string().max(1000).optional(),
});

export type CompleteJobInput = z.infer<typeof completeJobSchema>;

export const approveJobSchema = z.object({
  memo: z.string().max(1000).optional(),
});

export type ApproveJobInput = z.infer<typeof approveJobSchema>;

export const rejectJobSchema = z.object({
  memo: z.string().min(1).max(1000),
});

export type RejectJobInput = z.infer<typeof rejectJobSchema>;

export const publishScheduleSchema = z.object({
  memo: z.string().max(1000).optional(),
});

export type PublishScheduleInput = z.infer<typeof publishScheduleSchema>;

export const cancelScheduleSchema = z.object({
  memo: z.string().max(1000).optional(),
});

export type CancelScheduleInput = z.infer<typeof cancelScheduleSchema>;

export const registerRollSchema = z.object({
  stockId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export type RegisterRollInput = z.infer<typeof registerRollSchema>;

export const startRollSchema = z.object({
  notes: z.string().max(500).optional(),
});

export type StartRollInput = z.infer<typeof startRollSchema>;

export const recordActualOutputSchema = z.object({
  plannedOutputId: z.string().uuid().optional(),
  itemId: z.string().uuid(),
  widthMm: z.coerce.number().int().min(50).max(2500),
  quantity: z.coerce.number().int().positive(),
  lengthM: z.coerce.number().positive().optional(),
  weightKg: z.coerce.number().positive().optional(),
  isLoss: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export type RecordActualOutputInput = z.infer<typeof recordActualOutputSchema>;

export const updateActualOutputSchema = z.object({
  widthMm: z.coerce.number().int().min(50).max(2500).optional(),
  quantity: z.coerce.number().int().positive().optional(),
  lengthM: z.coerce.number().positive().nullable().optional(),
  weightKg: z.coerce.number().positive().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export type UpdateActualOutputInput = z.infer<typeof updateActualOutputSchema>;

export const completeRollSchema = z.object({
  notes: z.string().max(500).optional(),
});

export type CompleteRollInput = z.infer<typeof completeRollSchema>;

export const cancelRollSchema = z.object({
  reason: z.string().min(1).max(500),
});

export type CancelRollInput = z.infer<typeof cancelRollSchema>;

export const completeJobV2Schema = z.object({
  memo: z.string().max(1000).optional(),
});

export type CompleteJobV2Input = z.infer<typeof completeJobV2Schema>;

export const workerJobSearchSchema = z.object({
  scheduledDate: z.string().optional(),
  machineId: z.string().uuid().optional(),
  status: jobStatusSchema.optional(),
  statuses: z
    .string()
    .transform(
      (val) =>
        val.split(",").filter(Boolean) as Array<(typeof JOB_STATUSES)[number]>,
    )
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type WorkerJobSearchInput = z.infer<typeof workerJobSearchSchema>;

export const jobRollSearchSchema = z.object({
  jobId: z.string().uuid(),
  status: jobRollStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type JobRollSearchInput = z.infer<typeof jobRollSearchSchema>;
