import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '../auth/auth.guard';

@Controller('uploads')
export class UploadsController {
  @Post('image')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        const allowed = /jpg|jpeg|png|webp|gif/;
        const ok = allowed.test(extname(file.originalname).toLowerCase()) &&
                   allowed.test(file.mimetype.replace('image/', ''));
        cb(ok ? null : new BadRequestException('Solo se permiten imágenes (jpg, png, webp)'), ok);
      },
    }),
  )
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp|gif)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const baseUrl = process.env.API_BASE_URL ?? `https://navajowhite-quetzal-176085.hostingersite.com`;
    return { url: `${baseUrl}/uploads/${file.filename}` };
  }
}
