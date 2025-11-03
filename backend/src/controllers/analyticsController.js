import Order from '../models/Order.js';
import Product from '../models/Product.js';

const buildFilters = (query) => {
  const { start, end, status, paymentMethod, category, cashier } = query;
  const filters = {};

  if (start || end) {
    filters.createdAt = {};
    if (start) filters.createdAt.$gte = new Date(start);
    if (end) filters.createdAt.$lte = new Date(end);
  }

  if (status) filters.status = status;
  if (paymentMethod) filters.paymentMethod = paymentMethod;
  if (cashier) filters.cashier = cashier;

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

    const [result] = await Order.aggregate(pipeline);
    res.json(result || { revenue: 0, cogs: 0, grossProfit: 0, grossMarginPct: 0, discountTotal: 0, discountRate: 0, ordersCount: 0 });
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


