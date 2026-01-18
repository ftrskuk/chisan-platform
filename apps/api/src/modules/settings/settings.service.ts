import { Injectable, NotFoundException } from "@nestjs/common";
import type { Setting, SettingCategory } from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { AuditService } from "../../core/audit/audit.service";
import { handleSupabaseError } from "../../common/utils";

interface DbSetting {
  id: string;
  category: string;
  key: string;
  value: unknown;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(): Promise<Setting[]> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("settings")
      .select("*")
      .order("category")
      .order("key");

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch settings",
        resource: "Setting",
      });
    }

    return (data as DbSetting[]).map(this.mapToSetting);
  }

  async findByCategory(category: SettingCategory): Promise<Setting[]> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("settings")
      .select("*")
      .eq("category", category)
      .order("key");

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch settings by category",
        resource: "Setting",
      });
    }

    return (data as DbSetting[]).map(this.mapToSetting);
  }

  async findOne(category: SettingCategory, key: string): Promise<Setting> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("settings")
      .select("*")
      .eq("category", category)
      .eq("key", key)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Setting ${category}.${key} not found`);
    }

    return this.mapToSetting(data as DbSetting);
  }

  async update(
    category: SettingCategory,
    key: string,
    value: unknown,
    updatedBy: string,
  ): Promise<Setting> {
    const client = this.supabaseService.getServiceClient();

    const existingSetting = await this.findOne(category, key);

    const { error } = await client
      .from("settings")
      .update({
        value,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("category", category)
      .eq("key", key);

    if (error) {
      handleSupabaseError(error, {
        operation: "update setting",
        resource: "Setting",
      });
    }

    await this.auditService.log({
      action: "setting_changed",
      category: "settings",
      targetTable: "settings",
      targetId: existingSetting.id,
      changes: {
        value: {
          old: existingSetting.value,
          new: value,
        },
      },
      metadata: {
        settingCategory: category,
        settingKey: key,
      },
    });

    return this.findOne(category, key);
  }

  private mapToSetting(db: DbSetting): Setting {
    return {
      id: db.id,
      category: db.category as SettingCategory,
      key: db.key,
      value: db.value,
      description: db.description,
      updatedBy: db.updated_by,
      updatedAt: db.updated_at,
    };
  }
}
