import { applyDecorators } from '@nestjs/common';
import {
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

export class SwaggerResponses {
  static unauthorized() {
    return ApiUnauthorizedResponse({
      description: '🔒 Unauthorized: Missing or invalid token.',
    });
  }

  static internalError() {
    return ApiInternalServerErrorResponse({
      description: '🚨 Internal Server Error.',
    });
  }

  static badRequest() {
    return ApiBadRequestResponse({
      description: '❌ Bad Request: Invalid request.',
    });
  }

  static forbidden() {
    return ApiForbiddenResponse({
      description: '🚫 Forbidden: You do not have permissions.',
    });
  }

  static notFound(message = 'Resource not found') {
    return ApiNotFoundResponse({
      description: `❓ Not Found: ${message}`,
    });
  }

  static created(message = 'Resource created') {
    return ApiCreatedResponse({
      description: `✅ ${message}`,
    });
  }

  static ok(message = 'Request successful') {
    return ApiOkResponse({
      description: `✅ ${message}`,
    });
  }

  static param(
    name = 'id',
    description = 'Unique identifier.',
    example = 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
  ) {
    return ApiParam({
      name,
      description,
      example,
    });
  }

  static defaultResponses() {
    return applyDecorators(
      this.unauthorized(),
      this.internalError(),
      this.badRequest(),
      this.forbidden(),
      this.notFound(),
    );
  }
}
