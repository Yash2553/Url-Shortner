const express = require('express')
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const app = express()
const route = require("./routes/shortUrlRoute.js")
const rateLimit = require("express-rate-limit")
const auth = require("./auth")
const swaggerJSDoc = require("swagger-jsdoc")
const swaggerUi = require("swagger-ui-express")

const middleware = require("./routes/middleware")

dotenv.config();

const port = process.env.PORT || 3000
const MongoUrl= process.env.MONGO_URL

app.use(express.json()); 

mongoose.connect(MongoUrl).then(() => {
    console.log("Database connected successfully")
    app.listen(port, () => {
        console.log(`Server is running on ${port}`)
      })
}).catch((error)=>{
    console.log(error)
})

const limiter = rateLimit({
    max: 10,
    windowMs: 60 * 1000,
    message: "Limit exceeded for this ip, please try after some time"
    
})


const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Url Shortner",
            version: "1.0.0",
            description: "An api which will shorten your url using Node.js"
        },
        server: [
            {
                url: `http://localhost:${port}`,
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT", // or "OAuth" if you're using OAuth tokens
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
    ]},
    apis: ["./routes/*.js"] //this is basically collecting all the .js files present in routes folder
}

const swaggerSpec = swaggerJSDoc(swaggerOptions)

//here swagger will be running
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const cors = require('cors');

const corsOptions = {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Location'], // Expose the Location header for redirects
};

app.use(cors(corsOptions));



app.use('/auth',auth)
app.use('/api', limiter, middleware , route)
