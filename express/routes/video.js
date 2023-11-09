const {models} = require('../../sequelize');
const sequelize = require('../../sequelize');
const {Op, QueryTypes} = require('sequelize');
const dateUtil = require('../../utils/DateUtil')

const {getIdParam} = require('../helpers');

async function getAll(req, res) {
    let {url, orderBy, orderByDirection, filterWatched, limit = 100} = req.query
    condition = {order: [['createdAt', 'DESC']], where: {}, limit: parseInt(limit)};
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
        condition['where']['duration'] = {
            [Op.or]: [
                {[Op.gt]: sequelize.literal('progress + 20')},
                {[Op.eq]: 0}]

        }
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
    const watchTodayDurationArr = await sequelize.query("select CONCAT(              FLOOR(watch_time / 3600), '时 ',              FLOOR((watch_time % 3600) / 60), '分 ',              watch_time % 60, '秒'          ) AS formatted_time from video_watching_data where date >= curdate();", {type: QueryTypes.SELECT})
    const watchTodayDuration = watchTodayDurationArr && watchTodayDurationArr[0] ? watchTodayDurationArr[0].formatted_time : '0时 0分 0秒'
    const avgDurationArr = await sequelize.query("select CONCAT(              FLOOR(seconds / 3600), '时 ',              FLOOR((seconds % 3600) / 60), '分 ',              seconds % 60, '秒'          ) AS formatted_time from (select FLOOR(sum(watch_time) / TIMESTAMPDIFF(DAY, (select min(t.createdAt) from video as t), now())) as seconds     from video_watching_data) as t", {type: QueryTypes.SELECT});
    const watchYesterdayDurationArr = await sequelize.query("select CONCAT(FLOOR(watch_time / 3600), '时 ', FLOOR((watch_time % 3600) / 60), '分 ', watch_time % 60,'秒') AS formatted_time from video_watching_data WHERE date = CURDATE() - INTERVAL 1 DAY", {type: QueryTypes.SELECT});
    const avgDuration = avgDurationArr[0].formatted_time
    const watchYesterdayDuration = watchYesterdayDurationArr[0].formatted_time
    format(videos);
    const data = {
        statistics: {
            watchTodayDuration, avgDuration, watchYesterdayDuration
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

async function updateWatchTime(watch_time) {
    if (watch_time) {
        //     查询今天是否播放过视频
        const count = await sequelize.query("select count(id) as count from video_watching_data where date >= curdate()", {type: QueryTypes.SELECT})
        // 播放过
        if (count[0].count) {
            sequelize.query(`update video_watching_data set watch_time=watch_time + ${watch_time} where date >= curdate()`)
        } else {
            //     没有播放过
            sequelize.query(`insert into video_watching_data(watch_time, date) value (${watch_time},curdate())`)
        }
    }
}

async function create(req, res) {
    if (req.body.id) {
        res.fail(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
    }
    // 更新播放时长
    await updateWatchTime(req.body.watch_time);

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
        await updateWatchTime(req.body.watch_time)
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