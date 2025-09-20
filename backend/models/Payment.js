// models/Payment.js
import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    amount: { type: Number }, // in cents
    currency: { type: String },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    customer_email: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
});


const Payment =  mongoose.model("Payment", PaymentSchema);
export default Payment

// export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
