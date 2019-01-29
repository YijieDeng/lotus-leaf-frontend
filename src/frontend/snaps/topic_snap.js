const TopicDB = global.db.load_model('topics')

const TopicSnap = {
    async find_all() {
        return await TopicDB.findAll({
            attributes: ['topic_id', 'topic_name']
        })
    },
    async get_name_by_id(topic_id) {
        return await TopicDB.findById(topic_id)
    },
    async get_id_by_name(name) {
        return await TopicDB.findAll({
            where: {
                topic_name: name
            },
            attributes : ['topic_id', 'topic_name']
        })
    },
    async get_by_name_like(prefix, where_clause = {}) {
        return (await TopicDB.findAll({
            where: Object.assign(where_clause, {
                topic_name: {
                    $like: `${prefix}%`
                }
            }),
            attributes: ['topic_id', 'topic_name']
        }))
    }
}

module.exports = TopicSnap