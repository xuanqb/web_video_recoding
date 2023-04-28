const Sequelize = require('sequelize');
const fs = require('fs');
const yaml = require('js-yaml');
const config = yaml.load(fs.readFileSync('conf/application.yml', 'utf8'));

const sequelize = new Sequelize(config.database.database, config.database.username, config.database.password, {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
    timezone: '+08:00',
    dialectOptions: {
        dateStrings: true,
        typeCast: true
    }
});

const modelDefiners = [
    require('./models/video.model'),
];

// We define all models according to their files.
for (const modelDefiner of modelDefiners) {
    modelDefiner(sequelize);
}

// 自动建表
sequelize.sync().then();
module.exports = sequelize;
