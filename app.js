const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const key=process.env.STRIPE_KEY;
const stripe = require("stripe")(`${key}`);

const allowedOrigins = [
    "http://localhost:5173",
    "https://curiousitee-payment-stripe-server.vercel.app"
];

const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman or curl)
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'],  // Allowed headers
    credentials: true,  // Allow cookies and auth headers
  };

app.use(cors(corsOptions));

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

app.get("/", async (req, res) => res.send(`<div style="height:100vh;width:100vw;display:flex;justify-content:center;align-items:center;flex-direction:column;"><h1>Hello there this is stripe-dev-server</h1><img src="https://i.pinimg.com/originals/6c/90/28/6c90288d7e10d46d18895f17f420a92c.gif"/></div>`));

app.post("/checkout", async (req, res) => {

    const { products } = req.body;
    //console.log(req.body);
    for (let i = 0; i < products.length; i++) {
        products[i].image = `https://image-server-ebon.vercel.app/image/${products[i].image}`;
    }
    const lineitems = products.map(product => ({
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

// Webhook endpoint to handle Stripe events
app.post("/webhook", (req, res) => {
    console.log("here");
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body, // Raw request body
            sig,
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
            // Perform additional actions, e.g., update order status in DB
            break;

        case "checkout.session.expired":
            console.log("Payment session expired");
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).send("Webhook received");
});

app.listen(4000, () => {
    console.log("payment server started");
});
