const TopicDB = global.db.load_model('topics')

const TopicSnap = {
    async find_all() {
        return await TopicDB.findAll({
            attributes: ['topic_id', 'topic_name']
        })
    },
    get_name_by_id(topic_id) {
        return TopicDB.findById(topic_id)
    }
}

module.exports = TopicSnap