import { UseGuards, applyDecorators } from '@nestjs/common';

import { PublicOrAuthGuard } from '@/common/guards/public-or-auth.guard';

/**
 * Decorator that allows access either with valid API key or JWT authentication
 * Use this for endpoints that should be accessible both publicly (with API key)
 * and privately (with user authentication)
 */
export function PublicOrAuth() {
  return applyDecorators(UseGuards(PublicOrAuthGuard));
}
