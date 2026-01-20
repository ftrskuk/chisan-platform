import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  type SlittingSchedule,
  type SlittingScheduleWithStats,
  type SlittingScheduleWithRelations,
  type SlittingJob,
  type SlittingJobWithRelations,
  type SlittingActualOutput,
  type SlittingActualOutputWithRelations,
  type SlittingPlannedOutput,
  type SlittingPlannedOutputWithRelations,
  type SlittingJobRoll,
  type SlittingJobRollWithRelations,
  type SlittingHistory,
  type SlittingHistoryWithActor,
  type SlittingSchedulesResponse,
  type SlittingJobsResponse,
  type SlittingScheduleResult,
  type SlittingJobResult,
  type ApproveJobResult,
  type ApproveJobV2Result,
  type ScheduleStatus,
  type JobStatus,
  type JobRollStatus,
  type SlittingEntityType,
  type SlittingHistoryAction,
  type ScheduleSearchInput,
  type JobSearchInput,
  type CreateScheduleInput,
  type UpdateScheduleInput,
  type CreateJobInput,
  type CreateJobV2Input,
  type CompleteJobInput,
  type WorkerJobSearchInput,
  type RegisterRollInput,
  type StartRollInput,
  type RecordActualOutputInput,
  type UpdateActualOutputInput,
  type CompleteRollInput,
  type CancelRollInput,
  type CompleteJobV2Input,
  type Machine,
  type MachineStatus,
} from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { AuditService } from "../../core/audit/audit.service";
import {
  type DbUser,
  mapItem,
  mapPaperType,
  mapBrand,
  mapStock,
  mapUser,
} from "../../common/mappers";
import { handleSupabaseError } from "../../common/utils";
import {
  SCHEDULE_STATUS,
  JOB_STATUS,
  MACHINE_STATUS,
  ENTITY_TYPE,
  HISTORY_ACTION,
  STOCK_STATUS,
  STOCK_CONDITION,
  JOB_ROLL_STATUS,
  type DbSchedule,
  type DbScheduleWithStats,
  type DbJob,
  type DbJobWithRelations,
  type DbHistory,
  type DbActualOutput,
  type DbPlannedOutput,
  type DbJobRoll,
  type DbMachine,
} from "./slitting.types";
import type {
  DbItem,
  DbPaperType,
  DbBrand,
  DbStock,
} from "../../common/mappers";
import {
  mapSchedule,
  mapScheduleWithStats,
  mapJob,
  mapJobWithRelations,
  mapActualOutput,
  mapPlannedOutput,
  mapJobRoll,
  mapHistory,
  mapMachine,
} from "./slitting.mapper";

@Injectable()
export class SlittingService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

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
        mapScheduleWithStats(db),
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

    const schedule = mapSchedule(scheduleData as DbSchedule);
    const createdByUser = mapUser(
      (scheduleData as { created_by_user: DbUser }).created_by_user,
    )!;
    const jobs = (jobsData as DbJobWithRelations[]).map((db) =>
      mapJobWithRelations(db),
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
      history: mapHistory(historyData as DbHistory),
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
      history: mapHistory(historyData as DbHistory),
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
      history: mapHistory(historyData as DbHistory),
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
      data: (data as DbJobWithRelations[]).map((db) => mapJobWithRelations(db)),
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

    return mapJobWithRelations(data as DbJobWithRelations);
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
      history: mapHistory(historyData as DbHistory),
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
      history: mapHistory(historyData as DbHistory),
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
      history: mapHistory(historyData as DbHistory),
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
      history: mapHistory(historyData as DbHistory),
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
      history: mapHistory(historyData as DbHistory),
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
      search.scheduledDate || new Date().toISOString().slice(0, 10);

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

    if (search.statuses && search.statuses.length > 0) {
      const inProgressIncluded = search.statuses.includes("in_progress");
      const otherStatuses = search.statuses.filter(
        (s): s is JobStatus => s !== "in_progress",
      );

      if (inProgressIncluded && otherStatuses.length > 0) {
        return this.findWorkerJobsMixed(search, scheduledDate, otherStatuses);
      } else if (inProgressIncluded) {
        query = query.eq("status", "in_progress");
      } else {
        query = query
          .in("status", otherStatuses)
          .lte("slitting_schedules.scheduled_date", scheduledDate);
      }
    } else if (search.status) {
      if (search.status === "in_progress") {
        query = query.eq("status", search.status);
      } else {
        query = query
          .eq("status", search.status)
          .lte("slitting_schedules.scheduled_date", scheduledDate);
      }
    } else {
      query = query.lte("slitting_schedules.scheduled_date", scheduledDate);
    }

    if (search.machineId) {
      query = query.eq("machine_id", search.machineId);
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
      data: (data as DbJobWithRelations[]).map((db) => mapJobWithRelations(db)),
      total: count ?? 0,
      limit: search.limit,
      offset: search.offset,
    };
  }

  private async findWorkerJobsMixed(
    search: WorkerJobSearchInput,
    scheduledDate: string,
    otherStatuses: JobStatus[],
  ): Promise<SlittingJobsResponse> {
    const client = this.supabaseService.getServiceClient();

    const selectQuery = `
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
    `;

    let inProgressQuery = client
      .from("slitting_jobs")
      .select(selectQuery)
      .eq("status", "in_progress");

    if (search.machineId) {
      inProgressQuery = inProgressQuery.eq("machine_id", search.machineId);
    }

    let otherQuery = client
      .from("slitting_jobs")
      .select(selectQuery)
      .in("status", otherStatuses)
      .lte("slitting_schedules.scheduled_date", scheduledDate);

    if (search.machineId) {
      otherQuery = otherQuery.eq("machine_id", search.machineId);
    }

    const [inProgressResult, otherResult] = await Promise.all([
      inProgressQuery,
      otherQuery,
    ]);

    if (inProgressResult.error) {
      handleSupabaseError(inProgressResult.error, {
        operation: "fetch worker jobs (in_progress)",
        resource: "SlittingJob",
      });
    }

    if (otherResult.error) {
      handleSupabaseError(otherResult.error, {
        operation: "fetch worker jobs (other statuses)",
        resource: "SlittingJob",
      });
    }

    const allJobs = [
      ...(inProgressResult.data ?? []),
      ...(otherResult.data ?? []),
    ] as DbJobWithRelations[];

    allJobs.sort((a, b) => (a.sequence_number ?? 0) - (b.sequence_number ?? 0));

    const total = allJobs.length;
    const paginated = allJobs.slice(
      search.offset,
      search.offset + search.limit,
    );

    return {
      data: paginated.map((db) => mapJobWithRelations(db)),
      total,
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
      ...mapJobRoll(dbRoll),
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
      ...mapJobRoll(dbRoll),
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
      ...mapActualOutput(dbOutput),
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
      ...mapActualOutput(dbOutput),
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
      ...mapJobRoll(dbRoll),
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
        ...mapActualOutput(ao),
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
      ...mapJobRoll(dbRoll),
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
      history: mapHistory(historyData as DbHistory),
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
      ...mapHistory(h as DbHistory),
      actor: mapUser((h as { actor: DbUser }).actor)!,
    }));
  }
}
