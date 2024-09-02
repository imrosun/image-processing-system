import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, BadRequestException, HttpStatus, HttpException } from '@nestjs/common';
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
    try {
      const response = await this.processImageService.processCSV(file);
      return {
        message: 'File uploaded successfully',
        requestId: response.requestId
      };
    } catch (error) {
      throw new HttpException({
        message: 'Failed to process file',
        error: error.message
      }, HttpStatus.BAD_GATEWAY);
    }
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    try {
      const { requestId, status } = body;
      
      if (!requestId) {
        throw new HttpException({
          message: 'RequestId is required in webhook payload',
        }, HttpStatus.BAD_REQUEST);
      }

      await this.processImageService.handleWebhook(body);

      const updatedStatus = await this.processImageService.findStatusByRequestId(requestId);

      return {
        message: 'Webhook processed successfully',
        requestId,
        status: updatedStatus,
      };
    } catch (error) {
      // console.error('Failed to process webhook:', error.message);
      throw new HttpException({
        message: 'Failed to process webhook',
        error: error.message,
      }, HttpStatus.BAD_GATEWAY);
    }
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
