const MetaDB = global.db.load_model('meta')

const MetaSnap = {
    async get_meta_by_tid(id, where_clause={}) {
        return await MetaDB.findAll({
            where: Object.assign(where_clause, {topic_id: id})
        })
    }
}

module.exports = MetaSnap