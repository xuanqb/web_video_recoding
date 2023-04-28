const {models} = require('../../sequelize');
const sequelize = require('../../sequelize');
const {Op} = require('sequelize');

const {getIdParam} = require('../helpers');

async function getAll(req, res) {
    const users = await models.video.findAll();
    res.success(users);
}

async function getByUrl(req, res) {
    const videos = await getVideoByUrl(req.body.unique_url)
    res.success(videos);
};

async function recentUnwatched(req, res) {
    const videos = await sequelize.query("SELECT * FROM video  WHERE duration-progress>120 ORDER BY updatedAt DESC LIMIT 10", {
        model: models.video, mapToModel: true
    })
    res.success(videos);
}

async function getVideoByUrl(url) {
    return await models.video.findOne({
        where: {
            unique_url: {
                [Op.eq]: url
            }
        }
    })
}

async function create(req, res) {
    if (req.body.id) {
        res.fail(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
    }
    const user = await models.video.findOne({
        attributes: ['unique_url'], where: {
            unique_url: {
                [Op.eq]: req.body.unique_url
            }
        }
    })
    if (!user) {
        await models.video.create(req.body);
    } else {
        models.video.update(req.body, {
            where: {
                unique_url: {
                    [Op.eq]: req.body.unique_url
                }
            }
        })
    }
    res.status(201).end();
};

async function update(req, res) {
    const id = getIdParam(req);

    // We only accept an UPDATE request if the `:id` param matches the body `id`
    if (req.body.id === id) {
        await models.video.update(req.body, {
            where: {
                id: id
            }
        });
        res.status(200).end();
    } else {
        res.status(400).send(`Bad request: param ID (${id}) does not match body ID (${req.body.id}).`);
    }
};

async function remove(req, res) {
    const id = getIdParam(req);
    await models.video.destroy({
        where: {
            id: id
        }
    });
    res.status(200).end();
};

module.exports = {
    getAll, getByUrl, create, update, remove, recentUnwatched,
};