const mongoose = require("mongoose")

const analytics = new mongoose.Schema({
    userId:{
        type: String,
        required: true,
    },
    userEmail:{
        type: String,
        required: true
    },
    accessToken:{
        type: String,
        required: false
    }, 
    alias:{
        type: Array,
        required: false,
    },
    timestamp:{
        type: Date,
        default: Date.now
    },


})

module.exports = mongoose.model("analytics",analytics)