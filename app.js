const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const Company = require("./models/Company");
const Product = require("./models/Product");
const fs = require("fs");

// NAYA: Session require karein
const session = require("express-session"); 

mongoose.connect("mongodb+srv://Umiya:Umiya@cluster.roninyt.mongodb.net/agroDB?retryWrites=true&w=majority")
.then(()=> console.log("MongoDB Connected"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public"))); 
app.use(express.urlencoded({ extended: true }));

// NAYA: Session Middleware setup (Security ke liye)
app.use(session({
    secret: "UmiyaAgroSecureKey", 
    resave: false,
    saveUninitialized: false
}));

// NAYA: Ye Check Karega Ki Admin Login Hai Ya Nahi
const checkAuth = (req, res, next) => {
    if (req.session.isAdmin) {
        next(); // Login hai toh aage jane do
    } else {
        res.redirect("/login"); // Login nahi hai toh login page par bhejo
    }
};

// ================= PUBLIC ROUTES =================
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
    res.render("products", { companies, products, selectedCompany });
});

app.get("/branches", (req, res) => {
    res.render("branches");
});


// ================= LOGIN SYSTEM =================

// Login page dikhane ke liye
app.get("/login", (req, res) => {
    if(req.session.isAdmin) return res.redirect("/admin");
    res.render("login", { error: null });
});

// ID Password check karne ke liye
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    
    // YAHAN AAP APNA DEFAULT ID PASS SET KAR SAKTE HAIN
    const adminID = "admin";
    const adminPass = "12345"; 

    if (username === adminID && password === adminPass) {
        req.session.isAdmin = true; // Session save
        res.redirect("/admin");
    } else {
        res.render("login", { error: "Invalid Username or Password!" });
    }
});

// Logout karne ke liye
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});


const storage = multer.memoryStorage();
const upload = multer({ storage });


// ================= PROTECTED ADMIN ROUTES (checkAuth laga hai) =================

// Admin Panel (Sirf login ke baad khulega)
app.get("/admin", checkAuth, async (req, res) => {
    const companies = await Company.find();
    const products = await Product.find();
    res.render("admin", { companies, products });
});

app.post("/add-company", checkAuth, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("Error: Image file upload nahi hui hai.");
        const imageBase64 = req.file.buffer.toString("base64");
        const imageSrc = `data:${req.file.mimetype};base64,${imageBase64}`;
        const newCompany = new Company({ name: req.body.name, image: imageSrc });
        await newCompany.save();
        res.redirect("/admin");
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
});

app.get("/delete/:id", checkAuth, async (req, res) => {
    await Company.findByIdAndDelete(req.params.id);
    res.redirect("/admin");
});

app.post("/add-product", checkAuth, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("Error: Image file upload nahi hui hai.");
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
        res.status(500).send("Error: " + error.message);
    }
});

app.get("/delete-product/:id", checkAuth, async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin#product");
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server started on port 3000");
});