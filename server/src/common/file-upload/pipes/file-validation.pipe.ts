import {
  BadRequestException,
  type PipeTransform,
} from "@nestjs/common";

export type FileValidationOptions = {
  maxSize?: number;
  minSize?: number;
  required?: boolean;
  allowedMimeTypes?: string[];
};

const DEFAULT_MAX = 50 * 1024 * 1024;
const DEFAULT_MIN = 1;

export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions = {}) {}

  transform(file?: Express.Multer.File): Express.Multer.File | undefined {
    const {
      maxSize = DEFAULT_MAX,
      minSize = DEFAULT_MIN,
      required = false,
      allowedMimeTypes,
    } = this.options;

    if (!file) {
      if (required) throw new BadRequestException("File is required");
      return undefined;
    }

    if (file.size < minSize) {
      throw new BadRequestException(`File too small (min ${minSize} bytes)`);
    }
    if (file.size > maxSize) {
      throw new BadRequestException(`File too large (max ${maxSize} bytes)`);
    }
    if (
      allowedMimeTypes?.length &&
      !allowedMimeTypes.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}`,
      );
    }

    return file;
  }
}
