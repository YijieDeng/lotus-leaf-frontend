const Meta = global.db.instance.define('meta', {
    topic_id : { type : global.sequelize.INTEGER, allowNull : false, primaryKey : true},
    metadata : { type : global.sequelize.TEXT, allowNull : false}
})

module.exports = Meta