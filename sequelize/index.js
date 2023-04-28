const Sequelize = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'conf/video.sqlite'
})

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
