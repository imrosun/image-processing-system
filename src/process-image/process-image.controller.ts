import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ProcessImageService } from './process-image.service';
import { CreateProcessImageDto } from './dto/create-process-image.dto';
import { UpdateProcessImageDto } from './dto/update-process-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('process-image')
export class ProcessImageController {
  constructor(private readonly processImageService: ProcessImageService) { }

  @Post()
  create(@Body() createProcessImageDto: CreateProcessImageDto) {
    return this.processImageService.create(createProcessImageDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.processImageService.processCSV(file);
  }

  @Post('webhook')
  handleWebhook(@Body() body: any) {
    console.log('Webhook data received:', body);
    return this.processImageService.handleWebhook(body);
  }

  @Get()
  findAll() {
    return this.processImageService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.processImageService.findOne(id);
  }

  @Get('status/:requestId')
  async getStatus(@Param('requestId') requestId: string) {
    const results = await this.processImageService.findByRequestId(requestId);
    return {
      requestId: requestId,
      status: results.length > 0 ? results[0].status : 'Not Found',
      results,
    };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProcessImageDto: UpdateProcessImageDto) {
    return this.processImageService.update(id, updateProcessImageDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    if (!this.isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.processImageService.remove(id);
  }

  isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}
