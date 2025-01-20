const express = require("express");
require('dotenv').config()
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const analytics = require("./models/analyticsModel")
const jwt = require("./jwtUtils")
const router = express.Router();

// Session configuration
router.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

// Passport initialization
router.use(passport.initialize());
router.use(passport.session());


const  createUser = async(profile)=>{
        const existingUser = await analytics.findOne({userId: profile.id})
        if(existingUser){
            console.log(`existing user:${existingUser}`)
                return existingUser
        }
        else{
            const data = await new analytics({
                "userId": profile.id,
                "userEmail":profile.emails[0].value
            }).save()
            console.log("user created")
             return data
        }
        
    }


// Configure Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3003/auth/google/callback",
        },
       async (accessToken, refreshToken, profile, done) => {  
            console.log(`accesstoken: ${accessToken}`)
            const user = await createUser(profile)
            user.accessToken = accessToken;
            return done(null, profile);
        }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/failure" }),
    (req, res) => {
        console.log(req.user)

        const accessToken = jwt.generateToken(req.user); // Ensure `accessToken` is set in the user object

        res.cookie("accessToken", accessToken, {
            httpOnly: true, // Prevent client-side scripts from accessing the cookie
            secure: true,   // Ensure the cookie is only sent over HTTPS
            sameSite: "Lax", // Adjust SameSite attribute as needed
        })
        

        res.redirect("http://localhost:3003/api-docs"); // Redirect after successful login
    }
);

router.get("/failure", (req, res) => {
    res.send("Authentication failed");
});

module.exports = router;
