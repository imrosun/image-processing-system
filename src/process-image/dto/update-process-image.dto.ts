import { PartialType } from '@nestjs/mapped-types';
import { CreateProcessImageDto } from './create-process-image.dto';

export class UpdateProcessImageDto extends PartialType(CreateProcessImageDto) {}
