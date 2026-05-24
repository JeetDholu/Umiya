const express = require("express");
    const app = express();
    const path = require("path");
    const mongoose = require("mongoose");
    const multer = require("multer");
    const Company = require("./models/Company");
    const Product = require("./models/Product");
    const fs = require("fs");

    mongoose.connect("mongodb+srv://Umiya:Umiya@cluster.roninyt.mongodb.net/agroDB?retryWrites=true&w=majority")
    .then(()=> console.log("MongoDB Connected"));

    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "views"));

    // Zaroori hai ki 'public' directory statically serve ho taaki images display ho sake
    app.use(express.static(path.join(__dirname, "public"))); 
    app.use(express.urlencoded({ extended: true }));

    app.get("/", async (req, res) => {
        const companies = await Company.find();
        res.render("home", { companies });
    });

    app.get("/about", (req, res) => {
        res.render("about");
    });

    app.get("/products", async (req, res) => {

    const companies = await Company.find();

    let filter = {};
    let selectedCompany = "";

    if(req.query.company){
        filter.company = req.query.company;
        selectedCompany = req.query.company;
    }

    const products = await Product.find(filter);

    res.render("products", {
        companies,
        products,
        selectedCompany
    });

});

app.get("/branches", (req, res) => {
    res.render("branches");
});

const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log("Server started on port 3000");
    });



    const storage = multer.memoryStorage();
    const upload = multer({ storage });


    // admin page
    app.get("/admin", async (req, res) => {
    const companies = await Company.find();
    const products = await Product.find();
    res.render("admin", { companies, products });
});

    // add company
    app.post("/add-company", upload.single("image"), async (req, res) => {
        try {
        // Agar file nahi aayi, toh yahi error throw kar dega
        if (!req.file) {
            return res.status(400).send("Error: Image file upload nahi hui hai.");
        }
        
        // Image ko Base64 me convert karke MongoDB me store karenge taaki Render par delete na ho
        const imageBase64 = req.file.buffer.toString("base64");
        const imageSrc = `data:${req.file.mimetype};base64,${imageBase64}`;

        const newCompany = new Company({
            name: req.body.name,
            image: imageSrc
        });

        await newCompany.save();
        res.redirect("/admin");

    } catch (error) {
        console.error("ADD COMPANY ERROR: ", error);
        res.status(500).send("Internal Server Error Company Add karte waqt: " + error.message);
    }
});

    // delete
    app.get("/delete/:id", async (req, res) => {
        await Company.findByIdAndDelete(req.params.id);
        res.redirect("/admin");
    });

// ADD PRODUCT
app.post("/add-product", upload.single("image"), async (req, res) => {

    try {
        if (!req.file) {
            return res.status(400).send("Error: Image file upload nahi hui hai.");
        }

        const imageBase64 = req.file.buffer.toString("base64");
        const imageSrc = `data:${req.file.mimetype};base64,${imageBase64}`;

        const newProduct = new Product({
            name: req.body.name,
            image: imageSrc,
            company: req.body.company
        });

        await newProduct.save();
        res.redirect("/admin#product");

    } catch (error) {
        console.error("ADD PRODUCT ERROR: ", error);
        res.status(500).send("Internal Server Error Product Add karte waqt: " + error.message);
    }
});

app.get("/delete-product/:id", async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin#product");
});