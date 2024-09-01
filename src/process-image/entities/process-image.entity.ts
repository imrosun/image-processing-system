import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProcessImageDocument = ProcessImage & Document;

@Schema()
export class ProcessImage {
    @Prop({ required: true })
    serialNumber: number;

    @Prop({ required: true })
    productName: string;

    @Prop({ required: true })
    inputImageUrls: string[];

    @Prop({ default: [] })
    outputImageUrls: string[];

    @Prop({ default: 'Pending' })
    status: string;

    @Prop({ required: true })
    requestId: string;
}

export const ProcessImageSchema = SchemaFactory.createForClass(ProcessImage);
