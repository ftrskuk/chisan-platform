import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { stockSearchSchema } from "@repo/shared";
import type { StockSearchInput } from "@repo/shared";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../core/auth/guards/roles.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { StocksService } from "./stocks.service";

@Controller("stocks")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(stockSearchSchema)) search: StockSearchInput,
  ) {
    return this.stocksService.findAll(search);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.stocksService.findOne(id);
  }
}
