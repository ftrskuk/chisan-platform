import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  Machine,
  MachineStatus,
  MachinesResponse,
  MachineSearchInput,
} from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { AuditService } from "../../core/audit/audit.service";

interface DbMachine {
  id: string;
  name: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class MachinesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

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

  async findAll(search?: MachineSearchInput): Promise<MachinesResponse> {
    const client = this.supabaseService.getServiceClient();

    let query = client.from("machines").select("*", { count: "exact" });

    if (search?.status) {
      query = query.eq("status", search.status);
    }
    if (search?.q) {
      query = query.ilike("name", `%${search.q}%`);
    }

    const { data, error, count } = await query.order("name", {
      ascending: true,
    });

    if (error) throw new BadRequestException(error.message);

    return {
      data: (data as DbMachine[]).map((db) => this.mapMachine(db)),
      total: count ?? 0,
    };
  }

  async findOne(id: string): Promise<Machine> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("machines")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Machine with ID ${id} not found`);
    }

    return this.mapMachine(data as DbMachine);
  }

  async updateStatus(
    id: string,
    status: MachineStatus,
    userId: string,
  ): Promise<Machine> {
    const client = this.supabaseService.getServiceClient();
    const existingMachine = await this.findOne(id);

    if (existingMachine.status === status) {
      return existingMachine;
    }

    const { error } = await client
      .from("machines")
      .update({ status })
      .eq("id", id);

    if (error) throw new BadRequestException(error.message);

    await this.auditService.log({
      action: "machine_status_updated",
      category: "production",
      targetTable: "machines",
      targetId: id,
      metadata: {
        machineName: existingMachine.name,
        previousStatus: existingMachine.status,
        newStatus: status,
      },
    });

    return this.findOne(id);
  }
}
