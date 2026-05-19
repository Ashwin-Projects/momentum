const prisma = require('../utils/prisma');
const { getStartOfDay, syncDailyTargetActuals } = require('../services/dailyTargetSyncService');

const FOOD_LOOKUP_TTL_MS = 6 * 60 * 60 * 1000;
const nutritionLookupCache = new Map();

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getNutritionLookup = async (req, res) => {
  try {
    const food = typeof req.query.food === 'string' ? req.query.food.trim() : '';
    if (!food) {
      return res.status(400).json({ success: false, error: 'food query parameter is required' });
    }

    const cacheKey = food.toLowerCase();
    const cached = nutritionLookupCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({
        success: true,
        data: cached.value,
        message: 'Nutrition lookup retrieved successfully'
      });
    }

    const searchParams = new URLSearchParams({
      search_terms: food,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '20'
    });

    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${searchParams.toString()}`);
    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: 'Failed to fetch nutrition data from Open Food Facts'
      });
    }

    const payload = await response.json();
    const products = Array.isArray(payload.products) ? payload.products : [];

    const match = products.find((product) => {
      const nutriments = product.nutriments || {};
      return toNumberOrNull(nutriments['energy-kcal_100g']) !== null;
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Food not found'
      });
    }

    const nutriments = match.nutriments || {};
    const lookupResult = {
      query: food,
      matchedFood: match.product_name || match.product_name_en || match.generic_name || food,
      per100g: {
        calories: toNumberOrNull(nutriments['energy-kcal_100g']),
        protein: toNumberOrNull(nutriments.proteins_100g) || 0,
        carbs: toNumberOrNull(nutriments.carbohydrates_100g) || 0,
        fat: toNumberOrNull(nutriments.fat_100g) || 0
      }
    };

    nutritionLookupCache.set(cacheKey, {
      value: lookupResult,
      expiresAt: Date.now() + FOOD_LOOKUP_TTL_MS
    });

    res.json({
      success: true,
      data: lookupResult,
      message: 'Nutrition lookup retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET - Get all nutrition logs for user
const getNutritionLogs = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const userId = req.user.id;

    const where = { userId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.loggedAt = { gte: startOfDay, lte: endOfDay };
    } else if (startDate && endDate) {
      where.loggedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const logs = await prisma.nutritionLog.findMany({
      where,
      orderBy: { loggedAt: 'desc' }
    });

    res.json({
      success: true,
      data: logs,
      message: 'Nutrition logs retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST - Create a new nutrition log
const createNutritionLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mealType, foodName, calories, proteinGrams, carbsGrams, fatGrams, loggedAt, dailyTargetId } = req.body;

    if (!mealType || !foodName || calories === undefined || !loggedAt) {
      return res.status(400).json({
        success: false,
        error: 'mealType, foodName, calories, and loggedAt are required'
      });
    }

    const logDate = new Date(loggedAt);

    const log = await prisma.nutritionLog.create({
      data: {
        userId,
        mealType,
        foodName,
        calories,
        proteinGrams: proteinGrams || null,
        carbsGrams: carbsGrams || null,
        fatGrams: fatGrams || null,
        loggedAt: logDate,
        dailyTargetId: dailyTargetId || null
      }
    });

    await syncDailyTargetActuals(userId, logDate);

    res.status(201).json({
      success: true,
      data: log,
      message: 'Nutrition log created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH - Update a nutrition log
const updateNutritionLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.nutritionLog.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Nutrition log not found' });
    }

    const { mealType, foodName, calories, proteinGrams, carbsGrams, fatGrams, loggedAt } = req.body;

    const previousDate = existing.loggedAt;

    const log = await prisma.nutritionLog.update({
      where: { id },
      data: {
        ...(mealType !== undefined && { mealType }),
        ...(foodName !== undefined && { foodName }),
        ...(calories !== undefined && { calories }),
        ...(proteinGrams !== undefined && { proteinGrams }),
        ...(carbsGrams !== undefined && { carbsGrams }),
        ...(fatGrams !== undefined && { fatGrams }),
        ...(loggedAt !== undefined && { loggedAt: new Date(loggedAt) })
      }
    });

    await syncDailyTargetActuals(userId, previousDate);
    if (getStartOfDay(previousDate).getTime() !== getStartOfDay(log.loggedAt).getTime()) {
      await syncDailyTargetActuals(userId, log.loggedAt);
    }

    res.json({
      success: true,
      data: log,
      message: 'Nutrition log updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE - Delete a nutrition log
const deleteNutritionLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.nutritionLog.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Nutrition log not found' });
    }

    await prisma.nutritionLog.delete({ where: { id } });
    await syncDailyTargetActuals(userId, existing.loggedAt);

    res.json({
      success: true,
      message: 'Nutrition log deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getNutritionLookup,
  getNutritionLogs,
  createNutritionLog,
  updateNutritionLog,
  deleteNutritionLog
};
