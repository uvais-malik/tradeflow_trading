import { PrismaClient, Role, OrderSide, OrderType, OrderValidity, OrderStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomFloat(min, max + 1));
}

async function main() {
  console.log('Clearing old data...');
  // Delete in reverse dependency order to avoid foreign key constraints
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.order.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.riskRule.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.user.deleteMany();

  console.log('Generating base users...');
  const passwordHash = await argon2.hash('password123');

  const admin = await prisma.user.create({
    data: { email: 'admin@tradeflow.com', passwordHash, fullName: 'System Admin', role: Role.ADMIN, walletBalance: 0 },
  });
  
  const risk = await prisma.user.create({
    data: { email: 'risk@tradeflow.com', passwordHash, fullName: 'Risk Analyst', role: Role.RISK_ANALYST, walletBalance: 0 },
  });

  const traders = [];
  for (let i = 1; i <= 50; i++) {
    traders.push({
      id: crypto.randomUUID(),
      email: `trader${i}@tradeflow.com`,
      passwordHash,
      fullName: `Trader ${i}`,
      role: Role.TRADER,
      walletBalance: randomInt(10000, 1000000),
      isActive: true,
      createdAt: new Date(Date.now() - randomInt(1, 100) * 86400000),
    });
  }
  await prisma.user.createMany({ data: traders });
  console.log(`Created ${traders.length} traders.`);

  const stockData = [
    { symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 150.0 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', currentPrice: 300.0 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', currentPrice: 2800.0 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', currentPrice: 3400.0 },
    { symbol: 'TSLA', name: 'Tesla Inc.', currentPrice: 700.0 },
    { symbol: 'META', name: 'Meta Platforms Inc.', currentPrice: 330.0 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', currentPrice: 800.0 },
    { symbol: 'NFLX', name: 'Netflix Inc.', currentPrice: 500.0 },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', currentPrice: 150.0 },
    { symbol: 'V', name: 'Visa Inc.', currentPrice: 230.0 },
    { symbol: 'WMT', name: 'Walmart Inc.', currentPrice: 140.0 },
    { symbol: 'DIS', name: 'Walt Disney Co.', currentPrice: 100.0 },
    { symbol: 'BABA', name: 'Alibaba Group Holding Ltd.', currentPrice: 90.0 },
    { symbol: 'INTC', name: 'Intel Corp.', currentPrice: 35.0 },
    { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', currentPrice: 110.0 },
  ];

  const stocks = stockData.map(s => ({
    id: crypto.randomUUID(),
    symbol: s.symbol,
    name: s.name,
    currentPrice: s.currentPrice,
    dayHigh: s.currentPrice * 1.05,
    dayLow: s.currentPrice * 0.95,
  }));
  await prisma.stock.createMany({ data: stocks });
  console.log(`Created ${stocks.length} stocks.`);

  console.log('Generating historical trades and order books (this might take a few seconds)...');
  
  const orders: any[] = [];
  const trades: any[] = [];
  const ledgerEntries: any[] = [];
  const holdingsMap = new Map<string, { quantity: number, totalCost: number }>();

  for (const stock of stocks) {
    const currentPrice = stock.currentPrice;

    // 1. Generate Historical Trades (COMPLETED)
    for (let i = 0; i < 200; i++) {
      const tradeTime = new Date(Date.now() - randomInt(1, 30) * 86400000 + randomInt(0, 86400000));
      const tradeQty = randomInt(10, 500);
      const tradePrice = currentPrice * randomFloat(0.9, 1.1);
      
      const buyerId = traders[randomInt(0, traders.length - 1)].id;
      const sellerId = traders[randomInt(0, traders.length - 1)].id;
      if (buyerId === sellerId) continue; // Skip self trades

      const buyOrderId = crypto.randomUUID();
      const sellOrderId = crypto.randomUUID();
      const tradeId = crypto.randomUUID();

      orders.push({
        id: buyOrderId, userId: buyerId, stockId: stock.id, side: OrderSide.BUY,
        orderType: OrderType.LIMIT, validity: OrderValidity.DAY, quantity: tradeQty,
        price: tradePrice, filledQuantity: tradeQty, status: OrderStatus.COMPLETED,
        createdAt: new Date(tradeTime.getTime() - 1000), executedAt: tradeTime
      });

      orders.push({
        id: sellOrderId, userId: sellerId, stockId: stock.id, side: OrderSide.SELL,
        orderType: OrderType.LIMIT, validity: OrderValidity.DAY, quantity: tradeQty,
        price: tradePrice, filledQuantity: tradeQty, status: OrderStatus.COMPLETED,
        createdAt: new Date(tradeTime.getTime() - 2000), executedAt: tradeTime
      });

      trades.push({
        id: tradeId, buyOrderId, sellOrderId, stockId: stock.id,
        price: tradePrice, quantity: tradeQty, executedAt: tradeTime, isSettled: true
      });

      // Bookkeeping
      const totalValue = tradePrice * tradeQty;
      ledgerEntries.push(
        { orderId: buyOrderId, account: 'CASH', debit: 0, credit: totalValue, createdAt: tradeTime },
        { orderId: buyOrderId, account: 'SECURITIES', debit: totalValue, credit: 0, createdAt: tradeTime },
        { orderId: sellOrderId, account: 'CASH', debit: totalValue, credit: 0, createdAt: tradeTime },
        { orderId: sellOrderId, account: 'SECURITIES', debit: 0, credit: totalValue, createdAt: tradeTime }
      );

      // Holdings
      const buyerKey = `${buyerId}_${stock.id}`;
      const bH = holdingsMap.get(buyerKey) || { quantity: 0, totalCost: 0 };
      bH.quantity += tradeQty;
      bH.totalCost += totalValue;
      holdingsMap.set(buyerKey, bH);

      const sellerKey = `${sellerId}_${stock.id}`;
      const sH = holdingsMap.get(sellerKey) || { quantity: 0, totalCost: 0 };
      // Allow negative holdings (short selling) for dummy data ease, or just adjust
      sH.quantity -= tradeQty;
      holdingsMap.set(sellerKey, sH);
    }

    // 2. Generate Live Order Book (OPEN)
    // 50 Bids
    for (let i = 0; i < 50; i++) {
      orders.push({
        id: crypto.randomUUID(), userId: traders[randomInt(0, traders.length - 1)].id,
        stockId: stock.id, side: OrderSide.BUY, orderType: OrderType.LIMIT, validity: OrderValidity.DAY,
        quantity: randomInt(10, 300), price: currentPrice * randomFloat(0.85, 0.999), // Below current price
        filledQuantity: 0, status: OrderStatus.OPEN, createdAt: new Date(Date.now() - randomInt(1000, 3600000))
      });
    }
    // 50 Asks
    for (let i = 0; i < 50; i++) {
      orders.push({
        id: crypto.randomUUID(), userId: traders[randomInt(0, traders.length - 1)].id,
        stockId: stock.id, side: OrderSide.SELL, orderType: OrderType.LIMIT, validity: OrderValidity.DAY,
        quantity: randomInt(10, 300), price: currentPrice * randomFloat(1.001, 1.15), // Above current price
        filledQuantity: 0, status: OrderStatus.OPEN, createdAt: new Date(Date.now() - randomInt(1000, 3600000))
      });
    }
  }

  // Insert all in batches to prevent SQLite/Postgres limits
  const BATCH_SIZE = 5000;
  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    await prisma.order.createMany({ data: orders.slice(i, i + BATCH_SIZE) });
  }
  console.log(`Inserted ${orders.length} orders.`);

  for (let i = 0; i < trades.length; i += BATCH_SIZE) {
    await prisma.trade.createMany({ data: trades.slice(i, i + BATCH_SIZE) });
  }
  console.log(`Inserted ${trades.length} trades.`);

  for (let i = 0; i < ledgerEntries.length; i += BATCH_SIZE) {
    await prisma.ledgerEntry.createMany({ data: ledgerEntries.slice(i, i + BATCH_SIZE) });
  }
  console.log(`Inserted ${ledgerEntries.length} ledger entries.`);

  // Holdings
  const finalHoldings = [];
  for (const [key, data] of holdingsMap.entries()) {
    if (data.quantity === 0) continue;
    const [userId, stockId] = key.split('_');
    const avgBuyPrice = data.quantity > 0 ? data.totalCost / data.quantity : 0; // simplistic
    finalHoldings.push({
      id: crypto.randomUUID(),
      userId,
      stockId,
      quantity: data.quantity,
      avgBuyPrice: avgBuyPrice,
    });
  }
  for (let i = 0; i < finalHoldings.length; i += BATCH_SIZE) {
    await prisma.holding.createMany({ data: finalHoldings.slice(i, i + BATCH_SIZE) });
  }
  console.log(`Inserted ${finalHoldings.length} holding records.`);

  console.log('Data generation complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
