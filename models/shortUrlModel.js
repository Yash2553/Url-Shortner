const mongoose = require("mongoose")
const analyticsModel = require("./analyticsModel")

const ShortnerSchema = new mongoose.Schema({
    longurl: {
        type: String,
        required: true
    },
    alias: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: false
    },
    ShortUrl: {
        type: String,
        required: true
    },
    logDetails:[ 
        {
        timeStamp: {
            type: Date,
            default: Date.now
        },
        userAgent: {
            type: String,
            required: true,
        },
        ip: {
            type: String,
            required: true,
        },
        geolocationdata:{
            country:{
                type: String,
                required: false,
            },
            region:{
                type: String,
                required: false,
            },
            city:{
                type: String,
                required: false,
            },
            latitude:{
                type: String,
                required: false,
            },
            longitude:{
                type: String,
                required: false,
            }
        }
    }],
    analytics: [
        {
            email: {
                type: String,
                required: false,
            },
            ClickByDate: {
                type: String,
                required: false,
            },
            osName:{
                type: String,
                required: true
            },
            deviceName:{
                type: String,
                required: true
            }
        }],
})

module.exports = mongoose.model("ShortUrlModel", ShortnerSchema)