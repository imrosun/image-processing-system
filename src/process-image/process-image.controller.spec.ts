import { Test, TestingModule } from '@nestjs/testing';
import { ProcessImageController } from './process-image.controller';
import { ProcessImageService } from './process-image.service';

describe('ProcessImageController', () => {
  let controller: ProcessImageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcessImageController],
      providers: [ProcessImageService],
    }).compile();

    controller = module.get<ProcessImageController>(ProcessImageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
