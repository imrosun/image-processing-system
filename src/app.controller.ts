import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  
  @Get()
  getMain(@Res() res) {
    return res.status(HttpStatus.OK).json(this.appService.getMain());
  }
}
