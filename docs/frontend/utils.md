# Frontend Utilities

## Trie / NameTree

`Trie` is a dictionary tree. It manages the longest common prefix of a set of strings.
The purpose using this datastructure is to

- Manage topics(data that we are interested) efficiently since lots of them shared common prefixes (like `UW/Mercer/*`, `UW/Alder/*`)
- Manage queries efficiently. If we are querying all the topics from the panel located at Mercer, we can use `like` operator in SQL queries.

We provide 2 versions of name trees. The one located in `snaps/common_snap.js` and the one located in `public/javascript/name_tree.js`. The first one just contains expanding and common prefix querying features which is used at the MiddleEnd.

## Snaps

### common_snap.js


### data_snap.js

### meta_snap.js

### topic_snap.js