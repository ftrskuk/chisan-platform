import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private serviceClient: SupabaseClient | null = null;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>("SUPABASE_URL");
    const serviceKey = this.configService.get<string>("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !serviceKey) {
      this.logger.warn("Supabase credentials not configured");
      return;
    }

    this.serviceClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    this.logger.log("Supabase service client initialized");
  }

  getServiceClient(): SupabaseClient {
    if (!this.serviceClient) {
      throw new Error("Supabase service client not initialized");
    }
    return this.serviceClient;
  }

  createClientWithToken(token: string): SupabaseClient {
    const url = this.configService.get<string>("SUPABASE_URL")!;
    const anonKey = this.configService.get<string>("SUPABASE_ANON_KEY")!;

    return createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
}
