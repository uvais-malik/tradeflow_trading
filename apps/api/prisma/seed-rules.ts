import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Risk Rules...');

  await prisma.riskRule.deleteMany({});

  await prisma.riskRule.create({
    data: {
      name: 'Global Max Quantity',
      ruleType: 'MAX_QUANTITY',
      value: 10000,
      isActive: true,
    }
  });

  await prisma.riskRule.create({
    data: {
      name: 'Max Daily Trade Value',
      ruleType: 'MAX_DAILY_TRADE_VALUE',
      value: 1000000, // 1 Million
      isActive: true,
    }
  });

  console.log('Risk rules seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
