import type {
  SlittingSchedule,
  SlittingScheduleWithStats,
  SlittingJob,
  SlittingJobWithRelations,
  SlittingActualOutput,
  SlittingActualOutputWithRelations,
  SlittingPlannedOutput,
  SlittingPlannedOutputWithRelations,
  SlittingJobRoll,
  SlittingJobRollWithRelations,
  SlittingHistory,
  ScheduleStatus,
  JobStatus,
  JobRollStatus,
  SlittingEntityType,
  SlittingHistoryAction,
  Machine,
  MachineStatus,
} from "@repo/shared";
import {
  mapItem,
  mapPaperType,
  mapBrand,
  mapStock,
  mapUser,
} from "../../common/mappers";
import type {
  DbSchedule,
  DbScheduleWithStats,
  DbJob,
  DbActualOutput,
  DbPlannedOutput,
  DbJobRoll,
  DbHistory,
  DbMachine,
  DbJobWithRelations,
} from "./slitting.types";

export function mapSchedule(db: DbSchedule): SlittingSchedule {
  return {
    id: db.id,
    scheduleNumber: db.schedule_number,
    scheduledDate: db.scheduled_date,
    status: db.status as ScheduleStatus,
    createdBy: db.created_by,
    memo: db.memo,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapScheduleWithStats(
  db: DbScheduleWithStats,
): SlittingScheduleWithStats {
  return {
    ...mapSchedule(db),
    createdByName: db.created_by_name,
    totalJobs: db.total_jobs,
    pendingJobs: db.pending_jobs,
    readyJobs: db.ready_jobs,
    inProgressJobs: db.in_progress_jobs,
    completedJobs: db.completed_jobs,
    approvedJobs: db.approved_jobs,
    totalPlannedRolls: db.total_planned_rolls,
    totalRegisteredRolls: db.total_registered_rolls,
    totalCompletedRolls: db.total_completed_rolls,
  };
}

export function mapJob(db: DbJob): SlittingJob {
  return {
    id: db.id,
    scheduleId: db.schedule_id,
    machineId: db.machine_id,
    parentStockId: db.parent_stock_id,
    itemId: db.item_id,
    parentWidthMm: db.parent_width_mm,
    plannedRollCount: db.planned_roll_count,
    operatorId: db.operator_id,
    sequenceNumber: db.sequence_number,
    status: db.status as JobStatus,
    startedAt: db.started_at,
    completedAt: db.completed_at,
    approvedAt: db.approved_at,
    approvedBy: db.approved_by,
    memo: db.memo,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapActualOutput(db: DbActualOutput): SlittingActualOutput {
  return {
    id: db.id,
    jobId: db.job_id,
    itemId: db.item_id,
    widthMm: db.width_mm,
    quantity: db.quantity,
    weightKg: db.weight_kg ? Number(db.weight_kg) : null,
    qrCode: db.qr_code,
    isLoss: db.is_loss,
    notes: db.notes,
    createdAt: db.created_at,
    jobRollId: db.job_roll_id,
    plannedOutputId: db.planned_output_id,
    lengthM: db.length_m ? Number(db.length_m) : null,
    rollId: db.roll_id,
    recordedBy: db.recorded_by,
    recordedAt: db.recorded_at,
  };
}

export function mapPlannedOutput(db: DbPlannedOutput): SlittingPlannedOutput {
  return {
    id: db.id,
    jobId: db.job_id,
    itemId: db.item_id,
    widthMm: db.width_mm,
    quantity: db.quantity,
    sequenceNumber: db.sequence_number,
    notes: db.notes,
    createdAt: db.created_at,
  };
}

export function mapJobRoll(db: DbJobRoll): SlittingJobRoll {
  return {
    id: db.id,
    jobId: db.job_id,
    stockId: db.stock_id,
    sequenceNumber: db.sequence_number,
    status: db.status as JobRollStatus,
    registeredAt: db.registered_at,
    registeredBy: db.registered_by,
    startedAt: db.started_at,
    completedAt: db.completed_at,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapHistory(db: DbHistory): SlittingHistory {
  return {
    id: db.id,
    entityType: db.entity_type as SlittingEntityType,
    entityId: db.entity_id,
    action: db.action as SlittingHistoryAction,
    actorId: db.actor_id,
    previousStatus: db.previous_status,
    newStatus: db.new_status,
    changes: db.changes,
    memo: db.memo,
    createdAt: db.created_at,
  };
}

export function mapMachine(db: DbMachine): Machine {
  return {
    id: db.id,
    name: db.name,
    status: db.status as MachineStatus,
    description: db.description,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapJobWithRelations(
  db: DbJobWithRelations,
): SlittingJobWithRelations {
  const job = mapJob(db);
  const schedule = mapSchedule(db.slitting_schedules);
  const machine = mapMachine(db.machines);
  const operator = mapUser(db.operator);
  const approvedByUser = mapUser(db.approved_user);

  const parentStock = db.stocks
    ? {
        ...mapStock(db.stocks),
        item: {
          ...mapItem(db.stocks.items),
          paperType: mapPaperType(db.stocks.items.paper_types),
          brand: db.stocks.items.brands
            ? mapBrand(db.stocks.items.brands)
            : null,
        },
      }
    : null;

  const item = db.items
    ? {
        ...mapItem(db.items),
        paperType: mapPaperType(db.items.paper_types),
        brand: db.items.brands ? mapBrand(db.items.brands) : null,
      }
    : null;

  const outputs: SlittingActualOutputWithRelations[] = (
    db.slitting_actual_outputs || []
  ).map((o) => ({
    ...mapActualOutput(o),
    item: {
      ...mapItem(o.items),
      paperType: mapPaperType(o.items.paper_types),
      brand: o.items.brands ? mapBrand(o.items.brands) : null,
    },
  }));

  const plannedOutputs: SlittingPlannedOutputWithRelations[] = (
    db.slitting_planned_outputs || []
  ).map((po) => ({
    ...mapPlannedOutput(po),
    item: {
      ...mapItem(po.items),
      paperType: mapPaperType(po.items.paper_types),
      brand: po.items.brands ? mapBrand(po.items.brands) : null,
    },
  }));

  const jobRolls: SlittingJobRollWithRelations[] = (
    db.slitting_job_rolls || []
  ).map((jr) => ({
    ...mapJobRoll(jr),
    stock: {
      ...mapStock(jr.stocks),
      item: {
        ...mapItem(jr.stocks.items),
        paperType: mapPaperType(jr.stocks.items.paper_types),
        brand: jr.stocks.items.brands ? mapBrand(jr.stocks.items.brands) : null,
      },
    },
    registeredByUser: mapUser(jr.registered_by_user)!,
    actualOutputs: (jr.slitting_actual_outputs || []).map((ao) => ({
      ...mapActualOutput(ao),
      item: {
        ...mapItem(ao.items),
        paperType: mapPaperType(ao.items.paper_types),
        brand: ao.items.brands ? mapBrand(ao.items.brands) : null,
      },
    })),
  }));

  return {
    ...job,
    schedule,
    machine,
    parentStock,
    item,
    operator,
    approvedByUser,
    outputs,
    plannedOutputs,
    jobRolls,
    actualOutputs: outputs,
  };
}
