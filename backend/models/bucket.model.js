import mongoose from "mongoose";
import tradingSchema from "./trading.model.js";

const bucketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Ensures each bucket has a unique name
    },
    trades: [tradingSchema], // Array of embedded Trading documents
    totalProfitAndLoss: {
      type: Number,
      default: 0, // Will be calculated via a hook
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt for the bucket
  }
);

// Pre-save hook to calculate totalProfitAndLoss for the bucket
bucketSchema.pre("save", function (next) {
  // Sum the profitAndLoss of all trades in the bucket
  this.totalProfitAndLoss = this.trades.reduce(
    (sum, trade) => sum + trade.profitAndLoss,
    0
  );
  next();
});

// Create the Bucket model
const Bucket = mongoose.model("Bucket", bucketSchema);

export default Bucket;
