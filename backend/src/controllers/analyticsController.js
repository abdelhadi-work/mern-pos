import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Expense from '../models/Expense.js';

const buildFilters = (query) => {
  const { start, end, status, paymentMethod, category, cashier, branch } = query;
  const filters = {};

  if (start || end) {
    filters.createdAt = {};
    if (start) filters.createdAt.$gte = new Date(start);
    if (end) filters.createdAt.$lte = new Date(end);
  }

  if (status) filters.status = status;
  if (paymentMethod) filters.paymentMethod = paymentMethod;
  if (cashier) filters.cashier = cashier;
  if (branch) filters.branch = branch;

  // Category filter via items.product -> Product.category
  if (category) filters['items.productCategory'] = category; // used after $lookup mapping

  return filters;
};

export const getSummary = async (req, res) => {
  try {
    const match = buildFilters(req.query);

    // Build pipeline, join product categories only if category filter present
    const pipeline = [];
    pipeline.push({ $match: match });

    // If category filter specified, we need to attach product category to each item
    if (req.query.category) {
      pipeline.push(
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
        { $addFields: { items: { $mergeObjects: ['$items', { productCategory: { $arrayElemAt: ['$p.category', 0] } }] } } },
        { $group: {
            _id: '$_id',
            doc: { $first: '$$ROOT' },
            items: { $push: '$items' }
        } },
        { $replaceRoot: { newRoot: { $mergeObjects: ['$doc', { items: '$items' }] } } }
      );
      // Re-apply match including derived field
      pipeline.unshift({ $match: buildFilters(req.query) });
    }

    pipeline.push(
      {
        $addFields: {
          itemsCount: { $sum: '$items.quantity' }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
          ordersCount: { $sum: 1 },
          itemsTotal: { $sum: '$itemsCount' },
          taxCollected: { $sum: '$tax.amount' }
        }
      },
      {
        $project: {
          _id: 0,
          revenue: 1,
          ordersCount: 1,
          avgTicket: { $cond: [{ $gt: ['$ordersCount', 0] }, { $divide: ['$revenue', '$ordersCount'] }, 0] },
          itemsPerOrder: { $cond: [{ $gt: ['$ordersCount', 0] }, { $divide: ['$itemsTotal', '$ordersCount'] }, 0] },
          taxCollected: 1
        }
      }
    );

    const [result] = await Order.aggregate(pipeline);
    res.json(result || { revenue: 0, ordersCount: 0, avgTicket: 0, itemsPerOrder: 0, taxCollected: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTimeseries = async (req, res) => {
  try {
    const { start, end, interval = 'auto' } = req.query;
    const match = buildFilters(req.query);

    // Decide granularity
    let bucket = '%Y-%m-%d';
    if (interval === 'week') bucket = '%G-%V';
    if (interval === 'month') bucket = '%Y-%m';
    if (interval === 'auto' && start && end) {
      const ms = new Date(end) - new Date(start);
      const days = ms / (1000 * 60 * 60 * 24);
      if (days <= 31) bucket = '%Y-%m-%d';
      else if (days <= 180) bucket = '%G-%V';
      else bucket = '%Y-%m';
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: bucket, date: '$createdAt' } },
          sales: { $sum: '$total' },
          orders: { $sum: 1 },
          tax: { $sum: '$tax.amount' }
        }
      },
      { $project: { _id: 0, date: '$_id', sales: 1, orders: 1, tax: 1 } },
      { $sort: { date: 1 } }
    ];

    const buckets = await Order.aggregate(pipeline);

    if (req.query.export === 'csv') {
      const rows = [['date','sales','orders','tax'], ...buckets.map(b => [b.date, b.sales, b.orders, b.tax])];
      const csv = rows.map(r => r.join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="timeseries.csv"');
      return res.status(200).send(csv);
    }

    res.json({ buckets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPaymentMix = async (req, res) => {
  try {
    const match = buildFilters(req.query);

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$paymentMethod',
          amount: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $project: { _id: 0, method: '$_id', amount: 1, count: 1 } },
      { $sort: { amount: -1 } }
    ];

    const methods = await Order.aggregate(pipeline);
    res.json({ methods });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOrdersList = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const numericLimit = Math.min(parseInt(limit, 10) || 10, 100);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);

    const match = buildFilters(req.query);
    const cursor = Order.find(match)
      .sort({ createdAt: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit)
      .populate('cashier', 'fullName username')
      .select('orderNumber total status paymentMethod createdAt subtotal tax.amount items.length');

    const [items, total] = await Promise.all([
      cursor.exec(),
      Order.countDocuments(match)
    ]);

    if (req.query.export === 'csv') {
      const header = ['orderNumber','status','paymentMethod','cashier','total','createdAt'];
      const rows = items.map(o => [
        o.orderNumber,
        o.status,
        o.paymentMethod,
        (o.cashier && (o.cashier.fullName || o.cashier.username)) || '',
        o.total,
        o.createdAt?.toISOString?.() || ''
      ]);
      const csv = [header, ...rows].map(r => r.join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
      return res.status(200).send(csv);
    }

    res.json({
      page: numericPage,
      limit: numericLimit,
      total,
      items
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProfitSummary = async (req, res) => {
  try {
    const match = buildFilters(req.query);
    // Only completed by default for profit if not provided
    if (!match.status) match.status = 'completed';

    const pipeline = [
      { $match: match },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'prod'
        }
      },
      { $addFields: { costPrice: { $ifNull: [{ $arrayElemAt: ['$prod.costPrice', 0] }, 0] } } },
      {
        $group: {
          _id: '$_id',
          orderTotal: { $first: '$total' },
          discountAmt: { $first: '$discount.amount' },
          cogsOrder: { $sum: { $multiply: ['$items.quantity', '$costPrice'] } }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$orderTotal' },
          cogs: { $sum: '$cogsOrder' },
          discountTotal: { $sum: { $ifNull: ['$discountAmt', 0] } },
          ordersCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          revenue: 1,
          cogs: 1,
          grossProfit: { $subtract: ['$revenue', '$cogs'] },
          grossMarginPct: {
            $cond: [
              { $gt: ['$revenue', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$revenue', '$cogs'] }, '$revenue'] }, 100] },
              0
            ]
          },
          discountTotal: 1,
          discountRate: {
            $cond: [
              { $gt: ['$revenue', 0] },
              { $multiply: [{ $divide: ['$discountTotal', '$revenue'] }, 100] },
              0
            ]
          },
          ordersCount: 1
        }
      }
    ];

    const [ordersResult] = await Order.aggregate(pipeline);

    const expenseFilters = {};
    if (req.query.start || req.query.end) {
      expenseFilters.date = {};
      if (req.query.start) expenseFilters.date.$gte = new Date(req.query.start);
      if (req.query.end) expenseFilters.date.$lte = new Date(req.query.end);
    }
    if (req.query.branch) expenseFilters.branch = req.query.branch;
    if (req.query.expenseStatus) expenseFilters.status = req.query.expenseStatus;

    const expenseAgg = await Expense.aggregate([
      { $match: expenseFilters },
      {
        $group: {
          _id: null,
          expenses: { $sum: '$amount' },
        },
      },
    ]);

    const expensesTotal = expenseAgg?.[0]?.expenses || 0;

    const result = ordersResult || { revenue: 0, cogs: 0, grossProfit: 0, grossMarginPct: 0, discountTotal: 0, discountRate: 0, ordersCount: 0 };
    const netProfit = (result.grossProfit || 0) - expensesTotal;
    const netMarginPct = result.revenue > 0 ? (netProfit / result.revenue) * 100 : 0;

    res.json({
      ...result,
      expenses: expensesTotal,
      netProfit,
      netMarginPct,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCategoryProfit = async (req, res) => {
  try {
    const match = buildFilters(req.query);
    if (!match.status) match.status = 'completed';

    const pipeline = [
      { $match: match },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'prod'
        }
      },
      { $addFields: { product: { $arrayElemAt: ['$prod', 0] } } },
      {
        $group: {
          _id: '$product.category',
          revenue: { $sum: '$items.total' },
          qty: { $sum: '$items.quantity' },
          cogs: { $sum: { $multiply: ['$items.quantity', { $ifNull: ['$product.costPrice', 0] }] } }
        }
      },
      {
        $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' }
      },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          name: { $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, 'Uncategorized'] },
          revenue: 1,
          qty: 1,
          cogs: 1,
          grossProfit: { $subtract: ['$revenue', '$cogs'] },
          marginPct: {
            $cond: [
              { $gt: ['$revenue', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$revenue', '$cogs'] }, '$revenue'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: Math.min(parseInt(req.query.limit || '10', 10), 50) }
    ];

    const categories = await Order.aggregate(pipeline);

    if (req.query.export === 'csv') {
      const header = ['categoryId','name','revenue','qty','cogs','grossProfit','marginPct'];
      const rows = categories.map(c => [c.categoryId, c.name, c.revenue, c.qty, c.cogs, c.grossProfit, c.marginPct]);
      const csv = [header, ...rows].map(r => r.join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="category_profit.csv"');
      return res.status(200).send(csv);
    }

    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductProfit = async (req, res) => {
  try {
    const match = buildFilters(req.query);
    if (!match.status) match.status = 'completed';

    const metric = req.query.sort || 'revenue';

    const pipeline = [
      { $match: match },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'prod'
        }
      },
      { $addFields: { product: { $arrayElemAt: ['$prod', 0] } } },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          revenue: { $sum: '$items.total' },
          qty: { $sum: '$items.quantity' },
          cogs: { $sum: { $multiply: ['$items.quantity', { $ifNull: ['$product.costPrice', 0] }] } }
        }
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: 1,
          qty: 1,
          revenue: 1,
          cogs: 1,
          grossProfit: { $subtract: ['$revenue', '$cogs'] },
          marginPct: {
            $cond: [
              { $gt: ['$revenue', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$revenue', '$cogs'] }, '$revenue'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { [metric]: -1 } },
      { $limit: Math.min(parseInt(req.query.limit || '10', 10), 50) }
    ];

    const products = await Order.aggregate(pipeline);

    if (req.query.export === 'csv') {
      const header = ['productId','name','qty','revenue','cogs','grossProfit','marginPct'];
      const rows = products.map(p => [p.productId, p.name, p.qty, p.revenue, p.cogs, p.grossProfit, p.marginPct]);
      const csv = [header, ...rows].map(r => r.join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="product_profit.csv"');
      return res.status(200).send(csv);
    }

    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getInventoryMetrics = async (req, res) => {
  try {
    const { branch } = req.query;
    const branchFilter = branch ? { branch } : {};

    // Get current stock value
    const stockPipeline = [
      { $match: { ...branchFilter, isActive: true } },
      {
        $group: {
          _id: null,
          stockValue: { $sum: { $multiply: ['$stock', { $ifNull: ['$costPrice', 0] }] } },
          itemsCount: { $sum: 1 },
          totalUnits: { $sum: '$stock' }
        }
      }
    ];

    const [stockResult] = await Product.aggregate(stockPipeline);
    const currentStockValue = stockResult?.stockValue || 0;
    const itemsCount = stockResult?.itemsCount || 0;
    const totalUnits = stockResult?.totalUnits || 0;

    // Get COGS for the period (last 30 days for turnover calculation)
    const { start, end } = req.query;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const cogsMatch = {
      status: 'completed',
      createdAt: {
        $gte: start ? new Date(start) : thirtyDaysAgo,
        $lte: end ? new Date(end) : new Date()
      }
    };
    if (branch) cogsMatch.branch = branch;

    const cogsPipeline = [
      { $match: cogsMatch },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'prod'
        }
      },
      {
        $group: {
          _id: null,
          cogs: { $sum: { $multiply: ['$items.quantity', { $ifNull: [{ $arrayElemAt: ['$prod.costPrice', 0] }, 0] }] } }
        }
      }
    ];

    const [cogsResult] = await Order.aggregate(cogsPipeline);
    const cogs = cogsResult?.cogs || 0;

    // Calculate metrics
    const avgInventoryValue = currentStockValue; // Simplified: using current as average
    const inventoryTurnover = avgInventoryValue > 0 ? cogs / avgInventoryValue : 0;
    const daysOfInventory = inventoryTurnover > 0 ? 365 / inventoryTurnover : 0;

    res.json({
      currentStockValue,
      itemsCount,
      totalUnits,
      cogs,
      avgInventoryValue,
      inventoryTurnover: parseFloat(inventoryTurnover.toFixed(2)),
      daysOfInventory: parseFloat(daysOfInventory.toFixed(1))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cashflow Analysis
export const getCashflowAnalysis = async (req, res) => {
  try {
    const match = buildFilters(req.query);
    if (!match.status) match.status = 'completed';

    const { branch } = req.query;

    // Daily cash inflows from orders
    const inflowPipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            paymentMethod: '$paymentMethod'
          },
          amount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ];

    const inflows = await Order.aggregate(inflowPipeline);

    // Daily cash outflows from expenses
    const expenseMatch = {
      date: {
        $gte: match.createdAt?.$gte || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        $lte: match.createdAt?.$lte || new Date()
      }
    };
    if (branch) expenseMatch.branch = branch;

    const outflowPipeline = [
      { $match: expenseMatch },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            category: '$category'
          },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ];

    const outflows = await Expense.aggregate(outflowPipeline);

    // Aggregate by date
    const dailyFlow = {};
    inflows.forEach(({ _id, amount }) => {
      if (!dailyFlow[_id.date]) dailyFlow[_id.date] = { date: _id.date, inflow: 0, outflow: 0, net: 0 };
      dailyFlow[_id.date].inflow += amount;
    });
    outflows.forEach(({ _id, amount }) => {
      if (!dailyFlow[_id.date]) dailyFlow[_id.date] = { date: _id.date, inflow: 0, outflow: 0, net: 0 };
      dailyFlow[_id.date].outflow += amount;
    });

    // Calculate net and cumulative
    let cumulative = 0;
    const timeline = Object.values(dailyFlow).map(day => {
      day.net = day.inflow - day.outflow;
      cumulative += day.net;
      day.cumulative = cumulative;
      return day;
    });

    // Summary metrics
    const totalInflow = timeline.reduce((sum, d) => sum + d.inflow, 0);
    const totalOutflow = timeline.reduce((sum, d) => sum + d.outflow, 0);
    const netCashflow = totalInflow - totalOutflow;
    const avgDailyInflow = timeline.length > 0 ? totalInflow / timeline.length : 0;
    const avgDailyOutflow = timeline.length > 0 ? totalOutflow / timeline.length : 0;
    const burnRate = avgDailyOutflow;
    const runway = netCashflow > 0 && burnRate > 0 ? netCashflow / burnRate : 0;

    res.json({
      timeline,
      summary: {
        totalInflow,
        totalOutflow,
        netCashflow,
        avgDailyInflow,
        avgDailyOutflow,
        burnRate,
        runwayDays: parseFloat(runway.toFixed(1))
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Comparative Analytics (Period over Period)
export const getComparativeAnalytics = async (req, res) => {
  try {
    const { start, end, branch } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ message: 'start and end dates required' });
    }

    const currentStart = new Date(start);
    const currentEnd = new Date(end);
    const daysDiff = Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24));

    // Previous period (same duration)
    const prevEnd = new Date(currentStart);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - daysDiff);

    const buildPeriodMatch = (startDate, endDate) => {
      const match = {
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      };
      if (branch) match.branch = branch;
      return match;
    };

    // Current period metrics
    const currentMatch = buildPeriodMatch(currentStart, currentEnd);
    const [currentMetrics] = await Order.aggregate([
      { $match: currentMatch },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Previous period metrics
    const prevMatch = buildPeriodMatch(prevStart, prevEnd);
    const [prevMetrics] = await Order.aggregate([
      { $match: prevMatch },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const current = currentMetrics || { revenue: 0, orders: 0, avgOrderValue: 0 };
    const previous = prevMetrics || { revenue: 0, orders: 0, avgOrderValue: 0 };

    const calcChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    res.json({
      current: {
        period: { start: currentStart, end: currentEnd },
        revenue: current.revenue,
        orders: current.orders,
        avgOrderValue: current.avgOrderValue
      },
      previous: {
        period: { start: prevStart, end: prevEnd },
        revenue: previous.revenue,
        orders: previous.orders,
        avgOrderValue: previous.avgOrderValue
      },
      changes: {
        revenue: parseFloat(calcChange(current.revenue, previous.revenue).toFixed(2)),
        orders: parseFloat(calcChange(current.orders, previous.orders).toFixed(2)),
        avgOrderValue: parseFloat(calcChange(current.avgOrderValue, previous.avgOrderValue).toFixed(2))
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Alerts & Thresholds
export const getAlerts = async (req, res) => {
  try {
    const { branch } = req.query;
    const alerts = [];

    // 1. Low inventory alerts (stock < 10)
    const lowStockMatch = { stock: { $lt: 10 }, isActive: true };
    if (branch) lowStockMatch.branch = branch;
    
    const lowStockProducts = await Product.find(lowStockMatch)
      .select('name stock')
      .limit(10);
    
    lowStockProducts.forEach(p => {
      alerts.push({
        type: 'low_inventory',
        severity: p.stock === 0 ? 'critical' : p.stock < 5 ? 'high' : 'medium',
        message: `Low stock: ${p.name} (${p.stock} units)`,
        productId: p._id,
        productName: p.name,
        stock: p.stock
      });
    });

    // 2. Declining margin warning (last 7 days vs previous 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const prev14Days = new Date();
    prev14Days.setDate(prev14Days.getDate() - 14);

    const recentMatch = { status: 'completed', createdAt: { $gte: last7Days } };
    const prevMatch = { status: 'completed', createdAt: { $gte: prev14Days, $lt: last7Days } };
    if (branch) {
      recentMatch.branch = branch;
      prevMatch.branch = branch;
    }

    const calcMargin = async (match) => {
      const [result] = await Order.aggregate([
        { $match: match },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'prod'
          }
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$items.total' },
            cogs: { $sum: { $multiply: ['$items.quantity', { $ifNull: [{ $arrayElemAt: ['$prod.costPrice', 0] }, 0] }] } }
          }
        }
      ]);
      if (!result) return 0;
      return result.revenue > 0 ? ((result.revenue - result.cogs) / result.revenue) * 100 : 0;
    };

    const recentMargin = await calcMargin(recentMatch);
    const prevMargin = await calcMargin(prevMatch);
    const marginChange = recentMargin - prevMargin;

    if (marginChange < -5) {
      alerts.push({
        type: 'declining_margin',
        severity: marginChange < -10 ? 'high' : 'medium',
        message: `Gross margin declined by ${Math.abs(marginChange).toFixed(1)}% in last 7 days`,
        recentMargin: parseFloat(recentMargin.toFixed(2)),
        prevMargin: parseFloat(prevMargin.toFixed(2)),
        change: parseFloat(marginChange.toFixed(2))
      });
    }

    // 3. Expense anomaly (daily expense > 2x average)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const expenseMatch = { date: { $gte: last30Days } };
    if (branch) expenseMatch.branch = branch;

    const dailyExpenses = await Expense.aggregate([
      { $match: expenseMatch },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' }
        }
      }
    ]);

    if (dailyExpenses.length > 0) {
      const avgDaily = dailyExpenses.reduce((sum, d) => sum + d.total, 0) / dailyExpenses.length;
      const threshold = avgDaily * 2;
      const anomalies = dailyExpenses.filter(d => d.total > threshold);
      
      anomalies.slice(0, 3).forEach(a => {
        alerts.push({
          type: 'expense_anomaly',
          severity: 'medium',
          message: `High expense detected on ${a._id}: ${a.total.toFixed(2)} (avg: ${avgDaily.toFixed(2)})`,
          date: a._id,
          amount: a.total,
          avgAmount: avgDaily
        });
      });
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    res.json({ alerts, count: alerts.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


