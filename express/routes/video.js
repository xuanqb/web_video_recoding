const {models} = require('../../sequelize');
const sequelize = require('../../sequelize');
const {Op, QueryTypes} = require('sequelize');
const dateUtil = require('../../utils/DateUtil')

const {getIdParam} = require('../helpers');

async function getAll(req, res) {
    condition = {order: [['createdAt', 'DESC']], limit: 100};
    let {url, orderBy, orderByDirection, filterWatched} = req.query
    if (!orderByDirection) {
        orderByDirection = 'DESC'
    }
    if (url) {
        condition['where'] = {
            unique_url: {
                [Op.like]: '%' + req.query.url + '%'
            }
        };
    }
    if (filterWatched && filterWatched === 'true') {
        condition['where']['duration'] = {[Op.gt]: sequelize.literal('progress + 20')}
    }
    if (orderBy) {
        condition['order'] = [[orderBy, orderByDirection]]
    }
    const videos = await models.video.findAll(condition);
    format(videos);
    res.success(videos);
}

async function getByUrl(req, res) {
    const videos = await getVideoByUrl(req.body.unique_url)
    res.success(videos);
};

async function recentUnwatched(req, res) {
    const videos = await sequelize.query("SELECT id, unique_url, duration, progress, createdAt, updatedAt FROM video  WHERE duration-progress>20 ORDER BY updatedAt DESC LIMIT 10", {
        model: models.video, mapToModel: true
    })
    const watchTodayDurationArr = await sequelize.query("select CONCAT(FLOOR(seconds / 3600), '小时 ',FLOOR((seconds % 3600) / 60), '分钟 ',seconds % 60, '秒') AS formatted_time from (select sum(progress) as seconds from video where updatedAt >= curdate()) as t;", {type: QueryTypes.SELECT})
    const watchTodayDuration = watchTodayDurationArr[0].formatted_time
    const avgDurationArr = await sequelize.query("select CONCAT(FLOOR(seconds / 3600), '小时 ',FLOOR((seconds % 3600) / 60), '分钟 ',seconds % 60, '秒') AS formatted_time from (select FLOOR(sum(progress) / TIMESTAMPDIFF(DAY, min(createdAt), now())) as seconds from video) as t;", {type: QueryTypes.SELECT});
    const avgDuration = avgDurationArr[0].formatted_time
    format(videos);
    const data = {
        statistics: {
            watchTodayDuration, avgDuration
        },
        recentUnwatched: videos,
    }
    res.success(data);
}

function format(videos) {
    videos.forEach(video => {
        video.dataValues.percentage = ((video.progress / video.duration) * 100).toFixed(2) + '%'
        // 总进度
        video.duration = dateUtil.formatTime(video.duration);
        // 当前进度
        video.progress = dateUtil.formatTime(video.progress);
        return video
    })
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

async function updatePercentage(req, res) {
    // 当前播放进度
    const {p} = req.query;
    if (!p) {
        res.fail('{p} 进度不存在');
    }
    const id = getIdParam(req);
    const videoInfo = await models.video.findByPk(id)
    if (videoInfo == null) {
        res.fail('记录不存在');
    }
    videoInfo.progress = videoInfo.duration * (p / 100);
    await videoInfo.save();
    res.success();

}

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
    getAll, getByUrl, create, update, remove, recentUnwatched, updatePercentage
};