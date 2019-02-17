const TopicSnap = global.db.load_snap('topic_snap')

const CommonSnap = {
    /**
     * Insert the solar panel information into a name tree (word trie tree).
     * The path is split by '/', the leaves are arrays that contains
     * the terminal destination.
     *
     * @param dict     current tree of names
     * @param name_arr the name and path information array (string split by '/')
     * @returns {*} a new object that contains updated data.
     */
    expand_trie(dict, name_arr) {
            if (name_arr.length === 0) return dict
            else if (name_arr.length === 1) {
                if (!dict.hasOwnProperty('places')) dict['places'] = []
                dict.places.push(name_arr[0])
            } else {
                const hd = name_arr[0]
                if (!dict.hasOwnProperty(hd)) dict[hd] = {}
                this.expand_trie(dict[hd], name_arr.slice(1))
                return dict
            }
    },

    /**
     * Construct the optimized name presentation according to the name tree.
     *
     * @param dict         name tree
     * @param name_prefix  the prefix of the name of the solar panel
     * @returns {{}} An object mapping common prefix to list of name terminations.
     */
    construct_names(dict, name_prefix) {
        if (typeof dict === 'undefined' || dict === {} || Object.keys(dict).length === 0) {
            return {}
        } else {
            const keys = Object.keys(dict)
            let name_obj = {}
            if (keys.length === 1 && keys[0] === 'places') {
                name_obj[name_prefix] = [name_prefix]
                for (let i = 0; i < dict[keys[0]].length; ++i) {
                    name_obj[name_prefix].push(dict[keys[0]][i])
                }
            } else {
                for (let i = 0; i < keys.length; ++i) {
                    const key = keys[i]
                    const next_level = this.construct_names(dict[key], name_prefix + '/' + key)
                    Object.assign(name_obj, next_level)
                }
            }
            return name_obj
        }
    },

    /**
     * Generate random color written in a String
     *
     * @returns {string} the random color represented by call of rgba function
     */
    random_color(alpha=1.0) {
        let rand_num = () => {
            return Math.floor(Math.random() * 256)
        }
        return `rgba(${rand_num()}, ${rand_num()}, ${rand_num()}, ${alpha})`
    },

    get_ms_by_day(num_of_days) {
        return num_of_days * 24 * 60 * 60 * 1000
    },

    async get_topic_id_map(topics_list) {
        // Get topic id and make into a map from names to ids
        topics_list.sort((x, y) => {
            return x.length - y.length
        })
        let name_set = new Set()
        let topic_id_map = {}

        for (let i = 0; i < topics_list.length; ++i) {
            if (!name_set.has(topics_list[i])) {
                let similar_names = (await TopicSnap.get_by_name_like(topics_list[i]))
                for (let j = 0; j < similar_names.length; ++j) {
                    name_set.add(similar_names[j].topic_name)
                    topic_id_map[similar_names[j].topic_name] = similar_names[j].topic_id
                }
            }
        }

        return topic_id_map
    },

    async get_all_categorized_topics() {
        const topic_names = await TopicSnap.find_all()
        let name_tree = {}
        for (let i = 0; i < topic_names.length; ++i) {
            const topic = topic_names[i]
            let topic_name = topic.topic_name
            let name_component = topic_name.split('/')
            name_tree = this.expand_trie(name_tree, name_component)
        }
        let names = {}
        await Object.keys(name_tree).forEach((top_level_keys) => {
            let next_value = this.construct_names(name_tree[top_level_keys], top_level_keys)
            Object.assign(names, next_value)
        })
        return names
    }
}

module.exports = CommonSnap
