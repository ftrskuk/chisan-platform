import { Module } from "@nestjs/common";
import { PartnersController, BrandsController } from "./partners.controller";
import { PartnersService } from "./partners.service";

@Module({
  controllers: [PartnersController, BrandsController],
  providers: [PartnersService],
  exports: [PartnersService],
})
export class PartnersModule {}
