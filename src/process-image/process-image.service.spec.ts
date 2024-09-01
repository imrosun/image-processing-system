import { Test, TestingModule } from '@nestjs/testing';
import { ProcessImageService } from './process-image.service';

describe('ProcessImageService', () => {
  let service: ProcessImageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcessImageService],
    }).compile();

    service = module.get<ProcessImageService>(ProcessImageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
