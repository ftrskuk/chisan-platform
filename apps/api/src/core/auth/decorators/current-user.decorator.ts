import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { RequestUser } from "../types/auth.types";

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext): RequestUser | RequestUser[keyof RequestUser] => {
    const request = ctx.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (data) {
      return user[data];
    }

    return user;
  }
);
