import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  SlittingSchedule,
  SlittingScheduleWithStats,
  SlittingScheduleWithRelations,
  SlittingJob,
  SlittingJobWithRelations,
  SlittingActualOutput,
  SlittingActualOutputWithRelations,
  SlittingPlannedOutput,
  SlittingPlannedOutputWithRelations,
  SlittingJobRoll,
  SlittingJobRollWithRelations,
  SlittingHistory,
  SlittingHistoryWithActor,
  SlittingSchedulesResponse,
  SlittingJobsResponse,
  SlittingScheduleResult,
  SlittingJobResult,
  ApproveJobResult,
  ApproveJobV2Result,
  ScheduleStatus,
  JobStatus,
  JobRollStatus,
  SlittingEntityType,
  SlittingHistoryAction,
  ScheduleSearchInput,
  JobSearchInput,
  CreateScheduleInput,
  UpdateScheduleInput,
  CreateJobInput,
  CreateJobV2Input,
  UpdateJobInput,
  CompleteJobInput,
  WorkerJobSearchInput,
  RegisterRollInput,
  StartRollInput,
  RecordActualOutputInput,
  UpdateActualOutputInput,
  CompleteRollInput,
  CancelRollInput,
  CompleteJobV2Input,
  Machine,
  MachineStatus,
} from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { AuditService } from "../../core/audit/audit.service";
import {
  type DbItem,
  type DbPaperType,
  type DbBrand,
  type DbStock,
  type DbUser,
  mapItem,
  mapPaperType,
  mapBrand,
  mapStock,
  mapUser,
} from "../../common/mappers";
import { handleSupabaseError } from "../../common/utils";

const SCHEDULE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

const JOB_STATUS = {
  PENDING: "pending",
  READY: "ready",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  APPROVED: "approved",
} as const;

const MACHINE_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  MAINTENANCE: "maintenance",
} as const;

const ENTITY_TYPE = {
  SCHEDULE: "schedule",
  JOB: "job",
} as const;

const HISTORY_ACTION = {
  CREATED: "created",
  UPDATED: "updated",
  PUBLISHED: "published",
  READY: "ready",
  STARTED: "started",
  COMPLETED: "completed",
  APPROVED: "approved",
  CANCELLED: "cancelled",
} as const;

const STOCK_STATUS = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  QUARANTINE: "quarantine",
  DISPOSED: "disposed",
} as const;

const STOCK_CONDITION = {
  PARENT: "parent",
  SLITTED: "slitted",
} as const;

interface DbSchedule {
  id: string;
  schedule_number: string;
  scheduled_date: string;
  status: string;
  created_by: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

interface DbScheduleWithStats extends DbSchedule {
  created_by_name: string | null;
  total_jobs: number;
  pending_jobs: number;
  ready_jobs: number;
  in_progress_jobs: number;
  completed_jobs: number;
  approved_jobs: number;
  total_planned_rolls: number;
  total_registered_rolls: number;
  total_completed_rolls: number;
}

interface DbJob {
  id: string;
  schedule_id: string;
  machine_id: string;
  parent_stock_id: string | null;
  item_id: string | null;
  parent_width_mm: number | null;
  planned_roll_count: number;
  operator_id: string | null;
  sequence_number: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

interface DbOutput {
  id: string;
  job_id: string;
  item_id: string;
  width_mm: number;
  quantity: number;
  weight_kg: number | null;
  qr_code: string | null;
  is_loss: boolean;
  notes: string | null;
  created_at: string;
}

interface DbActualOutput extends DbOutput {
  job_roll_id: string | null;
  planned_output_id: string | null;
  length_m: number | null;
  roll_id: string | null;
  recorded_by: string | null;
  recorded_at: string | null;
}

interface DbPlannedOutput {
  id: string;
  job_id: string;
  item_id: string;
  width_mm: number;
  quantity: number;
  sequence_number: number;
  notes: string | null;
  created_at: string;
}

interface DbJobRoll {
  id: string;
  job_id: string;
  stock_id: string;
  sequence_number: number;
  status: string;
  registered_at: string;
  registered_by: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const JOB_ROLL_STATUS = {
  REGISTERED: "registered",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

interface DbHistory {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string;
  previous_status: string | null;
  new_status: string | null;
  changes: Record<string, unknown> | null;
  memo: string | null;
  created_at: string;
}

interface DbMachine {
  id: string;
  name: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface DbJobWithRelations extends DbJob {
  slitting_schedules: DbSchedule;
  machines: DbMachine;
  operator: DbUser | null;
  approved_user: DbUser | null;
  // V1 parent stock - nullable in V2
  stocks:
    | (DbStock & {
        items: DbItem & {
          paper_types: DbPaperType;
          brands: DbBrand | null;
        };
      })
    | null;
  // V2 item relation
  items:
    | (DbItem & {
        paper_types: DbPaperType;
        brands: DbBrand | null;
      })
    | null;
  // Legacy outputs - renamed to slitting_actual_outputs
  slitting_actual_outputs: Array<
    DbActualOutput & {
      items: DbItem & {
        paper_types: DbPaperType;
        brands: DbBrand | null;
      };
      registered_by_user?: DbUser | null;
      slitting_planned_outputs?: DbPlannedOutput | null;
      slitting_job_rolls?: DbJobRoll | null;
    }
  >;
  // V2 planned outputs
  slitting_planned_outputs?: Array<
    DbPlannedOutput & {
      items: DbItem & {
        paper_types: DbPaperType;
        brands: DbBrand | null;
      };
    }
  >;
  // V2 job rolls
  slitting_job_rolls?: Array<
    DbJobRoll & {
      stocks: DbStock & {
        items: DbItem & {
          paper_types: DbPaperType;
          brands: DbBrand | null;
        };
      };
      registered_by_user: DbUser;
      slitting_actual_outputs?: Array<
        DbActualOutput & {
          items: DbItem & {
            paper_types: DbPaperType;
            brands: DbBrand | null;
          };
        }
      >;
    }
  >;
}

@Injectable()
export class SlittingService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  private mapSchedule(db: DbSchedule): SlittingSchedule {
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

  private mapScheduleWithStats(
    db: DbScheduleWithStats,
  ): SlittingScheduleWithStats {
    return {
      ...this.mapSchedule(db),
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

  private mapJob(db: DbJob): SlittingJob {
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

  private mapActualOutput(db: DbActualOutput): SlittingActualOutput {
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

  private mapPlannedOutput(db: DbPlannedOutput): SlittingPlannedOutput {
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

  private mapJobRoll(db: DbJobRoll): SlittingJobRoll {
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

  private mapHistory(db: DbHistory): SlittingHistory {
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

  private mapMachine(db: DbMachine): Machine {
    return {
      id: db.id,
      name: db.name,
      status: db.status as MachineStatus,
      description: db.description,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  private mapJobWithRelations(
    db: DbJobWithRelations,
  ): SlittingJobWithRelations {
    const job = this.mapJob(db);
    const schedule = this.mapSchedule(db.slitting_schedules);
    const machine = this.mapMachine(db.machines);
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
      ...this.mapActualOutput(o),
      item: {
        ...mapItem(o.items),
        paperType: mapPaperType(o.items.paper_types),
        brand: o.items.brands ? mapBrand(o.items.brands) : null,
      },
    }));

    const plannedOutputs: SlittingPlannedOutputWithRelations[] = (
      db.slitting_planned_outputs || []
    ).map((po) => ({
      ...this.mapPlannedOutput(po),
      item: {
        ...mapItem(po.items),
        paperType: mapPaperType(po.items.paper_types),
        brand: po.items.brands ? mapBrand(po.items.brands) : null,
      },
    }));

    const jobRolls: SlittingJobRollWithRelations[] = (
      db.slitting_job_rolls || []
    ).map((jr) => ({
      ...this.mapJobRoll(jr),
      stock: {
        ...mapStock(jr.stocks),
        item: {
          ...mapItem(jr.stocks.items),
          paperType: mapPaperType(jr.stocks.items.paper_types),
          brand: jr.stocks.items.brands
            ? mapBrand(jr.stocks.items.brands)
            : null,
        },
      },
      registeredByUser: mapUser(jr.registered_by_user)!,
      actualOutputs: (jr.slitting_actual_outputs || []).map((ao) => ({
        ...this.mapActualOutput(ao),
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

  async findAllSchedules(
    search: ScheduleSearchInput,
  ): Promise<SlittingSchedulesResponse> {
    const client = this.supabaseService.getServiceClient();

    let query = client
      .from("slitting_schedules_with_stats")
      .select("*", { count: "exact" });

    if (search.status) {
      query = query.eq("status", search.status);
    }
    if (search.statuses && search.statuses.length > 0) {
      query = query.in("status", search.statuses);
    }
    if (search.scheduledDateFrom) {
      query = query.gte("scheduled_date", search.scheduledDateFrom);
    }
    if (search.scheduledDateTo) {
      query = query.lte("scheduled_date", search.scheduledDateTo);
    }
    if (search.createdBy) {
      query = query.eq("created_by", search.createdBy);
    }
    if (search.q) {
      query = query.ilike("schedule_number", `%${search.q}%`);
    }

    const { data, error, count } = await query
      .order("scheduled_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(search.offset, search.offset + search.limit - 1);

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch slitting schedules",
        resource: "SlittingSchedule",
      });
    }

    return {
      data: (data as DbScheduleWithStats[]).map((db) =>
        this.mapScheduleWithStats(db),
      ),
      total: count ?? 0,
      limit: search.limit,
      offset: search.offset,
    };
  }

  async findOneSchedule(id: string): Promise<SlittingScheduleWithRelations> {
    const client = this.supabaseService.getServiceClient();

    const { data: scheduleData, error: scheduleError } = await client
      .from("slitting_schedules")
      .select(
        `
        *,
        created_by_user:users!slitting_schedules_created_by_fkey (id, display_name, email)
      `,
      )
      .eq("id", id)
      .single();

    if (scheduleError || !scheduleData) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    const { data: jobsData, error: jobsError } = await client
      .from("slitting_jobs")
      .select(
        `
        *,
        slitting_schedules (*),
        machines (*),
        operator:users!slitting_jobs_operator_id_fkey (id, display_name, email),
        approved_user:users!slitting_jobs_approved_by_fkey (id, display_name, email),
        stocks!slitting_jobs_parent_stock_id_fkey (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        items!slitting_jobs_item_id_fkey (
          *,
          paper_types (*),
          brands (*)
        ),
        slitting_actual_outputs (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        slitting_planned_outputs (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        slitting_job_rolls (
          *,
          stocks (
            *,
            items (
              *,
              paper_types (*),
              brands (*)
            )
          ),
          registered_by_user:users!slitting_job_rolls_registered_by_fkey (id, display_name, email),
          slitting_actual_outputs (
            *,
            items (
              *,
              paper_types (*),
              brands (*)
            )
          )
        )
      `,
      )
      .eq("schedule_id", id)
      .order("sequence_number", { ascending: true });

    if (jobsError) throw new BadRequestException(jobsError.message);

    const schedule = this.mapSchedule(scheduleData as DbSchedule);
    const createdByUser = mapUser(
      (scheduleData as { created_by_user: DbUser }).created_by_user,
    )!;
    const jobs = (jobsData as DbJobWithRelations[]).map((db) =>
      this.mapJobWithRelations(db),
    );

    const stats = {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter((j) => j.status === JOB_STATUS.PENDING).length,
      readyJobs: jobs.filter((j) => j.status === JOB_STATUS.READY).length,
      inProgressJobs: jobs.filter((j) => j.status === JOB_STATUS.IN_PROGRESS)
        .length,
      completedJobs: jobs.filter((j) => j.status === JOB_STATUS.COMPLETED)
        .length,
      approvedJobs: jobs.filter((j) => j.status === JOB_STATUS.APPROVED).length,
    };

    return {
      ...schedule,
      createdByUser,
      jobs,
      ...stats,
    };
  }

  async createSchedule(
    input: CreateScheduleInput,
    createdBy: string,
  ): Promise<SlittingScheduleResult> {
    const client = this.supabaseService.getServiceClient();

    const { data: scheduleNumber, error: scheduleNumberError } =
      await client.rpc("generate_schedule_number");

    if (scheduleNumberError)
      throw new BadRequestException(scheduleNumberError.message);

    const { data: scheduleData, error: scheduleError } = await client
      .from("slitting_schedules")
      .insert({
        schedule_number: scheduleNumber,
        scheduled_date: input.scheduledDate,
        status: SCHEDULE_STATUS.DRAFT,
        created_by: createdBy,
        memo: input.memo ?? null,
      })
      .select()
      .single();

    if (scheduleError) throw new BadRequestException(scheduleError.message);

    const { data: historyData, error: historyError } = await client
      .from("slitting_history")
      .insert({
        entity_type: ENTITY_TYPE.SCHEDULE,
        entity_id: scheduleData.id,
        action: HISTORY_ACTION.CREATED,
        actor_id: createdBy,
        previous_status: null,
        new_status: SCHEDULE_STATUS.DRAFT,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const schedule = await this.findOneSchedule(scheduleData.id);

    await this.auditService.log({
      action: "schedule_created",
      category: "production",
      targetTable: "slitting_schedules",
      targetId: scheduleData.id,
      metadata: {
        scheduleNumber,
        scheduledDate: input.scheduledDate,
      },
    });

    return {
      schedule,
      history: this.mapHistory(historyData as DbHistory),
    };
  }

  async updateSchedule(
    id: string,
    input: UpdateScheduleInput,
    userId: string,
  ): Promise<SlittingScheduleResult> {
    const client = this.supabaseService.getServiceClient();
    const existingSchedule = await this.findOneSchedule(id);

    if (existingSchedule.status !== SCHEDULE_STATUS.DRAFT) {
      throw new BadRequestException(
        `Cannot update schedule in status: ${existingSchedule.status}`,
      );
    }

    const updateData: Record<string, unknown> = {};
    const changes: Record<string, { before: unknown; after: unknown }> = {};

    if (
      input.scheduledDate !== undefined &&
      input.scheduledDate !== existingSchedule.scheduledDate
    ) {
      updateData.scheduled_date = input.scheduledDate;
      changes.scheduledDate = {
        before: existingSchedule.scheduledDate,
        after: input.scheduledDate,
      };
    }
    if (input.memo !== undefined && input.memo !== existingSchedule.memo) {
      updateData.memo = input.memo;
      changes.memo = { before: existingSchedule.memo, after: input.memo };
    }

    if (Object.keys(updateData).length === 0) {
      return {
        schedule: existingSchedule,
        history: {
          id: "",
          entityType: ENTITY_TYPE.SCHEDULE,
          entityId: id,
          action: HISTORY_ACTION.UPDATED,
          actorId: userId,
          previousStatus: existingSchedule.status,
          newStatus: existingSchedule.status,
          changes: null,
          memo: null,
          createdAt: new Date().toISOString(),
        },
      };
    }

    const { error: updateError } = await client
      .from("slitting_schedules")
      .update(updateData)
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("slitting_history")
      .insert({
        entity_type: ENTITY_TYPE.SCHEDULE,
        entity_id: id,
        action: HISTORY_ACTION.UPDATED,
        actor_id: userId,
        previous_status: existingSchedule.status,
        new_status: existingSchedule.status,
        changes,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const schedule = await this.findOneSchedule(id);

    await this.auditService.log({
      action: "schedule_updated",
      category: "production",
      targetTable: "slitting_schedules",
      targetId: id,
      metadata: { changes },
    });

    return {
      schedule,
      history: this.mapHistory(historyData as DbHistory),
    };
  }

  async publishSchedule(
    id: string,
    userId: string,
    memo?: string,
  ): Promise<SlittingScheduleResult> {
    const client = this.supabaseService.getServiceClient();
    const existingSchedule = await this.findOneSchedule(id);

    if (existingSchedule.status !== SCHEDULE_STATUS.DRAFT) {
      throw new BadRequestException(
        `Cannot publish schedule in status: ${existingSchedule.status}`,
      );
    }

    if (existingSchedule.totalJobs === 0) {
      throw new BadRequestException("Cannot publish schedule with no jobs");
    }

    const { error: updateError } = await client
      .from("slitting_schedules")
      .update({ status: SCHEDULE_STATUS.PUBLISHED })
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("slitting_history")
      .insert({
        entity_type: ENTITY_TYPE.SCHEDULE,
        entity_id: id,
        action: HISTORY_ACTION.PUBLISHED,
        actor_id: userId,
        previous_status: SCHEDULE_STATUS.DRAFT,
        new_status: SCHEDULE_STATUS.PUBLISHED,
        memo: memo ?? null,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const schedule = await this.findOneSchedule(id);

    await this.auditService.log({
      action: "schedule_published",
      category: "production",
      targetTable: "slitting_schedules",
      targetId: id,
      metadata: { totalJobs: existingSchedule.totalJobs },
    });

    return {
      schedule,
      history: this.mapHistory(historyData as DbHistory),
    };
  }

  async findAllJobs(search: JobSearchInput): Promise<SlittingJobsResponse> {
    const client = this.supabaseService.getServiceClient();

    let query = client.from("slitting_jobs").select(
      `
        *,
        slitting_schedules (*),
        machines (*),
        operator:users!slitting_jobs_operator_id_fkey (id, display_name, email),
        approved_user:users!slitting_jobs_approved_by_fkey (id, display_name, email),
        stocks!slitting_jobs_parent_stock_id_fkey (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        items!slitting_jobs_item_id_fkey (
          *,
          paper_types (*),
          brands (*)
        ),
        slitting_actual_outputs (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        slitting_planned_outputs (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        slitting_job_rolls (
          *,
          stocks (
            *,
            items (
              *,
              paper_types (*),
              brands (*)
            )
          ),
          registered_by_user:users!slitting_job_rolls_registered_by_fkey (id, display_name, email),
          slitting_actual_outputs (
            *,
            items (
              *,
              paper_types (*),
              brands (*)
            )
          )
        )
      `,
      { count: "exact" },
    );

    if (search.scheduleId) {
      query = query.eq("schedule_id", search.scheduleId);
    }
    if (search.machineId) {
      query = query.eq("machine_id", search.machineId);
    }
    if (search.operatorId) {
      query = query.eq("operator_id", search.operatorId);
    }
    if (search.status) {
      query = query.eq("status", search.status);
    }
    if (search.statuses && search.statuses.length > 0) {
      query = query.in("status", search.statuses);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(search.offset, search.offset + search.limit - 1);

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch slitting jobs",
        resource: "SlittingJob",
      });
    }

    return {
      data: (data as DbJobWithRelations[]).map((db) =>
        this.mapJobWithRelations(db),
      ),
      total: count ?? 0,
      limit: search.limit,
      offset: search.offset,
    };
  }

  async findOneJob(id: string): Promise<SlittingJobWithRelations> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("slitting_jobs")
      .select(
        `
        *,
        slitting_schedules (*),
        machines (*),
        operator:users!slitting_jobs_operator_id_fkey (id, display_name, email),
        approved_user:users!slitting_jobs_approved_by_fkey (id, display_name, email),
        stocks!slitting_jobs_parent_stock_id_fkey (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        items!slitting_jobs_item_id_fkey (
          *,
          paper_types (*),
          brands (*)
        ),
        slitting_actual_outputs (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        slitting_planned_outputs (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        slitting_job_rolls (
          *,
          stocks (
            *,
            items (
              *,
              paper_types (*),
              brands (*)
            )
          ),
          registered_by_user:users!slitting_job_rolls_registered_by_fkey (id, display_name, email),
          slitting_actual_outputs (
            *,
            items (
              *,
              paper_types (*),
              brands (*)
            )
          )
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return this.mapJobWithRelations(data as DbJobWithRelations);
  }

  async createJob(
    input: CreateJobInput,
    userId: string,
  ): Promise<SlittingJobResult> {
    const client = this.supabaseService.getServiceClient();

    const schedule = await this.findOneSchedule(input.scheduleId);
    if (schedule.status !== SCHEDULE_STATUS.DRAFT) {
      throw new BadRequestException(
        `Cannot add jobs to schedule in status: ${schedule.status}`,
      );
    }

    const { data: machineData, error: machineError } = await client
      .from("machines")
      .select("id")
      .eq("id", input.machineId)
      .single();

    if (machineError || !machineData) {
      throw new BadRequestException(`Invalid machine: ${input.machineId}`);
    }

    const { data: stockData, error: stockError } = await client
      .from("stocks")
      .select("id, status, condition")
      .eq("id", input.parentStockId)
      .eq("is_active", true)
      .single();

    if (stockError || !stockData) {
      throw new BadRequestException(
        `Invalid or inactive stock: ${input.parentStockId}`,
      );
    }

    if (stockData.status !== STOCK_STATUS.AVAILABLE) {
      throw new BadRequestException(
        `Stock ${input.parentStockId} is not available`,
      );
    }

    if (stockData.condition !== STOCK_CONDITION.PARENT) {
      throw new BadRequestException(
        `Stock ${input.parentStockId} is not a parent roll`,
      );
    }

    let sequenceNumber = input.sequenceNumber;
    if (!sequenceNumber) {
      const { data: maxSeq } = await client
        .from("slitting_jobs")
        .select("sequence_number")
        .eq("schedule_id", input.scheduleId)
        .order("sequence_number", { ascending: false })
        .limit(1);

      sequenceNumber = (maxSeq?.[0]?.sequence_number ?? 0) + 1;
    }

    const { data: jobData, error: jobError } = await client
      .from("slitting_jobs")
      .insert({
        schedule_id: input.scheduleId,
        machine_id: input.machineId,
        parent_stock_id: input.parentStockId,
        operator_id: input.operatorId ?? null,
        sequence_number: sequenceNumber,
        status: JOB_STATUS.PENDING,
        memo: input.memo ?? null,
      })
      .select()
      .single();

    if (jobError) throw new BadRequestException(jobError.message);

    const { data: historyData, error: historyError } = await client
      .from("slitting_history")
      .insert({
        entity_type: ENTITY_TYPE.JOB,
        entity_id: jobData.id,
        action: HISTORY_ACTION.CREATED,
        actor_id: userId,
        previous_status: null,
        new_status: JOB_STATUS.PENDING,
        changes: { scheduleId: input.scheduleId, machineId: input.machineId },
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const job = await this.findOneJob(jobData.id);

    await this.auditService.log({
      action: "job_created",
      category: "production",
      targetTable: "slitting_jobs",
      targetId: jobData.id,
      metadata: {
        scheduleId: input.scheduleId,
        machineId: input.machineId,
        parentStockId: input.parentStockId,
      },
    });

    return {
      job,
      history: this.mapHistory(historyData as DbHistory),
    };
  }

  async createJobV2(
    input: CreateJobV2Input,
    userId: string,
  ): Promise<SlittingJobResult> {
    const client = this.supabaseService.getServiceClient();

    const schedule = await this.findOneSchedule(input.scheduleId);
    if (schedule.status !== SCHEDULE_STATUS.DRAFT) {
      throw new BadRequestException(
        `Cannot add jobs to schedule in status: ${schedule.status}`,
      );
    }

    const { data: machineData, error: machineError } = await client
      .from("machines")
      .select("id")
      .eq("id", input.machineId)
      .single();

    if (machineError || !machineData) {
      throw new BadRequestException(`Invalid machine: ${input.machineId}`);
    }

    const { data: itemData, error: itemError } = await client
      .from("items")
      .select("id")
      .eq("id", input.itemId)
      .eq("is_active", true)
      .single();

    if (itemError || !itemData) {
      throw new BadRequestException(
        `Invalid or inactive item: ${input.itemId}`,
      );
    }

    for (const po of input.plannedOutputs) {
      const { data: outputItemData, error: outputItemError } = await client
        .from("items")
        .select("id")
        .eq("id", po.itemId)
        .eq("is_active", true)
        .single();

      if (outputItemError || !outputItemData) {
        throw new BadRequestException(
          `Invalid or inactive output item: ${po.itemId}`,
        );
      }
    }

    const totalPlannedWidth = input.plannedOutputs.reduce(
      (sum, po) => sum + po.widthMm * po.quantity,
      0,
    );
    if (totalPlannedWidth > input.parentWidthMm) {
      throw new BadRequestException(
        `Total planned width (${totalPlannedWidth}mm) exceeds parent width (${input.parentWidthMm}mm)`,
      );
    }

    let sequenceNumber = input.sequenceNumber;
    if (!sequenceNumber) {
      const { data: maxSeq } = await client
        .from("slitting_jobs")
        .select("sequence_number")
        .eq("schedule_id", input.scheduleId)
        .order("sequence_number", { ascending: false })
        .limit(1);

      sequenceNumber = (maxSeq?.[0]?.sequence_number ?? 0) + 1;
    }

    const { data: jobData, error: jobError } = await client
      .from("slitting_jobs")
      .insert({
        schedule_id: input.scheduleId,
        machine_id: input.machineId,
        item_id: input.itemId,
        parent_width_mm: input.parentWidthMm,
        planned_roll_count: input.plannedRollCount,
        parent_stock_id: null,
        operator_id: input.operatorId ?? null,
        sequence_number: sequenceNumber,
        status: JOB_STATUS.PENDING,
        memo: input.memo ?? null,
      })
      .select()
      .single();

    if (jobError) throw new BadRequestException(jobError.message);

    const plannedOutputsToInsert = input.plannedOutputs.map((po, index) => ({
      job_id: jobData.id,
      item_id: po.itemId,
      width_mm: po.widthMm,
      quantity: po.quantity,
      sequence_number: index + 1,
      notes: po.notes ?? null,
    }));

    const { error: plannedOutputsError } = await client
      .from("slitting_planned_outputs")
      .insert(plannedOutputsToInsert);

    if (plannedOutputsError) {
      await client.from("slitting_jobs").delete().eq("id", jobData.id);
      throw new BadRequestException(plannedOutputsError.message);
    }

    const { data: historyData, error: historyError } = await client
      .from("slitting_history")
      .insert({
        entity_type: ENTITY_TYPE.JOB,
        entity_id: jobData.id,
        action: HISTORY_ACTION.CREATED,
        actor_id: userId,
        previous_status: null,
        new_status: JOB_STATUS.PENDING,
        changes: {
          version: "v2",
          scheduleId: input.scheduleId,
          machineId: input.machineId,
          itemId: input.itemId,
          plannedRollCount: input.plannedRollCount,
          plannedOutputCount: input.plannedOutputs.length,
        },
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const job = await this.findOneJob(jobData.id);

    await this.auditService.log({
      action: "job_created_v2",
      category: "production",
      targetTable: "slitting_jobs",
      targetId: jobData.id,
      metadata: {
        scheduleId: input.scheduleId,
        machineId: input.machineId,
        itemId: input.itemId,
        plannedRollCount: input.plannedRollCount,
        plannedOutputCount: input.plannedOutputs.length,
      },
    });

    return {
      job,
      history: this.mapHistory(historyData as DbHistory),
    };
  }

  async markJobReady(
    id: string,
    userId: string,
    memo?: string,
  ): Promise<SlittingJobResult> {
    const client = this.supabaseService.getServiceClient();
    const existingJob = await this.findOneJob(id);

    if (existingJob.status !== JOB_STATUS.PENDING) {
      throw new BadRequestException(
        `Cannot mark job ready in status: ${existingJob.status}`,
      );
    }

    if (
      !(
        [SCHEDULE_STATUS.PUBLISHED, SCHEDULE_STATUS.IN_PROGRESS] as string[]
      ).includes(existingJob.schedule.status)
    ) {
      throw new BadRequestException(
        `Schedule must be published to mark jobs ready`,
      );
    }

    const { error: updateError } = await client
      .from("slitting_jobs")
      .update({ status: JOB_STATUS.READY })
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("slitting_history")
      .insert({
        entity_type: ENTITY_TYPE.JOB,
        entity_id: id,
        action: HISTORY_ACTION.READY,
        actor_id: userId,
        previous_status: JOB_STATUS.PENDING,
        new_status: JOB_STATUS.READY,
        memo: memo ?? null,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const job = await this.findOneJob(id);

    await this.auditService.log({
      action: "job_ready",
      category: "production",
      targetTable: "slitting_jobs",
      targetId: id,
    });

    return {
      job,
      history: this.mapHistory(historyData as DbHistory),
    };
  }

  async startJob(
    id: string,
    userId: string,
    operatorId?: string,
    memo?: string,
  ): Promise<SlittingJobResult> {
    const client = this.supabaseService.getServiceClient();
    const existingJob = await this.findOneJob(id);

    if (existingJob.status !== JOB_STATUS.READY) {
      throw new BadRequestException(
        `Cannot start job in status: ${existingJob.status}`,
      );
    }

    const finalOperatorId = operatorId ?? existingJob.operatorId ?? userId;

    const { error: jobError } = await client
      .from("slitting_jobs")
      .update({
        status: JOB_STATUS.IN_PROGRESS,
        operator_id: finalOperatorId,
        started_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (jobError) throw new BadRequestException(jobError.message);

    const { error: machineError } = await client
      .from("machines")
      .update({ status: MACHINE_STATUS.RUNNING })
      .eq("id", existingJob.machineId);

    if (machineError) throw new BadRequestException(machineError.message);

    if (existingJob.schedule.status === SCHEDULE_STATUS.PUBLISHED) {
      await client
        .from("slitting_schedules")
        .update({ status: SCHEDULE_STATUS.IN_PROGRESS })
        .eq("id", existingJob.scheduleId);
    }

    const { data: historyData, error: historyError } = await client
      .from("slitting_history")
      .insert({
        entity_type: ENTITY_TYPE.JOB,
        entity_id: id,
        action: HISTORY_ACTION.STARTED,
        actor_id: userId,
        previous_status: JOB_STATUS.READY,
        new_status: JOB_STATUS.IN_PROGRESS,
        changes: { operatorId: finalOperatorId },
        memo: memo ?? null,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const job = await this.findOneJob(id);

    await this.auditService.log({
      action: "job_started",
      category: "production",
      targetTable: "slitting_jobs",
      targetId: id,
      metadata: {
        operatorId: finalOperatorId,
        machineId: existingJob.machineId,
      },
    });

    return {
      job,
      history: this.mapHistory(historyData as DbHistory),
    };
  }

  async completeJob(
    id: string,
    input: CompleteJobInput,
    userId: string,
  ): Promise<SlittingJobResult> {
    const client = this.supabaseService.getServiceClient();
    const existingJob = await this.findOneJob(id);

    if (existingJob.status !== JOB_STATUS.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot complete job in status: ${existingJob.status}`,
      );
    }

    for (const output of input.outputs) {
      const { data: itemData, error: itemError } = await client
        .from("items")
        .select("id")
        .eq("id", output.itemId)
        .eq("is_active", true)
        .single();

      if (itemError || !itemData) {
        throw new BadRequestException(
          `Invalid or inactive item: ${output.itemId}`,
        );
      }
    }

    const outputsToInsert = input.outputs.map((o) => ({
      job_id: id,
      item_id: o.itemId,
      width_mm: o.widthMm,
      quantity: o.quantity,
      weight_kg: o.weightKg ?? null,
      is_loss: o.isLoss,
      notes: o.notes ?? null,
    }));

    const { error: outputsError } = await client
      .from("slitting_actual_outputs")
      .insert(outputsToInsert);

    if (outputsError) throw new BadRequestException(outputsError.message);

    const { error: jobError } = await client
      .from("slitting_jobs")
      .update({
        status: JOB_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (jobError) throw new BadRequestException(jobError.message);

    const { error: machineError } = await client
      .from("machines")
      .update({ status: MACHINE_STATUS.IDLE })
      .eq("id", existingJob.machineId);

    if (machineError) throw new BadRequestException(machineError.message);

    const { data: historyData, error: historyError } = await client
      .from("slitting_history")
      .insert({
        entity_type: ENTITY_TYPE.JOB,
        entity_id: id,
        action: HISTORY_ACTION.COMPLETED,
        actor_id: userId,
        previous_status: JOB_STATUS.IN_PROGRESS,
        new_status: JOB_STATUS.COMPLETED,
        changes: { outputCount: input.outputs.length },
        memo: input.memo ?? null,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const job = await this.findOneJob(id);

    await this.auditService.log({
      action: "job_completed",
      category: "production",
      targetTable: "slitting_jobs",
      targetId: id,
      metadata: { outputCount: input.outputs.length },
    });

    return {
      job,
      history: this.mapHistory(historyData as DbHistory),
    };
  }

  async approveJob(
    id: string,
    userId: string,
    memo?: string,
  ): Promise<{
    job: SlittingJobWithRelations;
    result: ApproveJobResult | ApproveJobV2Result;
  }> {
    const client = this.supabaseService.getServiceClient();
    const existingJob = await this.findOneJob(id);

    if (existingJob.status !== JOB_STATUS.COMPLETED) {
      throw new BadRequestException(
        `Cannot approve job in status: ${existingJob.status}`,
      );
    }

    const isV2Job =
      existingJob.itemId !== null && (existingJob.jobRolls?.length ?? 0) > 0;

    if (isV2Job) {
      const { data: rpcResult, error: rpcError } = await client.rpc(
        "approve_slitting_job_v2",
        {
          p_job_id: id,
          p_approved_by: userId,
        },
      );

      if (rpcError) throw new BadRequestException(rpcError.message);

      const job = await this.findOneJob(id);

      await this.auditService.log({
        action: "job_approved_v2",
        category: "production",
        targetTable: "slitting_jobs",
        targetId: id,
        metadata: {
          version: "v2",
          processedRolls: rpcResult.processedRolls,
          totalOutputQty: rpcResult.totalOutputQty,
          totalLossQty: rpcResult.totalLossQty,
          lossPercentage: rpcResult.lossPercentage,
        },
      });

      return {
        job,
        result: rpcResult as ApproveJobV2Result,
      };
    }

    const { data: rpcResult, error: rpcError } = await client.rpc(
      "approve_slitting_job",
      {
        p_job_id: id,
        p_approved_by: userId,
      },
    );

    if (rpcError) throw new BadRequestException(rpcError.message);

    const job = await this.findOneJob(id);

    await this.auditService.log({
      action: "job_approved",
      category: "production",
      targetTable: "slitting_jobs",
      targetId: id,
      metadata: {
        parentStockId: rpcResult.parentStockId,
        totalOutputQty: rpcResult.totalOutputQty,
        totalLossQty: rpcResult.totalLossQty,
      },
    });

    return {
      job,
      result: rpcResult as ApproveJobResult,
    };
  }

  async findWorkerJobs(
    search: WorkerJobSearchInput,
  ): Promise<SlittingJobsResponse> {
    const client = this.supabaseService.getServiceClient();

    const scheduledDate =
      search.scheduledDate ?? new Date().toISOString().split("T")[0];

    let query = client.from("slitting_jobs").select(
      `
        *,
        slitting_schedules!inner (*),
        machines (*),
        operator:users!slitting_jobs_operator_id_fkey (id, display_name, email),
        approved_user:users!slitting_jobs_approved_by_fkey (id, display_name, email),
        stocks!slitting_jobs_parent_stock_id_fkey (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        items!slitting_jobs_item_id_fkey (
          *,
          paper_types (*),
          brands (*)
        ),
        slitting_actual_outputs (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        slitting_planned_outputs (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        slitting_job_rolls (
          *,
          stocks (
            *,
            items (
              *,
              paper_types (*),
              brands (*)
            )
          ),
          registered_by_user:users!slitting_job_rolls_registered_by_fkey (id, display_name, email),
          slitting_actual_outputs (
            *,
            items (
              *,
              paper_types (*),
              brands (*)
            )
          )
        )
      `,
      { count: "exact" },
    );

    query = query.eq("slitting_schedules.scheduled_date", scheduledDate);

    if (search.machineId) {
      query = query.eq("machine_id", search.machineId);
    }
    if (search.status) {
      query = query.eq("status", search.status);
    }
    if (search.statuses && search.statuses.length > 0) {
      query = query.in("status", search.statuses);
    }

    const { data, error, count } = await query
      .order("sequence_number", { ascending: true })
      .range(search.offset, search.offset + search.limit - 1);

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch worker jobs",
        resource: "SlittingJob",
      });
    }

    return {
      data: (data as DbJobWithRelations[]).map((db) =>
        this.mapJobWithRelations(db),
      ),
      total: count ?? 0,
      limit: search.limit,
      offset: search.offset,
    };
  }

  async registerJobRoll(
    jobId: string,
    input: RegisterRollInput,
    userId: string,
  ): Promise<SlittingJobRollWithRelations> {
    const client = this.supabaseService.getServiceClient();

    const existingJob = await this.findOneJob(jobId);

    if (
      !([JOB_STATUS.READY, JOB_STATUS.IN_PROGRESS] as string[]).includes(
        existingJob.status,
      )
    ) {
      throw new BadRequestException(
        `Cannot register roll for job in status: ${existingJob.status}`,
      );
    }

    if (existingJob.itemId === null) {
      throw new BadRequestException(
        "Cannot register rolls for V1 jobs. Use V2 jobs with itemId.",
      );
    }

    const registeredCount = existingJob.jobRolls?.length ?? 0;
    if (registeredCount >= existingJob.plannedRollCount) {
      throw new BadRequestException(
        `Job already has ${registeredCount}/${existingJob.plannedRollCount} rolls registered`,
      );
    }

    const { data: stockData, error: stockError } = await client
      .from("stocks")
      .select("id, item_id, width_mm, status, condition")
      .eq("id", input.stockId)
      .eq("is_active", true)
      .single();

    if (stockError || !stockData) {
      throw new BadRequestException(
        `Invalid or inactive stock: ${input.stockId}`,
      );
    }

    if (stockData.status !== STOCK_STATUS.AVAILABLE) {
      throw new BadRequestException(
        `Stock ${input.stockId} is not available (current: ${stockData.status})`,
      );
    }

    if (stockData.condition !== STOCK_CONDITION.PARENT) {
      throw new BadRequestException(
        `Stock ${input.stockId} is not a parent roll`,
      );
    }

    if (stockData.item_id !== existingJob.itemId) {
      throw new BadRequestException(
        `Stock item does not match job item. Expected item ${existingJob.itemId}, got ${stockData.item_id}`,
      );
    }

    if (
      existingJob.parentWidthMm !== null &&
      stockData.width_mm !== existingJob.parentWidthMm
    ) {
      throw new BadRequestException(
        `Stock width (${stockData.width_mm}mm) does not match job parent width (${existingJob.parentWidthMm}mm)`,
      );
    }

    const existingRoll = existingJob.jobRolls?.find(
      (r) => r.stockId === input.stockId,
    );
    if (existingRoll) {
      throw new BadRequestException(
        `Stock ${input.stockId} is already registered for this job`,
      );
    }

    const nextSequence = registeredCount + 1;

    const { data: rollData, error: rollError } = await client
      .from("slitting_job_rolls")
      .insert({
        job_id: jobId,
        stock_id: input.stockId,
        sequence_number: nextSequence,
        status: JOB_ROLL_STATUS.REGISTERED,
        registered_by: userId,
        notes: input.notes ?? null,
      })
      .select(
        `
        *,
        stocks (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        registered_by_user:users!slitting_job_rolls_registered_by_fkey (id, display_name, email)
      `,
      )
      .single();

    if (rollError) throw new BadRequestException(rollError.message);

    const { error: stockUpdateError } = await client
      .from("stocks")
      .update({ status: STOCK_STATUS.RESERVED })
      .eq("id", input.stockId);

    if (stockUpdateError)
      throw new BadRequestException(stockUpdateError.message);

    await this.auditService.log({
      action: "job_roll_registered",
      category: "production",
      targetTable: "slitting_job_rolls",
      targetId: rollData.id,
      metadata: {
        jobId,
        stockId: input.stockId,
        sequenceNumber: nextSequence,
      },
    });

    const dbRoll = rollData as DbJobRoll & {
      stocks: DbStock & {
        items: DbItem & { paper_types: DbPaperType; brands: DbBrand | null };
      };
      registered_by_user: DbUser;
    };

    return {
      ...this.mapJobRoll(dbRoll),
      stock: {
        ...mapStock(dbRoll.stocks),
        item: {
          ...mapItem(dbRoll.stocks.items),
          paperType: mapPaperType(dbRoll.stocks.items.paper_types),
          brand: dbRoll.stocks.items.brands
            ? mapBrand(dbRoll.stocks.items.brands)
            : null,
        },
      },
      registeredByUser: mapUser(dbRoll.registered_by_user)!,
    };
  }

  async startJobRoll(
    jobId: string,
    rollId: string,
    input: StartRollInput,
    userId: string,
  ): Promise<SlittingJobRollWithRelations> {
    const client = this.supabaseService.getServiceClient();

    const existingJob = await this.findOneJob(jobId);

    if (
      !([JOB_STATUS.READY, JOB_STATUS.IN_PROGRESS] as string[]).includes(
        existingJob.status,
      )
    ) {
      throw new BadRequestException(
        `Cannot start roll for job in status: ${existingJob.status}`,
      );
    }

    const existingRoll = existingJob.jobRolls?.find((r) => r.id === rollId);
    if (!existingRoll) {
      throw new NotFoundException(`Roll ${rollId} not found in job ${jobId}`);
    }

    if (existingRoll.status !== JOB_ROLL_STATUS.REGISTERED) {
      throw new BadRequestException(
        `Cannot start roll in status: ${existingRoll.status}`,
      );
    }

    const inProgressRoll = existingJob.jobRolls?.find(
      (r) => r.status === JOB_ROLL_STATUS.IN_PROGRESS,
    );
    if (inProgressRoll) {
      throw new BadRequestException(
        `Another roll (sequence ${inProgressRoll.sequenceNumber}) is already in progress`,
      );
    }

    const { data: rollData, error: rollError } = await client
      .from("slitting_job_rolls")
      .update({
        status: JOB_ROLL_STATUS.IN_PROGRESS,
        started_at: new Date().toISOString(),
        notes: input.notes ?? existingRoll.notes,
      })
      .eq("id", rollId)
      .select(
        `
        *,
        stocks (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        registered_by_user:users!slitting_job_rolls_registered_by_fkey (id, display_name, email)
      `,
      )
      .single();

    if (rollError) throw new BadRequestException(rollError.message);

    if (existingJob.status === JOB_STATUS.READY) {
      await client
        .from("slitting_jobs")
        .update({
          status: JOB_STATUS.IN_PROGRESS,
          started_at: new Date().toISOString(),
          operator_id: existingJob.operatorId ?? userId,
        })
        .eq("id", jobId);

      await client
        .from("machines")
        .update({ status: MACHINE_STATUS.RUNNING })
        .eq("id", existingJob.machineId);

      if (existingJob.schedule.status === SCHEDULE_STATUS.PUBLISHED) {
        await client
          .from("slitting_schedules")
          .update({ status: SCHEDULE_STATUS.IN_PROGRESS })
          .eq("id", existingJob.scheduleId);
      }

      await client.from("slitting_history").insert({
        entity_type: ENTITY_TYPE.JOB,
        entity_id: jobId,
        action: HISTORY_ACTION.STARTED,
        actor_id: userId,
        previous_status: JOB_STATUS.READY,
        new_status: JOB_STATUS.IN_PROGRESS,
        changes: { triggeredByRoll: rollId },
      });
    }

    await this.auditService.log({
      action: "job_roll_started",
      category: "production",
      targetTable: "slitting_job_rolls",
      targetId: rollId,
      metadata: { jobId, sequenceNumber: existingRoll.sequenceNumber },
    });

    const dbRoll = rollData as DbJobRoll & {
      stocks: DbStock & {
        items: DbItem & { paper_types: DbPaperType; brands: DbBrand | null };
      };
      registered_by_user: DbUser;
    };

    return {
      ...this.mapJobRoll(dbRoll),
      stock: {
        ...mapStock(dbRoll.stocks),
        item: {
          ...mapItem(dbRoll.stocks.items),
          paperType: mapPaperType(dbRoll.stocks.items.paper_types),
          brand: dbRoll.stocks.items.brands
            ? mapBrand(dbRoll.stocks.items.brands)
            : null,
        },
      },
      registeredByUser: mapUser(dbRoll.registered_by_user)!,
    };
  }

  async recordActualOutput(
    jobId: string,
    rollId: string,
    input: RecordActualOutputInput,
    userId: string,
  ): Promise<SlittingActualOutputWithRelations> {
    const client = this.supabaseService.getServiceClient();

    const existingJob = await this.findOneJob(jobId);

    if (existingJob.status !== JOB_STATUS.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot record output for job in status: ${existingJob.status}`,
      );
    }

    const existingRoll = existingJob.jobRolls?.find((r) => r.id === rollId);
    if (!existingRoll) {
      throw new NotFoundException(`Roll ${rollId} not found in job ${jobId}`);
    }

    if (existingRoll.status !== JOB_ROLL_STATUS.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot record output for roll in status: ${existingRoll.status}`,
      );
    }

    const { data: itemData, error: itemError } = await client
      .from("items")
      .select("id")
      .eq("id", input.itemId)
      .eq("is_active", true)
      .single();

    if (itemError || !itemData) {
      throw new BadRequestException(
        `Invalid or inactive item: ${input.itemId}`,
      );
    }

    if (input.plannedOutputId) {
      const plannedOutput = existingJob.plannedOutputs?.find(
        (po) => po.id === input.plannedOutputId,
      );
      if (!plannedOutput) {
        throw new BadRequestException(
          `Planned output ${input.plannedOutputId} not found in job`,
        );
      }
    }

    const { data: outputData, error: outputError } = await client
      .from("slitting_actual_outputs")
      .insert({
        job_id: jobId,
        job_roll_id: rollId,
        planned_output_id: input.plannedOutputId ?? null,
        item_id: input.itemId,
        width_mm: input.widthMm,
        quantity: input.quantity,
        length_m: input.lengthM ?? null,
        weight_kg: input.weightKg ?? null,
        is_loss: input.isLoss,
        notes: input.notes ?? null,
        recorded_by: userId,
        recorded_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        items (
          *,
          paper_types (*),
          brands (*)
        )
      `,
      )
      .single();

    if (outputError) throw new BadRequestException(outputError.message);

    await this.auditService.log({
      action: "actual_output_recorded",
      category: "production",
      targetTable: "slitting_actual_outputs",
      targetId: outputData.id,
      metadata: {
        jobId,
        rollId,
        widthMm: input.widthMm,
        quantity: input.quantity,
        isLoss: input.isLoss,
      },
    });

    const dbOutput = outputData as DbActualOutput & {
      items: DbItem & { paper_types: DbPaperType; brands: DbBrand | null };
    };

    return {
      ...this.mapActualOutput(dbOutput),
      item: {
        ...mapItem(dbOutput.items),
        paperType: mapPaperType(dbOutput.items.paper_types),
        brand: dbOutput.items.brands ? mapBrand(dbOutput.items.brands) : null,
      },
    };
  }

  async updateActualOutput(
    jobId: string,
    rollId: string,
    outputId: string,
    input: UpdateActualOutputInput,
    userId: string,
  ): Promise<SlittingActualOutputWithRelations> {
    const client = this.supabaseService.getServiceClient();

    const existingJob = await this.findOneJob(jobId);

    if (existingJob.status !== JOB_STATUS.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot update output for job in status: ${existingJob.status}`,
      );
    }

    const existingRoll = existingJob.jobRolls?.find((r) => r.id === rollId);
    if (!existingRoll) {
      throw new NotFoundException(`Roll ${rollId} not found in job ${jobId}`);
    }

    if (existingRoll.status !== JOB_ROLL_STATUS.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot update output for roll in status: ${existingRoll.status}`,
      );
    }

    const { data: existingOutput, error: fetchError } = await client
      .from("slitting_actual_outputs")
      .select("*")
      .eq("id", outputId)
      .eq("job_roll_id", rollId)
      .single();

    if (fetchError || !existingOutput) {
      throw new NotFoundException(
        `Output ${outputId} not found in roll ${rollId}`,
      );
    }

    const updateData: Record<string, unknown> = {};
    if (input.widthMm !== undefined) updateData.width_mm = input.widthMm;
    if (input.quantity !== undefined) updateData.quantity = input.quantity;
    if (input.lengthM !== undefined) updateData.length_m = input.lengthM;
    if (input.weightKg !== undefined) updateData.weight_kg = input.weightKg;
    if (input.notes !== undefined) updateData.notes = input.notes;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException("No fields to update");
    }

    const { data: outputData, error: outputError } = await client
      .from("slitting_actual_outputs")
      .update(updateData)
      .eq("id", outputId)
      .select(
        `
        *,
        items (
          *,
          paper_types (*),
          brands (*)
        )
      `,
      )
      .single();

    if (outputError) throw new BadRequestException(outputError.message);

    await this.auditService.log({
      action: "actual_output_updated",
      category: "production",
      targetTable: "slitting_actual_outputs",
      targetId: outputId,
      metadata: { jobId, rollId, changes: updateData },
    });

    const dbOutput = outputData as DbActualOutput & {
      items: DbItem & { paper_types: DbPaperType; brands: DbBrand | null };
    };

    return {
      ...this.mapActualOutput(dbOutput),
      item: {
        ...mapItem(dbOutput.items),
        paperType: mapPaperType(dbOutput.items.paper_types),
        brand: dbOutput.items.brands ? mapBrand(dbOutput.items.brands) : null,
      },
    };
  }

  async completeJobRoll(
    jobId: string,
    rollId: string,
    input: CompleteRollInput,
    userId: string,
  ): Promise<SlittingJobRollWithRelations> {
    const client = this.supabaseService.getServiceClient();

    const existingJob = await this.findOneJob(jobId);

    if (existingJob.status !== JOB_STATUS.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot complete roll for job in status: ${existingJob.status}`,
      );
    }

    const existingRoll = existingJob.jobRolls?.find((r) => r.id === rollId);
    if (!existingRoll) {
      throw new NotFoundException(`Roll ${rollId} not found in job ${jobId}`);
    }

    if (existingRoll.status !== JOB_ROLL_STATUS.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot complete roll in status: ${existingRoll.status}`,
      );
    }

    const { data: rollData, error: rollError } = await client
      .from("slitting_job_rolls")
      .update({
        status: JOB_ROLL_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
        notes: input.notes ?? existingRoll.notes,
      })
      .eq("id", rollId)
      .select(
        `
        *,
        stocks (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        registered_by_user:users!slitting_job_rolls_registered_by_fkey (id, display_name, email),
        slitting_actual_outputs (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        )
      `,
      )
      .single();

    if (rollError) throw new BadRequestException(rollError.message);

    await this.auditService.log({
      action: "job_roll_completed",
      category: "production",
      targetTable: "slitting_job_rolls",
      targetId: rollId,
      metadata: { jobId, sequenceNumber: existingRoll.sequenceNumber },
    });

    const dbRoll = rollData as DbJobRoll & {
      stocks: DbStock & {
        items: DbItem & { paper_types: DbPaperType; brands: DbBrand | null };
      };
      registered_by_user: DbUser;
      slitting_actual_outputs: Array<
        DbActualOutput & {
          items: DbItem & { paper_types: DbPaperType; brands: DbBrand | null };
        }
      >;
    };

    return {
      ...this.mapJobRoll(dbRoll),
      stock: {
        ...mapStock(dbRoll.stocks),
        item: {
          ...mapItem(dbRoll.stocks.items),
          paperType: mapPaperType(dbRoll.stocks.items.paper_types),
          brand: dbRoll.stocks.items.brands
            ? mapBrand(dbRoll.stocks.items.brands)
            : null,
        },
      },
      registeredByUser: mapUser(dbRoll.registered_by_user)!,
      actualOutputs: (dbRoll.slitting_actual_outputs || []).map((ao) => ({
        ...this.mapActualOutput(ao),
        item: {
          ...mapItem(ao.items),
          paperType: mapPaperType(ao.items.paper_types),
          brand: ao.items.brands ? mapBrand(ao.items.brands) : null,
        },
      })),
    };
  }

  async cancelJobRoll(
    jobId: string,
    rollId: string,
    input: CancelRollInput,
    userId: string,
  ): Promise<SlittingJobRollWithRelations> {
    const client = this.supabaseService.getServiceClient();

    const existingJob = await this.findOneJob(jobId);

    if (
      !([JOB_STATUS.READY, JOB_STATUS.IN_PROGRESS] as string[]).includes(
        existingJob.status,
      )
    ) {
      throw new BadRequestException(
        `Cannot cancel roll for job in status: ${existingJob.status}`,
      );
    }

    const existingRoll = existingJob.jobRolls?.find((r) => r.id === rollId);
    if (!existingRoll) {
      throw new NotFoundException(`Roll ${rollId} not found in job ${jobId}`);
    }

    if (
      !(
        [JOB_ROLL_STATUS.REGISTERED, JOB_ROLL_STATUS.IN_PROGRESS] as string[]
      ).includes(existingRoll.status)
    ) {
      throw new BadRequestException(
        `Cannot cancel roll in status: ${existingRoll.status}`,
      );
    }

    const { data: rollData, error: rollError } = await client
      .from("slitting_job_rolls")
      .update({
        status: JOB_ROLL_STATUS.CANCELLED,
        notes: input.reason,
      })
      .eq("id", rollId)
      .select(
        `
        *,
        stocks (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        ),
        registered_by_user:users!slitting_job_rolls_registered_by_fkey (id, display_name, email)
      `,
      )
      .single();

    if (rollError) throw new BadRequestException(rollError.message);

    const { error: stockUpdateError } = await client
      .from("stocks")
      .update({ status: STOCK_STATUS.AVAILABLE })
      .eq("id", existingRoll.stockId);

    if (stockUpdateError)
      throw new BadRequestException(stockUpdateError.message);

    await this.auditService.log({
      action: "job_roll_cancelled",
      category: "production",
      targetTable: "slitting_job_rolls",
      targetId: rollId,
      metadata: {
        jobId,
        sequenceNumber: existingRoll.sequenceNumber,
        reason: input.reason,
      },
    });

    const dbRoll = rollData as DbJobRoll & {
      stocks: DbStock & {
        items: DbItem & { paper_types: DbPaperType; brands: DbBrand | null };
      };
      registered_by_user: DbUser;
    };

    return {
      ...this.mapJobRoll(dbRoll),
      stock: {
        ...mapStock(dbRoll.stocks),
        item: {
          ...mapItem(dbRoll.stocks.items),
          paperType: mapPaperType(dbRoll.stocks.items.paper_types),
          brand: dbRoll.stocks.items.brands
            ? mapBrand(dbRoll.stocks.items.brands)
            : null,
        },
      },
      registeredByUser: mapUser(dbRoll.registered_by_user)!,
    };
  }

  async completeJobV2(
    jobId: string,
    input: CompleteJobV2Input,
    userId: string,
  ): Promise<SlittingJobResult> {
    const client = this.supabaseService.getServiceClient();

    const existingJob = await this.findOneJob(jobId);

    if (existingJob.status !== JOB_STATUS.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot complete job in status: ${existingJob.status}`,
      );
    }

    if (existingJob.itemId === null) {
      throw new BadRequestException(
        "Use completeJob() for V1 jobs. This method is for V2 jobs only.",
      );
    }

    const completedRolls =
      existingJob.jobRolls?.filter(
        (r) => r.status === JOB_ROLL_STATUS.COMPLETED,
      ) ?? [];
    const inProgressRolls =
      existingJob.jobRolls?.filter(
        (r) => r.status === JOB_ROLL_STATUS.IN_PROGRESS,
      ) ?? [];

    if (inProgressRolls.length > 0) {
      throw new BadRequestException(
        `Cannot complete job: ${inProgressRolls.length} roll(s) still in progress`,
      );
    }

    if (completedRolls.length === 0) {
      throw new BadRequestException(
        "Cannot complete job: No rolls have been completed",
      );
    }

    const { error: jobError } = await client
      .from("slitting_jobs")
      .update({
        status: JOB_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (jobError) throw new BadRequestException(jobError.message);

    const { error: machineError } = await client
      .from("machines")
      .update({ status: MACHINE_STATUS.IDLE })
      .eq("id", existingJob.machineId);

    if (machineError) throw new BadRequestException(machineError.message);

    const { data: historyData, error: historyError } = await client
      .from("slitting_history")
      .insert({
        entity_type: ENTITY_TYPE.JOB,
        entity_id: jobId,
        action: HISTORY_ACTION.COMPLETED,
        actor_id: userId,
        previous_status: JOB_STATUS.IN_PROGRESS,
        new_status: JOB_STATUS.COMPLETED,
        changes: {
          version: "v2",
          completedRollCount: completedRolls.length,
        },
        memo: input.memo ?? null,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const job = await this.findOneJob(jobId);

    await this.auditService.log({
      action: "job_completed_v2",
      category: "production",
      targetTable: "slitting_jobs",
      targetId: jobId,
      metadata: { completedRollCount: completedRolls.length },
    });

    return {
      job,
      history: this.mapHistory(historyData as DbHistory),
    };
  }

  async getHistory(
    entityType: SlittingEntityType,
    entityId: string,
  ): Promise<SlittingHistoryWithActor[]> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("slitting_history")
      .select(
        `
        *,
        actor:users!slitting_history_actor_id_fkey (id, display_name, email)
      `,
      )
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: true });

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch slitting history",
        resource: "SlittingHistory",
      });
    }

    return (data || []).map((h) => ({
      ...this.mapHistory(h as DbHistory),
      actor: mapUser((h as { actor: DbUser }).actor)!,
    }));
  }
}
