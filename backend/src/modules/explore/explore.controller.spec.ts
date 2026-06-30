import { Test, TestingModule } from '@nestjs/testing';
import { ExploreController } from './exploreController';
import { ExploreService } from './exploreService';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ExecutionContext } from '@nestjs/common';

describe('ExploreController', () => {
  let controller: ExploreController;
  let exploreService: ExploreService;

  beforeEach(async () => {
    const mockExploreService = {
      getExploreDocuments: jest.fn(),
      getDocumentAiCache: jest.fn(),
      checkQuizAnswer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExploreController],
      providers: [
        {
          provide: ExploreService,
          useValue: mockExploreService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => true,
      })
      .compile();

    controller = module.get<ExploreController>(ExploreController);
    exploreService = module.get<ExploreService>(ExploreService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Guards', () => {
    it('should use JwtAuthGuard for getExploreDocuments', () => {
      const guards = Reflect.getMetadata('__guards__', controller.getExploreDocuments);
      expect(guards).toBeDefined();
      expect(guards[0]).toBe(JwtAuthGuard);
    });

    it('should use JwtAuthGuard for getDocumentAiCache', () => {
      const guards = Reflect.getMetadata('__guards__', controller.getDocumentAiCache);
      expect(guards).toBeDefined();
      expect(guards[0]).toBe(JwtAuthGuard);
    });

    it('should use JwtAuthGuard for checkQuizAnswer', () => {
      const guards = Reflect.getMetadata('__guards__', controller.checkQuizAnswer);
      expect(guards).toBeDefined();
      expect(guards[0]).toBe(JwtAuthGuard);
    });
  });
});
