class TrieNode {
  constructor() {
    this.children = {};
    this.words = [];
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;

    for (const ch of word.toLowerCase()) {
      if (!node.children[ch]) {
        node.children[ch] = new TrieNode();
      }

      node = node.children[ch];

      if (!node.words.includes(word) && node.words.length < 10) {
        node.words.push(word);
      }
    }
  }

  search(prefix) {
    let node = this.root;

    for (const ch of prefix.toLowerCase()) {
      if (!node.children[ch]) {
        return [];
      }

      node = node.children[ch];
    }

    return node.words;
  }
}

const trie = new Trie();

export default trie;