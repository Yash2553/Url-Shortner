const express = require("express")
const cookie = require("cookie")
const jwt = require("../jwtUtils")


const middleware = (req,res, next)=>{
  let cookies=req.headers.cookie
  if (cookies) {
    const parsedCookies = cookie.parse(cookies); // Parse the raw cookie string
    const accessToken = parsedCookies['accessToken']; // Access the `id_token`
    const decoded_jwt = jwt.verifyToken(accessToken)
    const valid = decoded_jwt.valid
    if (!valid){
        throw Error("NOT AUTHORISED")
    }
    const {id, email} = decoded_jwt.decoded
    req.customData = {
        userId: id,
        email: email
    };
    next()

    
}
}

module.exports =  middleware 