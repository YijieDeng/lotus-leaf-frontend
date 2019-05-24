const VTDefinition = global.db.instance.define('volttron_table_definitions', {
    table_id : { type : global.sequelize.STRING(512), allowNull : false , primaryKey : true}, 
    table_name : { type : global.sequelize.STRING(512), allowNull : false }, 
    table_prefix : { type : global.sequelize.STRING(512),  allowNull : true }, 
})

module.exports = VTDefinition