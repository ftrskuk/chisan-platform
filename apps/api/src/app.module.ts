import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { SupabaseModule } from "./core/supabase/supabase.module";
import { AuthModule } from "./core/auth/auth.module";
import { AuditModule } from "./core/audit/audit.module";
import { UsersModule } from "./modules/users/users.module";
import { SettingsModule } from "./modules/settings/settings.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    SupabaseModule,
    AuthModule,
    AuditModule,
    UsersModule,
    SettingsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
