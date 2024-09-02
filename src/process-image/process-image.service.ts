import { BadRequestException, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProcessImage, ProcessImageDocument } from './entities/process-image.entity';
import { CreateProcessImageDto } from './dto/create-process-image.dto';
import { UpdateProcessImageDto } from './dto/update-process-image.dto';
import { parse } from 'csv-parse';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as AWS from 'aws-sdk';

@Injectable()
export class ProcessImageService {
  private s3: AWS.S3;

  constructor(
    @InjectModel(ProcessImage.name) private productModel: Model<ProcessImageDocument>,
    private readonly httpService: HttpService,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async create(createProcessImageDto: CreateProcessImageDto): Promise<ProcessImage> {
    const createdImage = new this.productModel(createProcessImageDto);
    return createdImage.save();
  }

  async processCSV(file: Express.Multer.File): Promise<any> {
    const records = [];
    const parser = parse(file.buffer, { columns: true, trim: true });
    for await (const record of parser) {
      if (!record['S. No.'] || !record['Product Name'] || !record['Input Image Urls']) {
        throw new BadRequestException('CSV is missing required columns');
      }
      records.push(record);
    }

    const requestId = uuidv4();

    try {
      for (const record of records) {
        const product = new this.productModel({
          serialNumber: parseInt(record['S. No.'], 10),
          productName: record['Product Name'],
          inputImageUrls: record['Input Image Urls'].split(',').map(url => url.trim()),
          status: 'Pending',
          requestId: requestId,
        });
        await product.save();

        // Start image processing in the background
        this.processImages(product);
      }
    } catch (error) {
      console.error('Error processing CSV:', error.message);
      throw new HttpException({
        message: 'Failed to process CSV file',
        error: error.message,
      }, HttpStatus.BAD_GATEWAY);
    }

    return {
      message: 'File uploaded successfully',
      requestId,
    };
  }

  async processImages(product: ProcessImageDocument) {
    const outputUrls = [];
    const failedUrls = [];

    try {
      for (const url of product.inputImageUrls) {
        try {
          const response = await firstValueFrom(this.httpService.get(url, { responseType: 'arraybuffer' }));
          const compressedImage = await this.compressImage(response.data);
          const outputUrl = await this.saveCompressedImage(compressedImage);
          outputUrls.push(outputUrl);
        } catch (error) {
          // console.error(`Failed to process image at ${url}:`, error.message);
          outputUrls.push(''); // Empty entry for failed URL
          failedUrls.push(url); // Collect failed URLs for reporting
        }
      }
    } catch (error) {
      // console.error('Error processing images:', error.message);
      throw new HttpException({
        message: 'Failed to process images',
        error: error.message,
      }, HttpStatus.BAD_GATEWAY);
    }

    product.outputImageUrls = outputUrls;
    product.status = failedUrls.length > 0 ? `Completed except for ${failedUrls.length} url(s)` : 'Completed';
    await product.save();

    // Notify via webhook 
    try {
      await this.triggerWebhook(product.requestId, failedUrls);
    } catch (error) {
      // console.error('Error triggering webhook:', error.message);
    }
  }

  async compressImage(buffer: Buffer): Promise<Buffer> {
    const metadata = await sharp(buffer).metadata();
    const targetSizeRatio = 0.5;
    let resizeFactor = 1;
    let resizedBuffer = buffer;
    let currentSize = buffer.length;

    while (currentSize > buffer.length * targetSizeRatio) {
      resizeFactor *= 0.8;
      resizedBuffer = await sharp(buffer)
        .resize({ width: Math.round(metadata.width * resizeFactor) })
        .jpeg({
          quality: 50,
          progressive: true,
          chromaSubsampling: '4:2:0'
        })
        .toBuffer();

      currentSize = resizedBuffer.length;
    }

    const finalBuffer = await sharp(resizedBuffer)
      .jpeg({
        quality: 20,
        progressive: true,
        chromaSubsampling: '4:2:0'
      })
      .toBuffer();

    return finalBuffer;
  }

  async saveCompressedImage(buffer: Buffer): Promise<string> {
    const key = `compressed-image-${uuidv4()}.jpg`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    };
    try {
      await this.s3.upload(params).promise();
    } catch (error) {
      // console.error('Failed to upload image to S3:', error.message);
      throw new HttpException({
        message: 'Failed to upload image to S3',
        error: error.message,
      }, HttpStatus.BAD_GATEWAY);
    }
    return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
  }

  async triggerWebhook(requestId: string, failedUrls: string[]) {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      throw new BadRequestException('Webhook URL is not configured');
    }

    try {
      new URL(webhookUrl);
    } catch (error) {
      console.error('Invalid webhook URL:', webhookUrl);
      return;
    }

    const payload = {
      requestId,
      status: failedUrls.length > 0 ? `Completed except for ${failedUrls.length} urls` : 'Completed',
      failedUrls,
    };

    try {
      // console.log(`Triggering webhook for requestId: ${requestId} with payload:`, payload);
      await firstValueFrom(this.httpService.post(webhookUrl, payload));
      // console.log('Webhook triggered successfully');
    } catch (error) {
      // console.error('Failed to trigger webhook:', error.message);
    }
  }

  async handleWebhook(payload: any) {
    // console.log('Processing webhook data:', payload);

    try {
      await this.productModel.updateMany(
        { requestId: payload.requestId },
        { $set: { status: payload.status } }
      ).exec();
    } catch (error) {
      // console.error('Failed to update status:', error.message);
      throw new HttpException('Failed to update status', HttpStatus.BAD_GATEWAY);
    }
  }

  async findStatusByRequestId(requestId: string): Promise<string> {
    const result = await this.productModel.findOne({ requestId }).exec();
    if (result) {
      return result.status;
    } else {
      throw new HttpException('RequestId not found', HttpStatus.NOT_FOUND);
    }
  }

  async findAll(): Promise<ProcessImage[]> {
    return this.productModel.find().exec();
  }

  async findOne(id: string): Promise<ProcessImage | null> {
    return this.productModel.findById(id).exec();
  }

  async update(id: string, updateProcessImageDto: UpdateProcessImageDto): Promise<ProcessImage | null> {
    return this.productModel.findByIdAndUpdate(id, updateProcessImageDto, { new: true }).exec();
  }

  async remove(id: string): Promise<ProcessImage | null> {
    return this.productModel.findByIdAndDelete(id).exec();
  }

  async findByRequestId(requestId: string): Promise<ProcessImage[]> {
    return this.productModel.find({ requestId }).exec();
  }
}
