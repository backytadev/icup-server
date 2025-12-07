import { applyDecorators } from '@nestjs/common';
import { SwaggerResponses } from './swagger.response';

export interface SwaggerResponseProps {
  description?: string;
  paramDescription?: string;
  paramExample?: string;
}

export const CreateSwagger = ({
  description = 'Resource updated successfully',
}: SwaggerResponseProps) =>
  applyDecorators(
    SwaggerResponses.created(`${description}`),
    SwaggerResponses.defaultResponses(),
  );

export const FindAllSwagger = ({
  description = 'Resource updated successfully',
}: SwaggerResponseProps) =>
  applyDecorators(
    SwaggerResponses.ok(`${description}`),
    SwaggerResponses.defaultResponses(),
  );

export const SearchSwagger = ({
  description = 'Resource updated successfully',
}: SwaggerResponseProps) =>
  applyDecorators(
    SwaggerResponses.ok(`${description}`),
    SwaggerResponses.defaultResponses(),
  );

export const UpdateSwagger = ({
  description = 'Resource updated successfully',
  paramDescription = 'Unique identifier of the resource.',
  paramExample = 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
}: SwaggerResponseProps) =>
  applyDecorators(
    SwaggerResponses.param('id', paramDescription, paramExample),
    SwaggerResponses.ok(`${description}`),
    SwaggerResponses.defaultResponses(),
  );

export const DeleteSwagger = ({
  description = 'Resource updated successfully',
  paramDescription = 'Unique identifier of the resource.',
  paramExample = 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
}: SwaggerResponseProps) =>
  applyDecorators(
    SwaggerResponses.param('id', paramDescription, paramExample),
    SwaggerResponses.ok(`${description}`),
    SwaggerResponses.defaultResponses(),
  );
