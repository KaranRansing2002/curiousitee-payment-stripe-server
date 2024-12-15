const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser"); // For raw middleware
require("dotenv").config();

const key = process.env.STRIPE_KEY;
const stripe = require("stripe")(key);

const allowedOrigins = [
    "http://localhost:5173",
    "https://curiousitee-payment-stripe-server.vercel.app"
];

const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

app.use(cors(corsOptions));

app.use('/webhook', express.raw({type: "*/*"}))
app.use(express.json());

app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

app.get("/", async (req, res) =>
    res.send(
        `<div style="height:100vh;width:100vw;display:flex;justify-content:center;align-items:center;flex-direction:column;"><h1>Hello there this is stripe-dev-server</h1><img src="https://i.pinimg.com/originals/6c/90/28/6c90288d7e10d46d18895f17f420a92c.gif"/></div>`
    )
);

app.post("/checkout", async (req, res) => {
    const { products } = req.body;
    for (let i = 0; i < products.length; i++) {
        products[i].image = `https://image-server-ebon.vercel.app/image/${products[i].image}`;
    }
    const lineitems = products.map((product) => ({
        price_data: {
            currency: "inr",
            product_data: {
                name: product.productName,
                images: [product.image]
            },
            unit_amount: Math.round(product.price * 100)
        },
        quantity: product.qty
    }));

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineitems,
        mode: "payment",
        success_url: "http://localhost:5173",
        cancel_url: "http://localhost:5173/product"
    });

    res.json({ id: session.id });
});

app.post(
    "/webhook",
    (req, res) => {
        const sig = req.headers["stripe-signature"];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        // Log raw body for debugging
        console.log("Raw Payload:", req.body.toString());
        console.log("Stripe Signature:", sig);

        let event;
        try {
            // Construct the event with the raw body
            event = stripe.webhooks.constructEvent(
                req.body, // Raw body is passed to this method
                sig,      // Stripe signature
                endpointSecret
            );
        } catch (err) {
            console.error("Webhook signature verification failed:", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
            case "checkout.session.completed":
                const session = event.data.object;
                console.log("Payment successful:", session);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.status(200).send("Webhook received");
    }
);

app.listen(4000, () => {
    console.log("Payment server started");
});
