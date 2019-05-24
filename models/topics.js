const Topics = global.db.instance.define('topics', {
    topic_id : { type : global.sequelize.INTEGER, allowNull : false, primaryKey : true}, 
    topic_name : { type : global.sequelize.STRING(512), allowNull : false, unique : true}
})

module.exports = Topics