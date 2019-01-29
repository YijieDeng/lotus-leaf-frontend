const DataDB = global.db.load_model('data')

const DataSnap = {
    async get_data_by_tid(tid, where_clause = {}) {
        return (await DataDB.findAll({
            where: Object.assign(where_clause, {topic_id: tid}),
            attributes: ['ts', 'topic_id', 'value_string']
        }))
    }
}

module.exports = DataSnap