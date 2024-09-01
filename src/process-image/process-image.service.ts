import { BadRequestException, Injectable } from '@nestjs/common';
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

    for (const record of records) {
      const product = new this.productModel({
        serialNumber: parseInt(record['S. No.'], 10),
        productName: record['Product Name'],
        inputImageUrls: record['Input Image Urls'].split(',').map(url => url.trim()),
        status: 'Pending',
        requestId: requestId,
      });
      await product.save();

      this.processImages(product); 
    }
    return { requestId };
  }

  async processImages(product: ProcessImageDocument) {
    const outputUrls = [];
    const failedUrls = [];
  
    for (const url of product.inputImageUrls) {
      try {
        const response = await firstValueFrom(this.httpService.get(url, { responseType: 'arraybuffer' }));
        const compressedImage = await this.compressImage(response.data);
        const outputUrl = await this.saveCompressedImage(compressedImage);
        outputUrls.push(outputUrl);
      } catch (error) {
        console.error(`Failed to process image at ${url}:`, error.message);
        outputUrls.push(''); // Empty entry for failed URL
        failedUrls.push(url); // Collect failed URLs for reporting
      }
    }
    product.outputImageUrls = outputUrls;
    product.status = failedUrls.length > 0 ? `Completed except for ${failedUrls.length} url` : 'Completed';
    await product.save();
  
    // Notify via webhook
    await this.triggerWebhook(product.requestId, failedUrls);
  }

  async compressImage(buffer: Buffer): Promise<Buffer> {
    // Determine its original size
    const metadata = await sharp(buffer).metadata();
    // Reduce by 50%
    const targetSizeRatio = 0.5;
    // Initial resizing factor
    let resizeFactor = 1;
    // Resize image until it approximates the desired file size reduction
    let resizedBuffer = buffer;
    let currentSize = buffer.length;
  
    // Start resizing
    while (currentSize > buffer.length * targetSizeRatio) {
      resizeFactor *= 0.8; // Reduce size factor incrementally
      resizedBuffer = await sharp(buffer)
        .resize({ width: Math.round(metadata.width * resizeFactor) }) 
        .jpeg({
          quality: 50, // Intermediate quality setting
          progressive: true,
          chromaSubsampling: '4:2:0'
        })
        .toBuffer();
  
      currentSize = resizedBuffer.length;
    }
  
    // Final compression with target quality
    const finalBuffer = await sharp(resizedBuffer)
      .jpeg({
        quality: 20, // Final quality setting for desired reduction
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
    await this.s3.upload(params).promise();
    return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
  }

  async triggerWebhook(requestId: string, failedUrls: string[]) {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      throw new BadRequestException('Webhook URL is not configured');
    }
    const payload = {
      requestId,
      status: failedUrls.length > 0 ? `Completed ${failedUrls.length}` : 'Completed',
      failedUrls,
    };
  
    try {
      await firstValueFrom(this.httpService.post(webhookUrl, payload));
    } catch (error) {
      console.error('Failed to trigger webhook', error.message);
    }
  }

  handleWebhook(payload: any) {
    console.log('Processing webhook data:', payload);
    // Update the status in the database based on webhook payload
    return this.productModel.updateOne(
      { requestId: payload.requestId },
      { $set: { status: payload.status } },
    );
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
