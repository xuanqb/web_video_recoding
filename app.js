const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const cors = require("cors");
const bodyParser = require('body-parser');
const path = require('path');
const dateUtil = require('./utils/DateUtil')
const app = express();

const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// 创建一个SQLite数据库连接
const db = new sqlite3.Database('conf/video.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the video database.');
});

// 创建一个videos表用于存储视频数据
db.run(`CREATE TABLE IF NOT EXISTS video (
  unique_url TEXT  PRIMARY KEY  NOT NULL,
  url TEXT NOT NULL,
  duration INTEGER NOT NULL,
  progress INTEGER NOT NULL,
  created_at DATETIME DEFAULT (datetime('now', 'localtime')),
  updated_at DATETIME DEFAULT (datetime('now', 'localtime'))
)`);

// 解析请求体中的JSON数据
app.use(bodyParser.json());
app.use(cors());


// 新增视频数据的API接口
app.post('/videos', (req, res) => {
    const {unique_url, url, duration, progress} = req.body;
    db.run(
        'INSERT INTO video (unique_url,url, duration, progress) VALUES (?, ?, ?, ?) ON CONFLICT (unique_url) DO UPDATE SET url = excluded.url,duration = excluded.duration, progress = excluded.progress, updated_at = datetime(\'now\', \'localtime\')',
        [unique_url, url, duration, progress], function (err) {
            if (err) {
                console.error(err.message);
                res.status(500).send('Error saving video data to database');
            } else {
                res.status(200).send();
            }
        });

});

// 查询视频播放进度的API接口
app.post('/getVideo', (req, res) => {
    const {unique_url} = req.body;
    db.get(`SELECT * FROM video WHERE unique_url = ?`, [unique_url], function (err, row) {
        if (err) {
            console.error(err.message);
            res.status(500).send('Error querying video data from database');
        } else {
            res.status(200).json({code: 200, row});
        }
    });
});

// 获取最近的未观看完的视频
app.get('/recentUnwatched', (req, res) => {
    db.all(`SELECT url,duration,progress,created_at,updated_at FROM video  WHERE duration-progress>120 ORDER BY updated_at DESC LIMIT 10;`, function (err, rows) {
        if (err) {
            console.error(err.message);
            res.status(500).send('Error querying video data from database');
        } else {
            rows = rows.map(value => {
                // 总进度
                value.duration = dateUtil.formatTime(value.duration);
                // 当前进度
                value.progress = dateUtil.formatTime(value.progress);
                return value;
            })
            res.status(200).json({code: 200, rows});
        }
    });
});
// 启动Node.js服务监听端口
app.listen(port, () => {
    console.log(`Video progress tracking app listening at http://localhost:${port}`);
});