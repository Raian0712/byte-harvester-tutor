const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const secretSchema = new Schema({
    secret: {
        type: String
    }
});

module.exports = mongoose.model("secret", secretSchema);