import mongoose from "mongoose";

const tradingSchema = new mongoose.Schema(
  {
    instrument: {
      type: String,
      required: true,
    },
    qty: {
      type: Number,
      required: true,
    },
    avg: {
      type: Number,
      required: true,
    },
    ltp: {
      type: Number,
      required: true,
    },
    profitAndLoss: {
      type: Number,
      required: false,
      default: 0, // Will be calculated via a hook
    },
    status: {
      type: String,
      required: true,
      enum: ["open", "closed"], // Restricts values to "open" or "closed"
    },
    sellPrice: {
      type: Number,
      required: false, // Only applicable for closed positions
      default: null, // Null if position is open
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt for each trade
  }
);

// Pre-save hook to calculate profitAndLoss
tradingSchema.pre("save", function (next) {
  // Calculate profitAndLoss based on qty (positive = long, negative = short)
  const qtyAbs = Math.abs(this.qty); // Absolute value of qty for calculation
  if (this.status === "open") {
    // For open positions: P&L = (LTP - Avg) * Qty (for long) or (Avg - LTP) * Qty (for short)
    this.profitAndLoss =
      this.qty > 0
        ? (this.ltp - this.avg) * this.qty
        : -(this.ltp - this.avg) * this.qty;
  } else if (this.status === "closed") {
    if (this.sellPrice === null) {
      return next(new Error("sellPrice is required for closed positions"));
    }
    // For closed positions: P&L = (Sell Price - Avg) * Qty (for long) or (Avg - Sell Price) * Qty (for short)
    this.profitAndLoss =
      this.qty > 0
        ? (this.sellPrice - this.avg) * this.qty
        : -(this.sellPrice - this.avg) * this.qty;
  }

  next();
});

// Validation for sellPrice
tradingSchema.path("sellPrice").validate(function (value) {
  if (this.status === "closed" && value === null) {
    return false; // Fail if closed but no sellPrice
  }
  if (this.status === "open" && value !== null) {
    return false; // Fail if open but sellPrice is set
  }
  return true;
}, "sellPrice is required for closed positions and must be null for open positions");

export default tradingSchema;
