const { DataTypes } = require('sequelize');

const Video = (sequelize)=>{
    sequelize.define('video_watching_data', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        watch_time: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        }
    }, {freezeTableName: true});
}

module.exports = Video;
