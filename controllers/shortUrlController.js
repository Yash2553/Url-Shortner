const express = require("express")
const ShortUrlModel = require("../models/shortUrlModel")
const geoip = require("geoip-lite")
const useragent = require("useragent")

const shorten = async (req, res) => {
    let { longurl, topic, alias } = req.body
    if (!longurl) {
        res.send("longurl is mandatory")
    } else {
        if (!alias) {
            const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
            let customAlias = ""

            for (let i = 0; i < 6; i++) {
                let random = Math.floor(Math.random() * characters.length)
                customAlias += characters[random]
            }
            alias = customAlias
        }
        const checkalias = await ShortUrlModel.find({ "alias": alias })
        if (checkalias.length > 0) {
            res.send("alias is not present")
        }
        else {
            const ShortUrl = `http://localhost:3003/api/shorten/${alias}`
            const timestamp = new Date();
            const data = await new ShortUrlModel({
                longurl,
                alias,
                topic,
                ShortUrl,
                
               
        //         geolocationdata: geo
        //         console.log(geo.country)
        // ? {
        //       country: geo.country || null,
        //       region: geo.region || null,
        //       city: geo.city || null,
        //       latitude: geo.ll ? geo.ll[0] : null,
        //       longitude: geo.ll ? geo.ll[1] : null,
        //   }
        // : null,

            }).save()

            res.json({ ShortUrl: ShortUrl, CreatedAt: data.CreatedAt })
        }
    }
}


const redirect = async (req, res) => {
    const { alias } = req.params
    const { email, id } = req.customData
    let redirect = await ShortUrlModel.findOne({ "alias": alias })
    if (!redirect) {
        res.json({ "message": "invalid alias" })
    }
    else {
        console.log("redirected")
            const userAgent = req.headers['user-agent']
            const agent = useragent.parse(userAgent)
            const ipAddress = req.ip;
            const geo = geoip.lookup(ipAddress);
            const clickByDate = (() => {
                const date = new Date();
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
                const year = String(date.getFullYear()).slice(-2);
                return `${day}-${month}-${year}`;
            })();
            console.log(clickByDate)
            
        let analytics = await ShortUrlModel.findOneAndUpdate({ "alias": alias },
            {
                $push: {
                    analytics: {
                        email: email,
                        ClickByDate: clickByDate,
                        osName:agent.os.toString(),
                        deviceName:agent.device.toString()
                    },
                    logDetails:{
                        userAgent:userAgent,
                        ip:ipAddress,
                    },
                }
            },
            { new: true }
        )
        res.redirect(redirect.longurl)

    }

}

const analytics = async (req, res) => {
    const { alias } = req.params;

    // Find alias in the database
    const findAlias = await ShortUrlModel.findOne({ alias });
    if (!findAlias) {
        return res.status(404).json({ message: "Invalid alias" });
    }

    const analytics = findAlias.analytics;

    // Total clicks
    const totalClicks = analytics.length;

    // Unique users
    const uniqueUsers = new Set(analytics.map(entry => entry.email)).size;

    // Clicks grouped by dates
    const datesArray = [...new Set(analytics.map(entry => entry.ClickByDate))];
    const result = [];
    for (const date of datesArray) {
        const count = await ShortUrlModel.aggregate([
            { $unwind: "$analytics" },
            { $match: { "analytics.ClickByDate": date } },
            { $count: "total" }
        ]);
        result.push({
            date,
            countByClick: count[0]?.total || 0, // Default to 0 if no data is found
        });
    }

    // OS Type Data
    const osTypeData = await ShortUrlModel.aggregate([
        { $unwind: "$analytics" },
        {
            $group: {
                _id: "$analytics.osName",
                uniqueClicks: { $sum: 1 },
                uniqueUsers: { $addToSet: "$analytics.email" },
            },
        },
        {
            $project: {
                osName: "$_id",
                uniqueClicks: 1,
                uniqueUsers: { $size: "$uniqueUsers" },
            },
        },
        { $sort: { osName: 1 } }
    ]);

    // Device Type Data
    const deviceTypeData = await ShortUrlModel.aggregate([
        { $unwind: "$analytics" },
        {
            $group: {
                _id: "$analytics.deviceName",
                uniqueClicks: { $sum: 1 },
                uniqueUsers: { $addToSet: "$analytics.email" },
            },
        },
        {
            $project: {
                deviceName: "$_id",
                uniqueClicks: 1,
                uniqueUsers: { $size: "$uniqueUsers" },
            },
        },
        { $sort: { deviceName: 1 } }
    ]);

    // Final response
    res.json({
        totalClicks,
        uniqueUsers,
        clicksByDate: result,
        osTypeData,
        deviceTypeData,
    });
};

const topicAnalytics = async (req, res) => {
    const { topic } = req.params;

    if (!topic) {
        return res.status(400).json({ message: "Invalid topic" });
    }

    try {
        const urls = await ShortUrlModel.find({ topic });

        if (!urls.length) {
            return res.status(404).json({ message: "No URLs found for the specified topic" });
        }

    
        const totalClicks = urls.reduce((acc, url) => acc + url.analytics.length, 0);

        const uniqueUsersSet = new Set();
        urls.forEach(url => {
            url.analytics.forEach(entry => uniqueUsersSet.add(entry.email));
        });
        const uniqueUsers = uniqueUsersSet.size;

        const clicksByDateMap = new Map();
        urls.forEach(url => {
            url.analytics.forEach(entry => {
                const date = entry.ClickByDate;
                clicksByDateMap.set(date, (clicksByDateMap.get(date) || 0) + 1);
            });
        });
        const clicksByDate = Array.from(clicksByDateMap.entries()).map(([date, count]) => ({
            date,
            countByClick: count,
        }));

        const urlsData = urls.map(url => {
            const uniqueEmailsSet = new Set(url.analytics.map(entry => entry.email));
            return {
                shortUrl: url.ShortUrl,
                totalClicks: url.analytics.length,
                uniqueUsers: uniqueEmailsSet.size,
            };
        });

        res.json({
            totalClicks,
            uniqueUsers,
            clicksByDate,
            urls: urlsData,
        });
    } catch (error) {
        console.error("Error fetching topic analytics:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


const getOverallAnalytics = async (req, res) => {
    try {
        const data = req.customData
        const userEmail = data.email;

        if (!userEmail) {
            return res.status(400).json({ message: "User email is missing" });
        }

        // Find all URLs created by the user (filtered by email)
        const userUrls = await ShortUrlModel.find({ "analytics.email": userEmail });
        const totalUrls = userUrls.length;

        if (totalUrls === 0) {
            return res.json({
                totalUrls: 0,
                totalClicks: 0,
                uniqueUsers: 0,
                clicksByDate: [],
                osType: [],
                deviceType: []
            });
        }

        // Flatten all analytics entries across user URLs
        const allAnalytics = userUrls.flatMap((url) => url.analytics);
        const totalClicks = allAnalytics.length;
        const uniqueUsers = new Set(allAnalytics.map((entry) => entry.email)).size;

        // Group clicks by date
        const clicksByDate = await ShortUrlModel.aggregate([
            { $unwind: "$analytics" },
            { $match: { "analytics.email": userEmail } },
            {
                $group: {
                    _id: "$analytics.ClickByDate",
                    totalClicks: { $sum: 1 },
                },
            },
            {
                $project: {
                    date: "$_id",
                    totalClicks: 1,
                    _id: 0,
                },
            },
            { $sort: { date: 1 } },
        ]);

        // Group analytics by operating system type
        const osType = await ShortUrlModel.aggregate([
            { $unwind: "$analytics" },
            { $match: { "analytics.email": userEmail } },
            {
                $group: {
                    _id: "$analytics.osName",
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$analytics.email" },
                },
            },
            {
                $project: {
                    osName: "$_id",
                    uniqueClicks: 1,
                    uniqueUsers: { $size: "$uniqueUsers" },
                    _id: 0,
                },
            },
            { $sort: { osName: 1 } },
        ]);

        // Group analytics by device type
        const deviceType = await ShortUrlModel.aggregate([
            { $unwind: "$analytics" },
            { $match: { "analytics.email": userEmail } },
            {
                $group: {
                    _id: "$analytics.deviceName",
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$analytics.email" },
                },
            },
            {
                $project: {
                    deviceName: "$_id",
                    uniqueClicks: 1,
                    uniqueUsers: { $size: "$uniqueUsers" },
                    _id: 0,
                },
            },
            { $sort: { deviceName: 1 } },
        ]);

        // Send the response
        res.json({
            totalUrls,
            totalClicks,
            uniqueUsers,
            clicksByDate,
            osType,
            deviceType,
        });
    } catch (error) {
        console.error("Error fetching overall analytics:", error);
        res.status(500).json({ message: "Server error" });
    }
};



module.exports = { shorten, redirect, analytics, topicAnalytics, getOverallAnalytics}