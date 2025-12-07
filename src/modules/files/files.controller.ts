import {
  Post,
  Query,
  Param,
  Delete,
  Controller,
  UploadedFiles,
  ParseFilePipe,
  UseInterceptors,
  FileTypeValidator,
  BadRequestException,
  MaxFileSizeValidator,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiBearerAuth,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

import { SkipThrottle } from '@nestjs/throttler';

import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { User } from '@/modules/user/entities/user.entity';

import { CreateFileDto } from '@/modules/files/dto/create-file.dto';
import { DeleteFileDto } from '@/modules/files/dto/delete-file.dto';

import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';

@Controller('files')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description:
    '🔒 Unauthorized: Missing or invalid Bearer Token. Please provide a valid token to access this resource.',
})
@ApiInternalServerErrorResponse({
  description:
    '🚨 Internal Server Error: An unexpected error occurred on the server. Please check the server logs for more details.',
})
@ApiBadRequestResponse({
  description:
    '❌ Bad Request: The request contains invalid data or parameters. Please verify the input and try again.',
})
@ApiForbiddenResponse({
  description:
    '🚫 Forbidden: You do not have the necessary permissions to access this resource.',
})
@SkipThrottle()
export class FilesController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  //* Upload file to cloudinary
  @Post('upload')
  @Auth(UserRole.SuperUser, UserRole.AdminUser, UserRole.TreasurerUser)
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The images were successfully uploaded. The response includes the URLs of the uploaded images.',
  })
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'The images to be uploaded. A maximum of 4 images is allowed, and they must be in .png, .jpeg, or .jpg format.',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        description: {
          type: 'string',
          example: 'Upload images for a specific record (income or expense).',
        },
      },
    },
  })
  async uploadImages(
    @Query() createFileDto: CreateFileDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    if (files.length > 4) {
      throw new BadRequestException('Image limits have been exceeded (max 4).');
    }

    const uploadedFilesPromises = files.map((file) =>
      this.cloudinaryService.uploadFile(file, createFileDto),
    );

    const result = await Promise.all(uploadedFilesPromises);

    const imageUrls = result.map((res) => res.secure_url);
    return { imageUrls };
  }

  //! Destroy file to cloudinary
  @Delete(':publicId')
  @Auth(UserRole.SuperUser, UserRole.AdminUser, UserRole.TreasurerUser)
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested image has been successfully deleted. No content is returned in the response.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Unique identifier of the image to be deleted. This ID is used to locate and remove the corresponding image from the storage.',
    example: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
  })
  async deleteFile(
    @Param('publicId') publicId: string,
    @Query() deleteFileDto: DeleteFileDto,
    @GetUser() user: User,
  ): Promise<void> {
    await this.cloudinaryService.deleteFile(publicId, deleteFileDto, user);
  }
}
