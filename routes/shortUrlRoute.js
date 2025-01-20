const express = require("express");
const { shorten, redirect, analytics, topicAnalytics, getOverallAnalytics } = require("../controllers/shortUrlController");
const passport = require("passport");
let route = express.Router();

const session = require("express-session");
const googleStrategy = require("passport-google-oauth20").Strategy;
const auth = require("../auth");

/**
 * @swagger
 * /api/shorten:
 *   post:
 *     summary: Shorten a URL
 *     description: Accepts a URL and returns a shortened version.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               longurl:
 *                 type: string
 *                 description: The URL to shorten
 *                 example: http://example.com
 *               topic:
 *                 type: string
 *                 description: Topic associated with the URL
 *                 example: Blogs
 *               alias:
 *                 type: string
 *                 description: Custom alias for the short URL
 *                 example: addAliace
 *     responses:
 *       200:
 *         description: URL successfully shortened
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ShortUrl:
 *                   type: string
 *                   description: The shortened URL
 *                   example: http://short.ly/xyz123
 *                 CreatedAt:
 *                   type: string
 *                   description: The timestamp when the URL was created
 *                   example: 2023-01-18T12:34:56Z
 *       400:
 *         description: Invalid URL
 */
route.post("/shorten", shorten);

/**
 * @swagger
 * /api/shorten/{alias}:
 *   get:
 *     summary: Redirect to original URL
 *     description: Accepts a short URL alias and redirects to the original URL.
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *         description: The alias for the shortened URL (e.g., D3ZaJj)
 *     responses:
 *       302:
 *         description: Redirects to the original URL
 *       404:
 *         description: Alias not found
 *       500:
 *         description: Internal Server Error
 */
route.get("/shorten/:alias", redirect);

/**
 * @swagger
 * /api/analytics/topic/{topic}:
 *   get:
 *     summary: Get topic analytics
 *     description: Retrieves analytics data for all URLs under a specific topic.
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *         description: The topic for the URLs
 *     responses:
 *       200:
 *         description: Topic analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClicks:
 *                   type: integer
 *                   description: Total clicks for the topic
 *                 uniqueUsers:
 *                   type: integer
 *                   description: Number of unique users
 *                 clicksByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       countByClick:
 *                         type: integer
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       shortUrl:
 *                         type: string
 *                       totalClicks:
 *                         type: integer
 *                       uniqueUsers:
 *                         type: integer
 *       404:
 *         description: No URLs found for the specified topic
 *       400:
 *         description: Invalid topic
 */
route.get("/analytics/topic/:topic", topicAnalytics);

/**
 * @swagger
 * /api/analytics/overall:
 *   get:
 *     summary: Get overall analytics
 *     description: Retrieves overall analytics for the authenticated user.
 *     responses:
 *       200:
 *         description: Overall analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUrls:
 *                   type: integer
 *                   description: Total URLs created by the user
 *                 totalClicks:
 *                   type: integer
 *                   description: Total clicks across all URLs
 *                 uniqueUsers:
 *                   type: integer
 *                   description: Number of unique users
 *                 clicksByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       totalClicks:
 *                         type: integer
 *                 osType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       osName:
 *                         type: string
 *                       uniqueClicks:
 *                         type: integer
 *                       uniqueUsers:
 *                         type: integer
 *                 deviceType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       deviceName:
 *                         type: string
 *                       uniqueClicks:
 *                         type: integer
 *                       uniqueUsers:
 *                         type: integer
 *       400:
 *         description: User email is missing
 *       500:
 *         description: Server error
 */
route.get("/analytics/overall", getOverallAnalytics);

/**
 * @swagger
 * /api/analytics/{alias}:
 *   get:
 *     summary: Get analytics for a specific URL
 *     description: Retrieves analytics data for a specific short URL alias.
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *         description: The alias of the short URL
 *     responses:
 *       200:
 *         description: Analytics data for the short URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClicks:
 *                   type: integer
 *                 uniqueUsers:
 *                   type: integer
 *                 clicksByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       countByClick:
 *                         type: integer
 *                 osTypeData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       osName:
 *                         type: string
 *                       uniqueClicks:
 *                         type: integer
 *                       uniqueUsers:
 *                         type: integer
 *                 deviceTypeData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       deviceName:
 *                         type: string
 *                       uniqueClicks:
 *                         type: integer
 *                       uniqueUsers:
 *                         type: integer
 *       404:
 *         description: Invalid alias
 *       500:
 *         description: Server error
 */
route.get("/analytics/:alias", analytics);

module.exports = route;
