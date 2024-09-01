import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!'
  }

  getMain(): any {
    return {
      name: 'image-processing-system',
      version: '0.0.1',
      description: 'An REST API with NESTJS and MONGODB',
      author: 'imrosun',
      message: 'Check github Readme for full guide and API Documentation'
    };
  }
}