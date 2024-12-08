const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_KEY);

app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

console.log(process.env.STRIPE_KEY);

app.get("/",async(req,res)=>res.send(`<div style="height:100vh;width:100vw;display:flex;justify-content:center;align-items:center;flex-direction:column;"><h1>Hello there this is stripe-dev-server</h1><img src="https://i.pinimg.com/originals/6c/90/28/6c90288d7e10d46d18895f17f420a92c.gif"/></div>`));

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
