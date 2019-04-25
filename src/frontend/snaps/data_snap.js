const DataDB = global.db.load_model('data')

const DataSnap = {
    async get_data_by_tid(tid, where_clause = {}, order = []) {
        return (await DataDB.findAll({
            where: Object.assign(where_clause, {topic_id: tid}),
            order: order,
            attributes: ['ts', 'topic_id', 'value_string']
        }))
    }
}

module.exports = DataSnap
