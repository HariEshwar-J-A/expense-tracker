const pdf = require("pdf-parse");
const axios = require("axios");
const FormData = require("form-data");

/**
 * Parse text content to extract receipt information
 * @param {string} text - Extracted text from PDF or OCR
 * @returns {object} Parsed receipt data
 */
const parseText = (text) => {


  // Common patterns
  const patterns = {
    // YYYY-MM-DD, MM/DD/YYYY, DD-MMM-YYYY, etc.
    date: /\b(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-[A-Za-z]{3}-\d{4})\b/g,

    // Enhanced amount patterns - look for TOTAL or AMOUNT keywords
    totalAmount:
      /(?:total|amount|sum|balance|grand\s+total|net\s+total|sub[\s-]?total)[\s:$]*\$?\s*(\d{1,3}(?:,?\d{3})*\.?\d{0,2})/gi,

    // Regular amount patterns: $XX.XX or XX.XX CAD
    amount:
      /[\$£€](\d{1,3}(?:,?\d{3})*\.\d{2})|(\d{1,3}(?:,?\d{3})*\.\d{2})\s*(?:USD|CAD|EUR)/g,

    // Looser amount pattern for fallback
    looseAmount: /\$?\s*(\d{1,3}(?:,\d{3})*\.\d{2})/g,

    // Vendor guessing is hard, often the first line or capitalized words
    vendor: /^[^\d\s].{3,30}$/m, // Basic guess: first significant line
  };

  /**
   * Normalize various date formats to YYYY-MM-DD
   * @param {string} dateStr - Date string in various formats
   * @returns {string} Date in YYYY-MM-DD format
   */
  const normalizeDate = (dateStr) => {
    try {
      // Replace / with - for consistency
      let normalized = dateStr.replace(/\//g, "-");

      // Check format and convert to YYYY-MM-DD
      const parts = normalized.split("-");

      if (parts.length === 3) {
        // Case 1: YYYY-MM-DD (already correct)
        if (parts[0].length === 4) {
          return normalized;
        }

        // Case 2: MM-DD-YYYY or DD-MM-YYYY (need to guess)
        // We'll assume MM-DD-YYYY (US format)
        if (parts[2].length === 4) {
          const [mm, dd, yyyy] = parts;
          return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
        }

        // Case 3: DD-MM-YY or MM-DD-YY (two digit year)
        // Assume 20xx for years 00-29, 19xx for 30-99
        if (parts[2].length === 2) {
          const [mm, dd, yy] = parts;
          const yyyy = parseInt(yy) < 30 ? `20${yy}` : `19${yy}`;
          return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
        }
      }

      // Fallback: try to parse as Date object
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, "0");
        const day = String(parsed.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }

      // If all else fails, return the normalized string
      return normalized;
    } catch (error) {
      console.error("Date normalization error:", error);
      return dateStr;
    }
  };

  // Extract Date
  let date = null;
  const dateMatch = text.match(patterns.date);
  if (dateMatch) {

    // Take the first one found
    const rawDate = dateMatch[0];


    // Normalize to YYYY-MM-DD format for HTML date inputs
    date = normalizeDate(rawDate);

  } else {

  }

  // Extract Amount - Try multiple strategies
  let amount = null;
  let maxAmount = 0.0;
  const allAmounts = [];

  // STRATEGY 1: Look for TOTAL/AMOUNT keywords (highest priority)

  let totalMatch;
  patterns.totalAmount.lastIndex = 0;

  while ((totalMatch = patterns.totalAmount.exec(text)) !== null) {
    const valStr = totalMatch[1].replace(/,/g, "");
    const val = parseFloat(valStr);
    if (!isNaN(val) && val > 0) {

      allAmounts.push(val);
      if (val > maxAmount) {
        maxAmount = val;
      }
    }
  }

  // STRATEGY 2: Standard amount patterns with currency symbols
  if (allAmounts.length === 0) {

    let match;
    patterns.amount.lastIndex = 0;

    while ((match = patterns.amount.exec(text)) !== null) {
      const valStr = match[1] || match[2];
      const val = parseFloat(valStr.replace(/,/g, ""));
      if (!isNaN(val) && val > 0) {

        allAmounts.push(val);
        if (val > maxAmount) {
          maxAmount = val;
        }
      }
    }
  }

  // STRATEGY 3: Loose pattern fallback
  if (allAmounts.length === 0) {

    let looseMatch;
    patterns.looseAmount.lastIndex = 0;

    while ((looseMatch = patterns.looseAmount.exec(text)) !== null) {
      const valStr = looseMatch[1].replace(/,/g, "");
      const val = parseFloat(valStr);
      // Only accept reasonable amounts (not years, IDs, etc)
      if (!isNaN(val) && val > 0 && val < 10000) {

        allAmounts.push(val);
        if (val > maxAmount) {
          maxAmount = val;
        }
      }
    }
  }

  if (maxAmount > 0) {
    amount = maxAmount.toFixed(2);
  } else {
  }

  // Extract Vendor (Heuristic: First non-empty line that isn't a date or amount)
  let vendor = null;
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2);


  for (let i = 0; i < lines.length && i < 20; i++) {
    const line = lines[i];
    // Ignore if looks like date or amount
    if (patterns.date.test(line)) {

      continue;
    }
    if (patterns.amount.test(line)) {

      continue;
    }
    // Ignore common PDF artifacts
    if (
      line.toLowerCase().includes("page") ||
      line.toLowerCase().includes("invoice")
    ) {

      continue;
    }

    vendor = line; // Take first plausible candidate

    break;
  }

  if (!vendor) {

  }

  return {
    vendor,
    date,
    amount,
    category: "Other", // Default
  };
};

/**
 * Extract text from PDF or Image using OCR.space API
 * @param {Buffer} buffer - File buffer
 * @param {string} [mimeType="application/pdf"] - Mime type of the file
 * @returns {Promise<string>} Extracted text
 */
const parseWithOCR = async (buffer, mimeType = "application/pdf") => {


  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    throw new Error("OCR_SPACE_API_KEY not configured in .env file");
  }

  try {
    // Convert buffer to base64
    const base64 = buffer.toString("base64");
    const base64String = `data:${mimeType};base64,${base64}`;

    // Prepare form data
    const formData = new FormData();
    formData.append("base64Image", base64String);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "2"); // Engine 2 for better accuracy



    const response = await axios.post(
      "https://api.ocr.space/parse/image",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          apikey: apiKey,
        },
        timeout: 60000, // 60 second timeout (increased for slow API/large files)
      },
    );

    if (response.data.IsErroredOnProcessing) {
      const errorMsg = response.data.ErrorMessage?.[0] || "Unknown OCR error";
      throw new Error(`OCR processing failed: ${errorMsg}`);
    }

    if (
      !response.data.ParsedResults ||
      response.data.ParsedResults.length === 0
    ) {
      throw new Error("No text found in file by OCR");
    }

    const extractedText = response.data.ParsedResults[0].ParsedText || "";


    return extractedText;
  } catch (error) {
    if (error.response) {
      console.error(
        "❌ OCR API Error:",
        error.response.status,
        error.response.data,
      );
      throw new Error(
        `OCR API failed: ${error.response.data?.ErrorMessage || error.message}`,
      );
    }
    throw error;
  }
};

/**
 * Main receipt parsing function with intelligent fallback
 * @param {Buffer} buffer - File buffer
 * @param {string} [mimeType] - Optional mime type if known (e.g. from multer)
 * @returns {Promise<object>} Parsed receipt data
 */
const parseReceipt = async (buffer, mimeType) => {
  try {
    let text = "";

    // Helper to detect if buffer is likely PDF
    const isPdf = (buf) => {
      // PDF signature is %PDF- at the start
      return buf.slice(0, 4).toString() === "%PDF";
    };

    if (isPdf(buffer)) {
      // STEP 1: Try pdf-parse first for PDFs (fast, free, no API calls)
      try {
        const data = await pdf(buffer);
        text = data.text;
      } catch (pdfError) {
        console.warn("pdf-parse failed, falling back to OCR", pdfError.message);
      }
    }

    // Checking if we got meaningful text from pdf-parse
    const MIN_TEXT_LENGTH = 50;

    // If it was a clean PDF parse, use it.
    if (text.length >= MIN_TEXT_LENGTH) {
      return parseText(text);
    }

    // STEP 2: Fallback to OCR (for images or scanned PDFs)
    if (!process.env.OCR_SPACE_API_KEY) {
      return {
        vendor: null,
        date: null,
        amount: null,
        category: "Other",
        error:
          "File detected but OCR not configured. Get API key at https://ocr.space/ocrapi",
      };
    }

    // Determine mime type if not provided
    if (!mimeType) {
      if (isPdf(buffer)) mimeType = "application/pdf";
      else mimeType = "image/png"; // Default to png for images if unknown, OCR API is usually lenient
    }

    // Use OCR.space API
    const ocrText = await parseWithOCR(buffer, mimeType);
    const result = parseText(ocrText);

    return result;
  } catch (error) {
    console.error("\n❌ Parse Error:", error.message);
    console.error("Stack:", error.stack);
    throw new Error(`Failed to parse receipt: ${error.message}`);
  }
};

module.exports = { parseReceipt };
