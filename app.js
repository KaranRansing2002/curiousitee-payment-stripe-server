const express = require("express");
const app = express();
const cors = require("cors");

const stripe = require("stripe")("sk_test_51K96NiSE0mSwz2G7GzIWA7TSPd43SDVOh0gH2jyUOsABZnXZcq2Q6MgH71knivUyFFDbCAfmqKjGH9STAhUDt9UW00zqntZ9mJ");

app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

app.post("/checkout", async (req, res) => {
    const { products } = req.body;
    console.log(req.body);
    for (let i = 0; i < products.length; i++) {
        products[i].image = `http://localhost:8000/image/${products[i].image}`;
    }
    const lineitems = products.map(product => ({
        price_data: {
            currency: "inr",
            product_data: {
                name: product.productName,
                images: [product.image]
            },
            unit_amount:Math.round(product.price*100)
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

app.listen(4000, () => {
    console.log("payment server started");
});
