import { Test, TestingModule } from '@nestjs/testing';
import { RiskService } from './risk.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderSide, OrderType, OrderValidity } from '@prisma/client';

describe('RiskService', () => {
  let service: RiskService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskService,
        {
          provide: PrismaService,
          useValue: {
            holding: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RiskService>(RiskService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject if quantity exceeds MAX_QUANTITY', async () => {
    const dto = {
      stockId: 'uuid1',
      side: OrderSide.BUY,
      orderType: OrderType.MARKET,
      validity: OrderValidity.DAY,
      quantity: 15000,
      price: 100,
    };
    const result = await service.checkRiskRules('user1', dto);
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('Quantity exceeds maximum');
  });

  it('should approve valid BUY order', async () => {
    const dto = {
      stockId: 'uuid1',
      side: OrderSide.BUY,
      orderType: OrderType.MARKET,
      validity: OrderValidity.DAY,
      quantity: 100,
      price: 100,
    };
    const result = await service.checkRiskRules('user1', dto);
    expect(result.approved).toBe(true);
  });

  it('should reject SELL order if holding is insufficient', async () => {
    jest.spyOn(prismaService.holding, 'findUnique').mockResolvedValue(null as any);
    const dto = {
      stockId: 'uuid1',
      side: OrderSide.SELL,
      orderType: OrderType.MARKET,
      validity: OrderValidity.DAY,
      quantity: 100,
      price: 100,
    };
    const result = await service.checkRiskRules('user1', dto);
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('Insufficient shares');
  });

  it('should approve SELL order if holding is sufficient', async () => {
    jest.spyOn(prismaService.holding, 'findUnique').mockResolvedValue({
      id: 'h1',
      userId: 'user1',
      stockId: 'uuid1',
      quantity: 200,
      avgBuyPrice: 50 as any,
      updatedAt: new Date(),
    });
    const dto = {
      stockId: 'uuid1',
      side: OrderSide.SELL,
      orderType: OrderType.MARKET,
      validity: OrderValidity.DAY,
      quantity: 100,
      price: 100,
    };
    const result = await service.checkRiskRules('user1', dto);
    expect(result.approved).toBe(true);
  });
});
