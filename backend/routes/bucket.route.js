import express from "express";
import Bucket from "../models/bucket.model.js";
import Trading from "../models/trading.model.js";

// Router for bucket routes
const bucketRouter = express.Router();

// Function to validate trade data
const validateTradeData = (trade) => {
  const requiredFields = ["instrument", "qty", "avg", "ltp", "status"];
  const errors = [];

  // Check for required fields
  requiredFields.forEach((field) => {
    if (trade[field] === undefined || trade[field] === null) {
      errors.push(`${field} is required`);
    }
  });

  // Additional validation for sellPrice based on status
  if (
    trade.status === "closed" &&
    (trade.sellPrice === undefined || trade.sellPrice === null)
  ) {
    errors.push("sellPrice is required for closed positions");
  }
  if (
    trade.status === "open" &&
    trade.sellPrice !== undefined &&
    trade.sellPrice !== null
  ) {
    errors.push("sellPrice must be null for open positions");
  }

  // Validate status value
  if (trade.status && !["open", "closed"].includes(trade.status)) {
    errors.push('status must be either "open" or "closed"');
  }

  return errors;
};

// POST endpoint to create a new bucket
bucketRouter.post("/", async (req, res) => {
  try {
    const { name, trades = [] } = req.body;

    // Validate bucket name
    if (!name) {
      return res.status(400).json({
        message: "Bucket name is required",
      });
    }

    // Validate each trade if trades are provided
    if (trades.length > 0) {
      const tradeErrors = [];
      trades.forEach((trade, index) => {
        const errors = validateTradeData(trade);
        if (errors.length > 0) {
          tradeErrors.push(`Trade ${index}: ${errors.join(", ")}`);
        }
      });

      if (tradeErrors.length > 0) {
        return res.status(400).json({
          message: "Validation errors in trades",
          errors: tradeErrors,
        });
      }
    }

    // Create a new Bucket instance
    const bucket = new Bucket({ name, trades });

    // Save the bucket (triggers pre-save hook)
    const savedBucket = await bucket.save();

    res.status(201).json({
      message: "Bucket created successfully",
      bucket: savedBucket,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error creating bucket",
      error: error.message,
    });
  }
});

// POST endpoint to add a trade to an existing bucket
bucketRouter.post("/:bucketId/trades", async (req, res) => {
  try {
    const { bucketId } = req.params;
    const tradeData = req.body;

    console.log(tradeData);
    console.log(bucketId);

    // Validate trade data
    const tradeErrors = validateTradeData(tradeData);
    if (tradeErrors.length > 0) {
      return res.status(400).json({
        message: "Validation errors in trade data",
        errors: tradeErrors,
      });
    }

    console.log(tradeErrors);

    // Find the bucket by ID
    const bucket = await Bucket.findById(bucketId);
    if (!bucket) {
      console.log("bucket not found");
      return res.status(404).json({
        message: "Bucket not found",
      });
    }

    // Add the new trade to the trades array
    bucket.trades.push(tradeData);

    // Save the bucket (triggers pre-save hook)
    const updatedBucket = await bucket.save();

    res.status(201).json({
      message: "Trade added successfully",
      bucket: updatedBucket,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: "Error adding trade",
      error: error.message,
    });
  }
});

// GET endpoint to retrieve all buckets
bucketRouter.get("/", async (req, res) => {
  try {
    // Fetch all buckets from the database
    const buckets = await Bucket.find();

    // If no buckets exist, return an empty array with a message
    if (!buckets || buckets.length === 0) {
      return res.status(200).json({
        message: "No buckets found",
        buckets: [],
      });
    }

    // Return the buckets
    res.status(200).json({
      message: "Buckets retrieved successfully",
      buckets,
    });
  } catch (error) {
    // Handle any errors (e.g., database connection issues)
    res.status(500).json({
      message: "Error retrieving buckets",
      error: error.message,
    });
  }
});

bucketRouter.put("/:bucketId/trades/:tradeId", async (req, res) => {
  try {
    const { bucketId, tradeId } = req.params;
    const tradeData = req.body;

    const bucket = await Bucket.findById(bucketId);
    if (!bucket) {
      return res.status(404).json({ message: "Bucket not found" });
    }

    const trade = bucket.trades.id(tradeId);
    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    trade.instrument = tradeData.instrument;
    trade.qty = tradeData.qty;
    trade.avg = tradeData.avg;
    trade.ltp = tradeData.ltp;
    trade.status = tradeData.status;
    trade.sellPrice = tradeData.status === "open" ? null : tradeData.sellPrice;

    const updatedBucket = await bucket.save();
    res
      .status(200)
      .json({ message: "Trade updated successfully", bucket: updatedBucket });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating trade", error: error.message });
  }
});
export default bucketRouter;
