import { Module } from "@nestjs/common";
import { ItemsController, PaperTypesController } from "./items.controller";
import { ItemsService } from "./items.service";

@Module({
  controllers: [ItemsController, PaperTypesController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
