import { Test, TestingModule } from '@nestjs/testing';
import { PersonalFoldersController } from './personal-folders.controller';
import { PersonalFoldersService } from './personal-folders.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

describe('PersonalFoldersController', () => {
  let controller: PersonalFoldersController;

  const mockService = {
    getTree: jest.fn(),
    createFolder: jest.fn(),
    updateFolder: jest.fn(),
    deleteFolder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalFoldersController],
      providers: [
        {
          provide: PersonalFoldersService,
          useValue: mockService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<PersonalFoldersController>(PersonalFoldersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
