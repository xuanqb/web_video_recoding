const { DataTypes } = require('sequelize');

const Video = (sequelize)=>{
    sequelize.define('video', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        unique_url: {
            type: DataTypes.STRING(1024),
            unique: true,
            allowNull: false
        },
        url: {
            type: DataTypes.STRING(1024),
            allowNull: false
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        progress: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {freezeTableName: true});
}

module.exports = Video;
