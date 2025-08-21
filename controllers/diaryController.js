const Diary = require('../models/Diary');

// Helper to normalize date (set to 00:00:00 UTC for consistent querying)
function startOfDayUTC(dateStr) {
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfDayUTC(dateStr) {
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

exports.listByMonth = async (req, res, next) => {
  try {
    const { year, month } = req.query; // month: 1-12
    if (!year || !month) return res.status(400).json({ error: 'year and month are required' });
    const y = parseInt(year, 10);
    const m = parseInt(month, 10) - 1;
    const from = new Date(Date.UTC(y, m, 1));
    const to = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));

    const entries = await Diary.find({ date: { $gte: from, $lte: to } }).sort({ date: 1, createdAt: 1 });
    res.json(entries);
  } catch (err) {
    next(err);
  }
};

exports.listByDate = async (req, res, next) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) return res.status(400).json({ error: 'date is required' });
    const entries = await Diary.find({ date: { $gte: startOfDayUTC(date), $lte: endOfDayUTC(date) } }).sort({ createdAt: 1 });
    res.json(entries);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const entry = await Diary.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Not found' });
    res.json(entry);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { date, title, content, mood, tags } = req.body;
    if (!date || !content) return res.status(400).json({ error: 'date and content are required' });
    const entry = await Diary.create({
      date: startOfDayUTC(date),
      title: title || '',
      content,
      mood: mood || 'neutral',
      tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : [])
    });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { title, content, mood, tags } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (mood !== undefined) update.mood = mood;
    if (tags !== undefined) update.tags = Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : []);

    const entry = await Diary.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!entry) return res.status(404).json({ error: 'Not found' });
    res.json(entry);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const entry = await Diary.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
