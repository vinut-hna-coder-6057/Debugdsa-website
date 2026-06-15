import Bug from "../models/Bug.js";
import Trie from "../services/trieService.js";

let initialized = false;

async function buildTrie() {
  const bugs = await Bug.find({}, "title");

  for (const bug of bugs) {
    trie.insert(bug.title);
  }

  initialized = true;
}

export const getSuggestions = async (req, res) => {
  try {

    if (!initialized) {
      await buildTrie();
    }

    const q = req.query.q || "";

    const suggestions = trie.search(q);

    res.json(suggestions);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};