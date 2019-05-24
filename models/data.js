const Data = global.db.instance.define('data', {
    ts : { type : sequelize.TIME, unique : true }, 
    topic_id : { type : sequelize.INTEGER, allowNull : false, unique : true },
    value_string : { type : sequelize.TEXT, allowNull : false }
})

module.exports = Data