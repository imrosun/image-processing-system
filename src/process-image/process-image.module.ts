import { Module } from '@nestjs/common';
import { ProcessImageService } from './process-image.service';
import { ProcessImageController } from './process-image.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProcessImage, ProcessImageSchema } from './entities/process-image.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ProcessImage.name, schema: ProcessImageSchema }]),
    HttpModule,  
  ],
  controllers: [ProcessImageController],
  providers: [ProcessImageService],
})
export class ProcessImageModule {}
