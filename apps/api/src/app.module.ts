import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { SupabaseModule } from "./core/supabase/supabase.module";
import { AuthModule } from "./core/auth/auth.module";
import { AuditModule } from "./core/audit/audit.module";
import { UsersModule } from "./modules/users/users.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { WarehousesModule } from "./modules/warehouses/warehouses.module";
import { PartnersModule } from "./modules/partners/partners.module";
import { ItemsModule } from "./modules/items/items.module";
import { StocksModule } from "./modules/stocks/stocks.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { SlittingModule } from "./modules/slitting/slitting.module";
import { ImportModule } from "./modules/import/import.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env.local", "../../.env", ".env.local", ".env"],
    }),
    SupabaseModule,
    AuthModule,
    AuditModule,
    UsersModule,
    SettingsModule,
    WarehousesModule,
    PartnersModule,
    ItemsModule,
    StocksModule,
    OrdersModule,
    SlittingModule,
    ImportModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
