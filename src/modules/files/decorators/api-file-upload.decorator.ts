import { UseInterceptors, applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

import { SwaggerResponses } from '@/common/swagger/swagger.response';

export const ApiFileUpload = (description?: string) =>
  applyDecorators(
    UseInterceptors(AnyFilesInterceptor()),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description,
      schema: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
          },
        },
      },
    }),
    SwaggerResponses.ok('Images uploaded successfully'),
    SwaggerResponses.defaultResponses(),
  );

export const DeleteFileSwagger = (
  description = 'Image deleted successfully',
  paramDescription = 'Public ID of the image to be deleted from Cloudinary.',
  paramExample = 'my-image-filename',
) =>
  applyDecorators(
    ApiParam({
      name: 'publicId',
      description: paramDescription,
      example: paramExample,
    }),
    SwaggerResponses.ok(description),
    SwaggerResponses.defaultResponses(),
  );
