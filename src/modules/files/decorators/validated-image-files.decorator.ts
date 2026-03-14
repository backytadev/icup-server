import {
  UploadedFiles,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';

export const ValidatedImageFiles = () =>
  UploadedFiles(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
        new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
      ],
    }),
  );
