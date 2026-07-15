import { Test, TestingModule } from '@nestjs/testing';
import { LedgerService } from './ledger.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LedgerService', () => {
  let service: LedgerService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerService,
        {
          provide: PrismaService,
          useValue: {
            ledgerEntry: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LedgerService>(LedgerService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should validate double entry invariant correctly', async () => {
    // Mock debits and credits balancing
    jest.spyOn(prismaService.ledgerEntry, 'findMany').mockResolvedValue([
      { id: '1', debit: 500.50 as any, credit: 0 as any, account: 'CASH', orderId: 'ord1', tradeId: null, createdAt: new Date() },
      { id: '2', credit: 500.50 as any, debit: 0 as any, account: 'SECURITIES', orderId: 'ord1', tradeId: null, createdAt: new Date() },
    ]);
    
    const isValid = await service.validateDoubleEntryInvariant('ord1');
    expect(isValid).toBe(true);
  });

  it('should fail double entry invariant if unbalanced', async () => {
    jest.spyOn(prismaService.ledgerEntry, 'findMany').mockResolvedValue([
      { id: '1', debit: 500.50 as any, credit: 0 as any, account: 'CASH', orderId: 'ord1', tradeId: null, createdAt: new Date() },
      { id: '2', credit: 500.00 as any, debit: 0 as any, account: 'SECURITIES', orderId: 'ord1', tradeId: null, createdAt: new Date() },
    ]);
    
    const isValid = await service.validateDoubleEntryInvariant('ord1');
    expect(isValid).toBe(false);
  });
});
