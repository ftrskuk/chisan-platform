import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import {
  assignRoleSchema,
  updateUserSchema,
  ADMIN_ONLY_ROLES,
} from "@repo/shared";
import type { AssignRoleInput, UpdateUserInput, UserRole } from "@repo/shared";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import { Roles } from "../../core/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../core/auth/guards/roles.guard";
import type { RequestUser } from "../../core/auth/types/auth.types";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(...ADMIN_ONLY_ROLES)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @Roles(...ADMIN_ONLY_ROLES)
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @Roles(...ADMIN_ONLY_ROLES)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateUserSchema))
    updateUserDto: UpdateUserInput,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Post(":id/roles")
  @Roles(...ADMIN_ONLY_ROLES)
  assignRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(assignRoleSchema))
    assignRoleDto: AssignRoleInput,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.usersService.assignRole(id, assignRoleDto.role, currentUser.id);
  }

  @Delete(":id/roles/:role")
  @Roles(...ADMIN_ONLY_ROLES)
  removeRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("role") role: UserRole,
  ) {
    return this.usersService.removeRole(id, role);
  }

  @Patch(":id/deactivate")
  @Roles(...ADMIN_ONLY_ROLES)
  deactivate(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.deactivate(id);
  }

  @Patch(":id/reactivate")
  @Roles(...ADMIN_ONLY_ROLES)
  reactivate(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.reactivate(id);
  }
}
