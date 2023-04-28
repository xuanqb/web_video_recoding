const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require("cors");

const routes = {
    video: require('./routes/video'),
};

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, '../public')));

// We create a wrapper to workaround async errors not being transmitted correctly.
function makeHandlerAwareOfAsyncErrors(handler) {
    return async function (req, res, next) {
        try {
            await handler(req, res);
        } catch (error) {
            next(error);
        }
    };
}

// We provide a root route just as an example
app.get('/', (req, res) => {
    res.send(`
		<h2>Hello, Sequelize + Express!</h2>
	`);
});

const responseMiddleware = (req, res, next) => {
    res.sendResponse = (code, data) => {
        const responseObj = {
            code,
            data
        };
        res.status(code).json(responseObj);
    };
    res.success = (data) => {
        const code = 200;
        const responseObj = {
            code,
            data
        };
        res.status(code).json(responseObj);
    };
    res.fail = (data) => {
        const code = 400;
        const responseObj = {
            code,
            data
        };
        res.status(200).json(responseObj);
    }
    next();
};

app.use(responseMiddleware);

// We define the standard REST APIs for each route (if they exist).
for (const [routeName, routeController] of Object.entries(routes)) {
    if (routeController.getAll) {
        app.get(
            `/api/${routeName}`,
            makeHandlerAwareOfAsyncErrors(routeController.getAll)
        );
    }
    if (routeController.getById) {
        app.get(
            `/api/${routeName}/:id`,
            makeHandlerAwareOfAsyncErrors(routeController.getById)
        );
    }
    if (routeController.create) {
        app.post(
            `/api/${routeName}`,
            makeHandlerAwareOfAsyncErrors(routeController.create)
        );
    }
    if (routeController.update) {
        app.put(
            `/api/${routeName}/:id`,
            makeHandlerAwareOfAsyncErrors(routeController.update)
        );
    }
    if (routeController.remove) {
        app.delete(
            `/api/${routeName}/:id`,
            makeHandlerAwareOfAsyncErrors(routeController.remove)
        );
    }
    app.post('/api/video/getByUrl', routes.video.getByUrl);
    app.get('/api/video/recentUnwatched', routes.video.recentUnwatched);
}

module.exports = app;