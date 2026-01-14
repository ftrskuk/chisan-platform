import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { SupabaseModule } from "./core/supabase/supabase.module";
import { AuthModule } from "./core/auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    SupabaseModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
