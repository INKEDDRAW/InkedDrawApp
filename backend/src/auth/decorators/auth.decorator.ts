/**
 * Authentication Decorators
 * Custom decorators for authentication and authorization
 */

import { createParamDecorator, ExecutionContext, UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

/**
 * Get current user from request
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Require authentication
 */
export function Auth() {
  return applyDecorators(
    UseGuards(AuthGuard('jwt')),
    ApiBearerAuth(),
  );
}

/**
 * Optional authentication (user may or may not be logged in)
 */
export function OptionalAuth() {
  return applyDecorators(
    UseGuards(AuthGuard('jwt')),
    ApiBearerAuth(),
  );
}
