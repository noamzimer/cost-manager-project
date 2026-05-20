const dns = require('dns');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const pino = require('pino');
const axios = require('axios');
const Cost = require('./models/cost.model');
const Report = require('./models/report.model');

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const app = express();
const logger = pino();

const allowedCategories = ['food', 'health', 'housing', 'sports', 'education'];

app.use(cors());
app.use(express.json());

async function writeLog(request, response, message) {
    try {
        const logsServiceUrl = process.env.LOGS_SERVICE_URL;

        logger.info({
            service: 'costs-service',
            method: request.method,
            endpoint: request.originalUrl,
            status: response.statusCode,
            message
        });

        if (logsServiceUrl) {
            await axios.post(`${logsServiceUrl}/api/logs`, {
                service: 'costs-service',
                method: request.method,
                endpoint: request.originalUrl,
                status: response.statusCode,
                message
            });
        }
    } catch (error) {
        logger.error(error, 'Could not write log');
    }
}

app.use((request, response, next) => {
    response.on('finish', () => {
        writeLog(request, response, 'HTTP request received');
    });

    next();
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        logger.info('Costs service connected to MongoDB Atlas');
    })
    .catch((error) => {
        logger.error(error, 'MongoDB connection error');
    });

function createEmptyReport(userid, year, month) {
    return {
        userid,
        year,
        month,
        costs: allowedCategories.map((category) => ({
            [category]: []
        }))
    };
}

function isPastMonth(year, month) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    return year < currentYear || (year === currentYear && month < currentMonth);
}

async function checkUserExists(userid) {
    const usersServiceUrl = process.env.USERS_SERVICE_URL;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            const response = await axios.get(`${usersServiceUrl}/api/users/${userid}`, {
                timeout: 10000
            });

            return response.status === 200;
        } catch (error) {
            if (attempt === 3) {
                return false;
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    return false;
}

/*
 * Computed Design Pattern:
 * When a report is requested for a month that already passed,
 * the service first checks whether the report was already computed
 * and saved in the reports collection. If it exists, it returns it
 * without calculating again. If it does not exist, the service computes
 * the report from the costs collection, saves it in the reports collection,
 * and returns it. Current and future months are calculated directly
 * without saving a computed report.
 */
async function buildMonthlyReport(userid, year, month) {
    const report = createEmptyReport(userid, year, month);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const costs = await Cost.find({
        userid,
        created_at: {
            $gte: startDate,
            $lt: endDate
        }
    });

    costs.forEach((cost) => {
        const day = cost.created_at.getDate();

        const categoryObject = report.costs.find((item) => {
            return Object.prototype.hasOwnProperty.call(item, cost.category);
        });

        categoryObject[cost.category].push({
            sum: cost.sum,
            description: cost.description,
            day
        });
    });

    return report;
}

app.get('/', (request, response) => {
    response.json({
        message: 'Costs service is running'
    });
});

app.post('/api/add', async (request, response) => {
    try {
        const { description, category, userid, sum, created_at } = request.body;

        if (!description || !category || !userid || sum === undefined) {
            return response.status(400).json({
                id: 400,
                message: 'Missing required cost fields'
            });
        }

        if (!allowedCategories.includes(category)) {
            return response.status(400).json({
                id: 400,
                message: 'Invalid category'
            });
        }

        if (typeof userid !== 'number') {
            return response.status(400).json({
                id: 400,
                message: 'User id must be a number'
            });
        }

        if (typeof sum !== 'number' || sum <= 0) {
            return response.status(400).json({
                id: 400,
                message: 'Sum must be a positive number'
            });
        }

        const userExists = await checkUserExists(userid);

        if (!userExists) {
            return response.status(404).json({
                id: 404,
                message: 'User does not exist'
            });
        }

        const costDate = created_at ? new Date(created_at) : new Date();

        if (Number.isNaN(costDate.getTime())) {
            return response.status(400).json({
                id: 400,
                message: 'Invalid cost date'
            });
        }

        const now = new Date();

        if (costDate < now && created_at) {
            return response.status(400).json({
                id: 400,
                message: 'Cannot add costs with dates in the past'
            });
        }

        const cost = new Cost({
            description,
            category,
            userid,
            sum,
            created_at: costDate
        });

        const savedCost = await cost.save();

        return response.status(201).json(savedCost);
    } catch (error) {
        logger.error(error, 'Error adding cost');

        return response.status(500).json({
            id: 500,
            message: error.message
        });
    }
});

app.get('/api/report', async (request, response) => {
    try {
        const userid = Number(request.query.id);
        const year = Number(request.query.year);
        const month = Number(request.query.month);

        if (Number.isNaN(userid) || Number.isNaN(year) || Number.isNaN(month)) {
            return response.status(400).json({
                id: 400,
                message: 'Invalid report parameters'
            });
        }

        if (month < 1 || month > 12) {
            return response.status(400).json({
                id: 400,
                message: 'Month must be between 1 and 12'
            });
        }

        const userExists = await checkUserExists(userid);

        if (!userExists) {
            return response.status(404).json({
                id: 404,
                message: 'User does not exist'
            });
        }

        if (isPastMonth(year, month)) {
            const savedReport = await Report.findOne({
                userid,
                year,
                month
            });

            if (savedReport) {
                return response.json({
                    userid: savedReport.userid,
                    year: savedReport.year,
                    month: savedReport.month,
                    costs: savedReport.costs
                });
            }

            const computedReport = await buildMonthlyReport(userid, year, month);
            const reportToSave = new Report(computedReport);

            await reportToSave.save();

            return response.json(computedReport);
        }

        const report = await buildMonthlyReport(userid, year, month);

        return response.json(report);
    } catch (error) {
        logger.error(error, 'Error getting report');

        return response.status(500).json({
            id: 500,
            message: error.message
        });
    }
});

app.get('/api/total', async (request, response) => {
    try {
        const userid = Number(request.query.userid);

        if (Number.isNaN(userid)) {
            return response.status(400).json({
                id: 400,
                message: 'Invalid user id'
            });
        }

        const result = await Cost.aggregate([
            {
                $match: {
                    userid
                }
            },
            {
                $group: {
                    _id: '$userid',
                    total: {
                        $sum: '$sum'
                    }
                }
            }
        ]);

        return response.json({
            userid,
            total: result.length > 0 ? result[0].total : 0
        });
    } catch (error) {
        logger.error(error, 'Error getting total costs');

        return response.status(500).json({
            id: 500,
            message: error.message
        });
    }
});

const port = process.env.PORT || 3002;

app.listen(port, () => {
    logger.info(`Costs service is running on port ${port}`);
});