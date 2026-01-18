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
  SlittingOutput,
  SlittingOutputWithRelations,
  SlittingHistory,
  SlittingHistoryWithActor,
  SlittingSchedulesResponse,
  SlittingJobsResponse,
  SlittingScheduleResult,
  SlittingJobResult,
  ApproveJobResult,
  ScheduleStatus,
  JobStatus,
  SlittingEntityType,
  SlittingHistoryAction,
  ScheduleSearchInput,
  JobSearchInput,
  CreateScheduleInput,
  UpdateScheduleInput,
  CreateJobInput,
  UpdateJobInput,
  CompleteJobInput,
  Machine,
  MachineStatus,
  Stock,
  StockCondition,
  StockStatus,
  Item,
  PaperType,
  Brand,
  ItemForm,
} from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { AuditService } from "../../core/audit/audit.service";

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
}

interface DbJob {
  id: string;
  schedule_id: string;
  machine_id: string;
  parent_stock_id: string;
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

interface DbUser {
  id: string;
  display_name: string | null;
  email: string;
}

interface DbItem {
  id: string;
  item_code: string;
  display_name: string;
  paper_type_id: string;
  brand_id: string | null;
  grammage: number;
  form: string;
  core_diameter_inch: number | null;
  length_mm: number | null;
  sheets_per_ream: number | null;
  unit_of_measure: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbPaperType {
  id: string;
  code: string;
  name_en: string;
  name_ko: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface DbBrand {
  id: string;
  partner_id: string;
  code: string;
  name: string;
  internal_code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DbStock {
  id: string;
  item_id: string;
  location_id: string;
  width_mm: number;
  condition: string;
  quantity: number;
  weight_kg: number | null;
  status: string;
  is_active: boolean;
  batch_number: string | null;
  lot_number: string | null;
  received_at: string | null;
  parent_stock_id: string | null;
  source_type: string | null;
  source_reference_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbJobWithRelations extends DbJob {
  slitting_schedules: DbSchedule;
  machines: DbMachine;
  operator: DbUser | null;
  approved_user: DbUser | null;
  stocks: DbStock & {
    items: DbItem & {
      paper_types: DbPaperType;
      brands: DbBrand | null;
    };
  };
  slitting_outputs: Array<
    DbOutput & {
      items: DbItem & {
        paper_types: DbPaperType;
        brands: DbBrand | null;
      };
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
    };
  }

  private mapJob(db: DbJob): SlittingJob {
    return {
      id: db.id,
      scheduleId: db.schedule_id,
      machineId: db.machine_id,
      parentStockId: db.parent_stock_id,
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

  private mapOutput(db: DbOutput): SlittingOutput {
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

  private mapUser(
    db: DbUser | null,
  ): { id: string; displayName: string; email: string } | null {
    if (!db) return null;
    return {
      id: db.id,
      displayName: db.display_name ?? db.email,
      email: db.email,
    };
  }

  private mapItem(db: DbItem): Item {
    return {
      id: db.id,
      itemCode: db.item_code,
      displayName: db.display_name,
      paperTypeId: db.paper_type_id,
      brandId: db.brand_id,
      grammage: db.grammage,
      form: db.form as ItemForm,
      coreDiameterInch: db.core_diameter_inch
        ? Number(db.core_diameter_inch)
        : null,
      lengthMm: db.length_mm,
      sheetsPerReam: db.sheets_per_ream,
      unitOfMeasure: db.unit_of_measure,
      isActive: db.is_active,
      notes: db.notes,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  private mapPaperType(db: DbPaperType): PaperType {
    return {
      id: db.id,
      code: db.code,
      nameEn: db.name_en,
      nameKo: db.name_ko,
      description: db.description,
      sortOrder: db.sort_order,
      isActive: db.is_active,
      createdAt: db.created_at,
    };
  }

  private mapBrand(db: DbBrand | null): Brand | null {
    if (!db) return null;
    return {
      id: db.id,
      partnerId: db.partner_id,
      code: db.code,
      name: db.name,
      internalCode: db.internal_code,
      description: db.description,
      isActive: db.is_active,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  private mapStock(db: DbStock): Stock {
    return {
      id: db.id,
      itemId: db.item_id,
      locationId: db.location_id,
      widthMm: db.width_mm,
      condition: db.condition as StockCondition,
      quantity: db.quantity,
      weightKg: db.weight_kg ? Number(db.weight_kg) : null,
      status: db.status as StockStatus,
      isActive: db.is_active,
      batchNumber: db.batch_number,
      lotNumber: db.lot_number,
      receivedAt: db.received_at,
      parentStockId: db.parent_stock_id,
      sourceType: db.source_type,
      sourceReferenceId: db.source_reference_id,
      notes: db.notes,
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
    const operator = this.mapUser(db.operator);
    const approvedByUser = this.mapUser(db.approved_user);

    const parentStock = {
      ...this.mapStock(db.stocks),
      item: {
        ...this.mapItem(db.stocks.items),
        paperType: this.mapPaperType(db.stocks.items.paper_types),
        brand: this.mapBrand(db.stocks.items.brands),
      },
    };

    const outputs: SlittingOutputWithRelations[] = (
      db.slitting_outputs || []
    ).map((o) => ({
      ...this.mapOutput(o),
      item: {
        ...this.mapItem(o.items),
        paperType: this.mapPaperType(o.items.paper_types),
        brand: this.mapBrand(o.items.brands),
      },
    }));

    return {
      ...job,
      schedule,
      machine,
      parentStock,
      operator,
      approvedByUser,
      outputs,
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

    if (error) throw new BadRequestException(error.message);

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
        slitting_outputs (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          )
        )
      `,
      )
      .eq("schedule_id", id)
      .order("sequence_number", { ascending: true });

    if (jobsError) throw new BadRequestException(jobsError.message);

    const schedule = this.mapSchedule(scheduleData as DbSchedule);
    const createdByUser = this.mapUser(
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
        slitting_outputs (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
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

    if (error) throw new BadRequestException(error.message);

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
        slitting_outputs (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
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
      .from("slitting_outputs")
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
  ): Promise<{ job: SlittingJobWithRelations; result: ApproveJobResult }> {
    const client = this.supabaseService.getServiceClient();
    const existingJob = await this.findOneJob(id);

    if (existingJob.status !== JOB_STATUS.COMPLETED) {
      throw new BadRequestException(
        `Cannot approve job in status: ${existingJob.status}`,
      );
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

    if (error) throw new BadRequestException(error.message);

    return (data || []).map((h) => ({
      ...this.mapHistory(h as DbHistory),
      actor: this.mapUser((h as { actor: DbUser }).actor)!,
    }));
  }
}
