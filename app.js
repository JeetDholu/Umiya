    const express = require("express");
    const app = express();
    const path = require("path");
    const mongoose = require("mongoose");
    const multer = require("multer");
    const Company = require("./models/Company");
    const Product = require("./models/Product");


    mongoose.connect("mongodb+srv://Umiya:Umiya@cluster.roninyt.mongodb.net/agroDB?retryWrites=true&w=majority")
    .then(()=> console.log("MongoDB Connected"));

    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "views"));

    app.use(express.static(path.join(__dirname, "public"))); // for CSS
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



    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "public/uploads");
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    });

    const upload = multer({ storage });


    // admin page
    app.get("/admin", async (req, res) => {
    const companies = await Company.find();
    const products = await Product.find();
    res.render("admin", { companies, products });
});

    // add company
    app.post("/add-company", upload.single("image"), async (req, res) => {
        const newCompany = new Company({
            name: req.body.name,
            image: "/uploads/" + req.file.filename
        });

        await newCompany.save();
        res.redirect("/admin");
    });

    // delete
    app.get("/delete/:id", async (req, res) => {
        await Company.findByIdAndDelete(req.params.id);
        res.redirect("/admin");
    });

// ADD PRODUCT
app.post("/add-product", upload.single("image"), async (req, res) => {

    const newProduct = new Product({
        name: req.body.name,
        image: "/uploads/" + req.file.filename,
        company: req.body.company
    });

    await newProduct.save();

    res.redirect("/admin#product");

});

app.get("/delete-product/:id", async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin");
});



