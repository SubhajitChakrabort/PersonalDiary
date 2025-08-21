const mongoose = require('mongoose');

const DiarySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    title: { type: String, default: '' },
    content: { type: String, required: true },
    mood: { type: String, enum: ['happy', 'sad', 'neutral', 'angry', 'excited', 'tired'], default: 'neutral' },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

DiarySchema.index({ date: 1, createdAt: 1 });

module.exports = mongoose.model('Diary', DiarySchema);
