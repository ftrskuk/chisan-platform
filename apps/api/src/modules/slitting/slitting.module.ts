import { Module } from "@nestjs/common";
import { MachinesController } from "./machines.controller";
import { MachinesService } from "./machines.service";
import { SlittingController } from "./slitting.controller";
import { SlittingWorkerController } from "./slitting-worker.controller";
import { SlittingService } from "./slitting.service";

@Module({
  controllers: [
    MachinesController,
    SlittingController,
    SlittingWorkerController,
  ],
  providers: [MachinesService, SlittingService],
  exports: [MachinesService, SlittingService],
})
export class SlittingModule {}
