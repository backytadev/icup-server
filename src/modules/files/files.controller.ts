import {
  Post,
  Query,
  Param,
  Delete,
  Controller,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { User } from '@/modules/user/entities/user.entity';

import { CreateFileDto } from '@/modules/files/dto/create-file.dto';
import { DeleteFileDto } from '@/modules/files/dto/delete-file.dto';
import {
  ApiFileUpload,
  DeleteFileSwagger,
  ValidatedImageFiles,
} from '@/modules/files/decorators';

import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';

@Controller('files')
@ApiBearerAuth()
@SkipThrottle()
export class FilesController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  //* Upload offering images to cloudinary
  @Post('upload')
  @Auth(UserRole.SuperUser, UserRole.MembershipUser, UserRole.TreasurerUser)
  @ApiFileUpload(
    'A maximum of 4 images allowed, in .png, .jpeg, or .jpg format.',
  )
  async uploadImages(
    @Query() createFileDto: CreateFileDto,
    @ValidatedImageFiles() files: Express.Multer.File[],
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

  //! Destroy offering image from cloudinary
  @Delete('remove/:publicId')
  @Auth(UserRole.SuperUser, UserRole.MembershipUser, UserRole.TreasurerUser)
  @DeleteFileSwagger(
    'Offering image deleted successfully',
    'Unique identifier of the image to be deleted from Cloudinary storage.',
    'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
  )
  async deleteFile(
    @Param('publicId') publicId: string,
    @Query() deleteFileDto: DeleteFileDto,
    @GetUser() user: User,
  ): Promise<void> {
    await this.cloudinaryService.deleteFile(publicId, deleteFileDto, user);
  }
}
