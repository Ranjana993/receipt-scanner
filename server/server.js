require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Tesseract = require('tesseract.js');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Multer file upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 🧠 Helper: parse raw OCR text to structured data
function parseTextToReceipt(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  // Merchant: first non-empty line
  const merchant = lines[0] || 'N/A';

  // Address: next 1-4 lines until a keyword or a line with a number
  let addressLines = [];
  for (let i = 1; i < Math.min(lines.length, 6); i++) {
    if (
      /(invoice|tab|date|slip|host|cashier|qty|desc|amount|amt|subtotal|total|tax|balance|vat|cash|change|\\d{2}[\\/\\-]\\d{2}[\\/\\-]\\d{2,4})/i.test(lines[i]) ||
      /\d/.test(lines[i])
    ) break;
    addressLines.push(lines[i]);
  }
  const address = addressLines.join(', ');

  // Date: try multiple patterns
  let date = null;
  for (const line of lines) {
    const match = line.match(/\\d{2}[\\/\\-\\.]\\d{2}[\\/\\-\\.]\\d{2,4}/);
    if (match) { date = match[0]; break; }
    const altMatch = line.match(/\\d{4}[\\/\\-\\.]\\d{2}[\\/\\-\\.]\\d{2}/);
    if (altMatch) { date = altMatch[0]; break; }
  }

  // Totals: look for keywords
  const findAmount = (keyword) => {
    const line = lines.find(l => new RegExp(keyword, 'i').test(l) && /\\d+\\.\\d{2}/.test(l));
    if (line) {
      const match = line.match(/(\\d+\\.\\d{2})/);
      if (match) return match[1];
    }
    return null;
  };
  const subtotal = findAmount('subtotal');
  const tax = findAmount('tax');
  const total = findAmount('grand\\s*total|total|balance');

  // Items: lines with price at end, optionally quantity at start
  const items = [];
  for (const line of lines) {
    // Clean up line: remove leading/trailing non-alphanum, fix common OCR mistakes
    let cleanLine = line.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '').trim();
    cleanLine = cleanLine.replace(/S(?=\d)/g, '9'); // S4.66 -> 94.66
    cleanLine = cleanLine.replace(/\$/g, ''); // Remove dollar sign if any

    // Skip lines that are weights or details
    if (/^\d+\.\d+\s*kg/i.test(cleanLine) || /NET|@|kg|ka|\/kg|\/ka/i.test(cleanLine)) continue;

    // Try: [desc] [$][price] (price at end, with or without $)
    let itemMatch = cleanLine.match(/^(.+?)\s*(\d+\.\d{2})$/);
    if (itemMatch) {
      items.push({
        quantity: '1',
        description: itemMatch[1].trim(),
        amount: itemMatch[2]
      });
    }
  }

  return {
    merchant,
    address,
    date,
    subtotal,
    tax,
    total,
    items
  };
}

// POST /api/process-receipt
app.post('/api/process-receipt', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Perform OCR using Tesseract.js
    const result = await Tesseract.recognize(
      req.file.path,
      'eng',
      {
        logger: m => console.log(m)
      }
    );

    // Delete temp image file
    fs.unlinkSync(req.file.path);

    // Parse the OCR text into structured receipt data
    const parsedReceipt = parseTextToReceipt(result.data.text);

    res.json({
      success: true,
      rawText: result.data.text,
      parsedReceipt
    });

  } catch (error) {
    console.error('Error processing receipt:', error);

    // Delete file if it still exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({ error: 'Error processing receipt' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
