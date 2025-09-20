import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Stripe from "stripe";
import bodyParser from "body-parser";
import Payment from './models/Payment.js'
import cors from 'cors'
dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });
app.use(
    cors({
        origin: "http://localhost:3000", 
        methods: ["GET", "POST"],
        credentials: true,
    })
);
const FRONTEND_URL = "http://localhost:3000";
const PORT = 8000;
const MONGO_URI = process.env.MONGO_URI;


app.use((req, res, next) => {
    if (req.originalUrl === "/webhook") return next();
    bodyParser.json()(req, res, next);
});

app.post("/create-checkout-session", async (req, res) => {
    try {
        // client can send { amount, currency, metadata } - amount in cents
        const { amount = 500, currency = "usd", metadata = {} } = req.body || {};

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: {
                            name: "Sample Payment",
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/cancel?session_id={CHECKOUT_SESSION_ID}`,
            metadata,
        });
        console.log("data ", session)

        await Payment.create({
            sessionId: session.id,
            amount: amount,
            currency,
            status: "pending",
            customer_email: "zuhairKhan@gmail.com",
        });

        res.json({ id: session.id });
    } catch (err) {
        console.error("create-checkout-session error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/payment-status", async (req, res) => {
    const { session_id } = req.query;
    if (!session_id) {
        console.log("payment-status: session_id missing");
        return res.status(400).json({ error: "session_id required" });
    }

    const payment = await Payment.findOne({ sessionId: session_id }).lean();
    if (!payment) {
        console.log(`payment-status: Payment not found for session_id=${session_id}`);
        return res.status(404).json({ error: "Payment not found" });
    }

    console.log(`payment-status: Found payment for session_id=${session_id} => status=${payment.status}`);
    res.json({ status: payment.status, payment });
});

/**
 * Webhook endpoint - must receive raw body
 * Configure your stripe webhook to send events to /webhook
 */
app.post(
    "/webhook",
    bodyParser.raw({ type: "application/json" }),
    async (req, res) => {
        const sig = req.headers["stripe-signature"];
        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, "whsec_342abbae0a84d4cc8e11c43091aac123a509a01579d52c3653e77b4b108e0acd");
        } catch (err) {
            console.error("Webhook signature verification failed.", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            switch (event.type) {
                case "checkout.session.completed": {
                    const session = event.data.object;
                    const sessionId = session.id;
                    const email = session.customer_details?.email || null;

                    console.log(`Webhook: checkout.session.completed received for sessionId=${sessionId}, email=${email}`);

                    const updated = await Payment.findOneAndUpdate(
                        { sessionId },
                        {
                            status: "success",
                            customer_email: email,
                            amount: session.amount_total ?? undefined,
                            currency: session.currency ?? undefined,
                        },
                        { upsert: true, new: true }
                    );

                   
                    break;
                }
             
                case "payment_intent.payment_failed": {
                    const pi = event.data.object;
                 
                    const paymentIntentId = pi.id;
                
                    const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
                    const session = sessions.data[0];
                    const sessionId = session?.id;
                    if (sessionId) {
                        await Payment.findOneAndUpdate(
                            { sessionId },
                            { status: "failed" },
                            { upsert: true }
                        );
                    } else {
                        await Payment.create({
                            sessionId: paymentIntentId,
                            amount: pi.amount,
                            currency: pi.currency,
                            status: "failed",
                            customer_email: null,
                        });
                    }
                    break;
                }

                case "checkout.session.async_payment_failed": {
                    const session = event.data.object;
                    await Payment.findOneAndUpdate({ sessionId: session.id }, { status: "failed" }, { upsert: true });
                    break;
                }
                case "checkout.session.async_payment_succeeded": {
                    const session = event.data.object;
                    await Payment.findOneAndUpdate({ sessionId: session.id }, { status: "success" }, { upsert: true });
                    break;
                }
                default:
                // console.log(`Unhandled event type ${event.type}`);
            }

            res.json({ received: true });
        } catch (err) {
            console.error("Webhook handling error:", err);
            res.status(500).end();
        }
    }
);

async function start() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("MongoDB connected");
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

start();
