const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: String,
    company: String,
    category: String,
    image: String
});

module.exports = mongoose.model("Product", productSchema);