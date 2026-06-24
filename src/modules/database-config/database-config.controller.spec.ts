import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseConfigController } from './database-config.controller';

describe('DatabaseConfigController', () => {
  let controller: DatabaseConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatabaseConfigController],
    }).compile();

    controller = module.get<DatabaseConfigController>(DatabaseConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
