import type {
  DbItem,
  DbPaperType,
  DbBrand,
  DbStock,
  DbUser,
} from "../../common/mappers";

export const SCHEDULE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export const JOB_STATUS = {
  PENDING: "pending",
  READY: "ready",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  APPROVED: "approved",
} as const;

export const MACHINE_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  MAINTENANCE: "maintenance",
} as const;

export const ENTITY_TYPE = {
  SCHEDULE: "schedule",
  JOB: "job",
} as const;

export const HISTORY_ACTION = {
  CREATED: "created",
  UPDATED: "updated",
  PUBLISHED: "published",
  READY: "ready",
  STARTED: "started",
  COMPLETED: "completed",
  APPROVED: "approved",
  CANCELLED: "cancelled",
} as const;

export const STOCK_STATUS = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  QUARANTINE: "quarantine",
  DISPOSED: "disposed",
} as const;

export const STOCK_CONDITION = {
  PARENT: "parent",
  SLITTED: "slitted",
} as const;

export const JOB_ROLL_STATUS = {
  REGISTERED: "registered",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export interface DbSchedule {
  id: string;
  schedule_number: string;
  scheduled_date: string;
  status: string;
  created_by: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbScheduleWithStats extends DbSchedule {
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

export interface DbJob {
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

export interface DbOutput {
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

export interface DbActualOutput extends DbOutput {
  job_roll_id: string | null;
  planned_output_id: string | null;
  length_m: number | null;
  roll_id: string | null;
  recorded_by: string | null;
  recorded_at: string | null;
}

export interface DbPlannedOutput {
  id: string;
  job_id: string;
  item_id: string;
  width_mm: number;
  quantity: number;
  sequence_number: number;
  notes: string | null;
  created_at: string;
}

export interface DbJobRoll {
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

export interface DbHistory {
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

export interface DbMachine {
  id: string;
  name: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbJobWithRelations extends DbJob {
  slitting_schedules: DbSchedule;
  machines: DbMachine;
  operator: DbUser | null;
  approved_user: DbUser | null;
  stocks:
    | (DbStock & {
        items: DbItem & {
          paper_types: DbPaperType;
          brands: DbBrand | null;
        };
      })
    | null;
  items:
    | (DbItem & {
        paper_types: DbPaperType;
        brands: DbBrand | null;
      })
    | null;
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
  slitting_planned_outputs?: Array<
    DbPlannedOutput & {
      items: DbItem & {
        paper_types: DbPaperType;
        brands: DbBrand | null;
      };
    }
  >;
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
