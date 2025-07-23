/* eslint-disable @typescript-eslint/no-var-requires */

import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Raw, Repository } from 'typeorm';

import * as streamifier from 'streamifier';
import { v2 as cloudinary } from 'cloudinary';
import { InjectRepository } from '@nestjs/typeorm';

import { sanitizeFileName } from '@/common/helpers/sanitize-file-name';
import { OfferingFileType } from '@/common/enums/offering-file-type.enum';

import { User } from '@/modules/user/entities/user.entity';
import { CloudinaryResponse } from '@/modules/cloudinary/types/cloudinary-response.type';
import { CreateFileDto } from '@/modules/files/dto/create-file.dto';
import { DeleteFileDto } from '@/modules/files/dto/delete-file.dto';

import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger('CloudinaryService');

  constructor(
    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,

    @InjectRepository(OfferingExpense)
    private readonly offeringExpenseRepository: Repository<OfferingExpense>,
  ) {}

  //* Upload files
  uploadFile(
    file: Express.Multer.File,
    createFileDto: CreateFileDto,
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const { fileType, offeringType, offeringSubType } = createFileDto;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: sanitizeFileName(file.originalname),
          folder: offeringSubType
            ? `${fileType}/${offeringType}/${offeringSubType}`
            : `${fileType}/${offeringType}`,
          format: 'webp',
          quality: 'auto',
        },
        (error, result) => {
          if (error)
            return reject(`Error uploading to Cloudinary: ${error.message}`);
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  //! Delete file
  async deleteFile(
    publicId: string,
    deleteFileDto: DeleteFileDto,
    user: User,
  ): Promise<void> {
    const { fileType, path, secureUrl } = deleteFileDto;

    //? Validation if income or expense
    //* Income
    if (fileType === OfferingFileType.Income) {
      try {
        const offeringIncome = await this.offeringIncomeRepository.findOne({
          where: {
            imageUrls: Raw((alias) => `:secureUrl = ANY(${alias})`, {
              secureUrl: secureUrl,
            }),
          },
          relations: [
            'church',
            'pastor',
            'copastor',
            'supervisor',
            'zone',
            'preacher',
            'familyGroup',
            'disciple',
          ],
        });

        if (offeringIncome) {
          const newSecureUrls = offeringIncome.imageUrls.filter(
            (imageUrl) => imageUrl !== secureUrl,
          );

          const updatedOfferingIncome =
            await this.offeringIncomeRepository.preload({
              id: offeringIncome?.id,
              ...offeringIncome,
              imageUrls: [...newSecureUrls],
              updatedAt: new Date(),
              updatedBy: user,
            });

          await this.offeringIncomeRepository.save(updatedOfferingIncome);
        }

        const result = await cloudinary.uploader.destroy(`${path}${publicId}`);

        if (result.result !== 'ok') {
          throw new Error(
            `Fallo borrar la imagen, Cloudinary respuesta: ${result.result}`,
          );
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleCloudServiceExceptions(error);
      }
    }

    //* Expense
    if (fileType === OfferingFileType.Expense) {
      try {
        const offeringExpense = await this.offeringExpenseRepository.findOne({
          where: {
            imageUrls: Raw((alias) => `:secureUrl = ANY(${alias})`, {
              secureUrl: secureUrl,
            }),
          },
          relations: ['church'],
        });

        if (offeringExpense) {
          const newSecureUrls = offeringExpense.imageUrls.filter(
            (imageUrl) => imageUrl !== secureUrl,
          );

          const updatedOfferingExpense =
            await this.offeringExpenseRepository.preload({
              id: offeringExpense?.id,
              ...offeringExpense,
              imageUrls: [...newSecureUrls],
              updatedAt: new Date(),
              updatedBy: user,
            });

          await this.offeringExpenseRepository.save(updatedOfferingExpense);
        }

        const result = await cloudinary.uploader.destroy(
          `${deleteFileDto.path}${publicId}`,
        );

        if (result.result !== 'ok') {
          throw new Error(
            `Fallo borrar la imagen, Cloudinary respuesta: ${result.result}`,
          );
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleCloudServiceExceptions(error);
      }
    }
  }

  //* Standalone methods for internal use
  async uploadPdfAsWebp({
    fileName,
    pdfDoc,
    fileType,
    offeringType,
    offeringSubType,
  }: {
    pdfDoc: PDFKit.PDFDocument;
    fileName?: string;
    fileType: string;
    offeringType: string;
    offeringSubType: string;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: fileName,
            folder: offeringSubType
              ? `${fileType}/${offeringType}/${offeringSubType}`
              : `${fileType}/${offeringType}`,
            resource_type: 'image',
            format: 'webp',
            pages: 1,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result?.secure_url) {
              resolve(result.secure_url);
            } else {
              reject(new Error('Upload failed'));
            }
          },
        );

        streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
      });

      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  async deleteDirectFileFromCloudinary(
    publicId: string,
    path: string,
  ): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(`${path}${publicId}`);

      if (result.result !== 'ok') {
        throw new Error(
          `Fallo borrar la imagen, Cloudinary respuesta: ${result.result}`,
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleCloudServiceExceptions(error);
    }
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleCloudServiceExceptions(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(`${error.message}`);
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
