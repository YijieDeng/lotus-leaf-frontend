# Frontend Utilities

## Trie / NameTree

`Trie` is a dictionary tree. It manages the longest common prefix of a set of strings.
The purpose using this datastructure is to

- Manage topics(data that we are interested) efficiently since lots of them shared common prefixes (like `UW/Mercer/*`, `UW/Alder/*`)
- Manage queries efficiently. If we are querying all the topics from the panel located at Mercer, we can use `like` operator in SQL queries.

We provide 2 versions of name trees. The one located in `snaps/common_snap.js` and the one located in `public/javascript/name_tree.js`. The first one just contains expanding and common prefix querying features which is used at the MiddleEnd.

## Snaps

### common_snap.js

**CommonSnap** contains some auxiliary funcions:
- `expand_trie`: add new names into the Trie (NameTree)
- `construct_name`: construct names from a Trie
- `random_color`: generate a random color using `RGBA` format. Alpha value can be customized 
- `get_ms_by_day`: Convert days to milliseconds
- `get_topic_id_map`: get a map of `topic` -> `topic_id`
- `get_all_categorized_topics`: get a map of `<top level name>` -> `terminals`

### data_snap.js

**DataSnap** currently just has one function that fetch data by a given `tid` (topic_id)

### meta_snap.js

**MetaSnap** currently just has one function that fetch meta information (mainly care about unit) by a given `tid` (topic_id) 

### topic_snap.js

**TopicSnap** contains some functions that interact with database handling queries to `topics`

- **async** `find_all`: get all topics
- **async** `get_name_by_id`: get the name (actual content) of a topic by `tid`
- **async** `get_id_by_name`: get `tid` by a name of topics
- **async** `get_by_name_like`: get a topic name starts with a given prefix