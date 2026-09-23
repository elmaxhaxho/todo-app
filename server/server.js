const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const express = require('express');
const cors = require('cors');

const connectDB =
    require('./config/db');

const {
    notFound,
    errorHandler
} = require('./middleware/errorMiddleware');

const app = express();

const PORT =
    process.env.PORT || 5000;

app.use(
    cors({
        origin:
            process.env.CLIENT_URL ||
            'http://localhost:3000',

        credentials: true
    })
);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    '/api/auth',
    require('./routes/authRoutes')
);

app.use(
    '/api/projects',
    require('./routes/projectRoutes')
);

app.use(
    '/api/tasks',
    require('./routes/taskRoutes')
);

app.use(
    '/api/users',
    require('./routes/userRoutes')
);

app.use(
    '/api/clients',
    require('./routes/clientRoutes')
);

app.use(
    '/api/dashboard',
    require('./routes/dashboardRoutes')
);

app.get(
    '/api/health',
    (req, res) => {

        res.json({
            status: 'ok',
            timestamp: new Date()
        });
    }
);

app.use(notFound);

app.use(errorHandler);

async function startServer() {

    await connectDB();

    app.listen(
        PORT,
        () => {
            console.log(
                `Server running on http://localhost:${PORT}`
            );
        }
    );
}

startServer();