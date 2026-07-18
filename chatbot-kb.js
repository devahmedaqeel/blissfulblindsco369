/*
 * Blissful Blinds Co 369 — Chatbot knowledge base loader & retrieval engine.
 *
 * Fetches the markdown files in /knowledge-base/, splits them into headed
 * chunks, and exposes BBKB.search(query, topN) — a plain keyword/TF-IDF
 * search with no external libraries and no build step. This is deliberately
 * extractive (it only ever returns real chunks of the source markdown) so
 * the chatbot can never answer with anything that wasn't actually written
 * into the knowledge base.
 *
 * To update the chatbot's knowledge, edit the .md files in /knowledge-base/
 * — nothing here needs to change.
 */
(function (global) {
  'use strict';

  // sales-playbook.md and common-objections.md are deliberately excluded:
  // they're internal conduct notes written in third person about "the
  // chatbot" (for a human maintainer or another engineer to read), not
  // customer-facing prose — their guidance is already implemented directly
  // in chatbot.js's intent handling, so quoting them verbatim to a visitor
  // would read as broken ("Reference the BBSA-compliant facts in faq.md...").
  var FILES = [
    'company.md', 'services.md', 'products.md', 'faq.md', 'contact.md',
    'locations.md', 'installation.md', 'measuring-guide.md',
    'blind-buying-guide.md', 'warranty.md', 'care-maintenance.md',
    'repairs.md', 'pricing-policy.md'
  ];

  var STOPWORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'to', 'of', 'in', 'on', 'for', 'and', 'or', 'but', 'with', 'as', 'at',
    'by', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'we',
    'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should', 'have',
    'has', 'had', 'my', 'your', 'our', 'me', 'us', 'if', 'so', 'not', 'no',
    // Interrogatives are grammatical, not topical — without this, "what",
    // "how" etc. spuriously match any heading phrased as a question
    // (e.g. "What is NOT confirmed") regardless of actual subject.
    'what', 'how', 'why', 'when', 'where', 'who', 'which', 'whom', 'whose',
    'about', 'get', 'got', 'need', 'want', 'like', 'im', 'am'
  ]);

  // Light synonym expansion so an extractive keyword search still matches
  // common rephrasings without needing a real language model.
  var SYNONYMS = {
    price: ['cost', 'quote', 'quotation', 'pricing', 'expensive', 'cheap'],
    cost: ['price', 'quote', 'quotation', 'pricing'],
    quote: ['price', 'cost', 'quotation', 'pricing'],
    fit: ['install', 'installation', 'fitting'],
    install: ['fit', 'fitting', 'installation'],
    fitting: ['install', 'installation', 'fit'],
    measure: ['measuring', 'measurement', 'measurements'],
    hours: ['open', 'opening', 'time', 'times'],
    open: ['hours', 'opening'],
    child: ['kids', 'children', 'baby', 'toddler', 'safe', 'safety'],
    kids: ['child', 'children', 'safe', 'safety'],
    pet: ['dog', 'cat', 'pets'],
    call: ['phone', 'telephone', 'contact'],
    whatsapp: ['message', 'text', 'chat'],
    delivery: ['deliver', 'lead', 'time', 'wait', 'long'],
    warranty: ['guarantee'],
    guarantee: ['warranty'],
    clean: ['cleaning', 'maintenance', 'care'],
    repair: ['fix', 'broken', 'repairs'],
    area: ['location', 'cover', 'coverage', 'postcode'],
    location: ['area', 'cover', 'coverage', 'postcode'],
    shutter: ['shutters', 'plantation'],
    room: ['bedroom', 'kitchen', 'bathroom', 'living']
  };

  function tokenize(text) {
    return (text.toLowerCase().match(/[a-z0-9']+/g) || [])
      .filter(function (t) { return t.length > 1 && !STOPWORDS.has(t); });
  }

  function expand(tokens) {
    var out = tokens.slice();
    tokens.forEach(function (t) {
      if (SYNONYMS[t]) out = out.concat(SYNONYMS[t]);
    });
    return out;
  }

  // Splits a markdown file (minus its --- frontmatter block) into chunks at
  // each ## heading. The frontmatter's own `source` line is dropped — it's
  // provenance for humans maintaining the KB, not something to surface to a
  // visitor.
  function parseMarkdown(file, raw) {
    var body = raw.replace(/^---[\s\S]*?---\s*/, '');
    var lines = body.split('\n');
    var chunks = [];
    var current = { file: file, heading: file.replace('.md', ''), lines: [] };

    lines.forEach(function (line) {
      var h2 = line.match(/^##\s+(.*)/);
      var h1 = line.match(/^#\s+(.*)/);
      if (h2 || h1) {
        if (current.lines.length) chunks.push(current);
        current = { file: file, heading: (h2 || h1)[1].trim(), lines: [] };
      } else {
        current.lines.push(line);
      }
    });
    if (current.lines.length) chunks.push(current);

    return chunks.map(function (c) {
      var text = c.lines.join('\n').trim();
      var tokens = tokenize(c.heading + ' ' + text);
      var tf = new Map();
      tokens.forEach(function (t) { tf.set(t, (tf.get(t) || 0) + 1); });
      return {
        file: c.file,
        heading: c.heading,
        text: text,
        tf: tf,
        headingTokens: new Set(tokenize(c.heading))
      };
    }).filter(function (c) { return c.text.length > 0; });
  }

  var state = { chunks: [], df: new Map(), ready: null };

  function buildDocFrequency(chunks) {
    var df = new Map();
    chunks.forEach(function (c) {
      c.tf.forEach(function (_, term) {
        df.set(term, (df.get(term) || 0) + 1);
      });
    });
    return df;
  }

  function load(baseUrl) {
    baseUrl = baseUrl || 'knowledge-base/';
    state.ready = Promise.all(
      FILES.map(function (f) {
        return fetch(baseUrl + f)
          .then(function (res) { return res.ok ? res.text() : ''; })
          .then(function (text) { return text ? parseMarkdown(f, text) : []; })
          .catch(function () { return []; });
      })
    ).then(function (perFile) {
      state.chunks = perFile.reduce(function (all, c) { return all.concat(c); }, []);
      state.df = buildDocFrequency(state.chunks);
      return state.chunks.length > 0;
    });
    return state.ready;
  }

  function search(query, topN) {
    topN = topN || 3;
    if (!state.chunks.length) return [];
    var qTokens = expand(tokenize(query));
    if (!qTokens.length) return [];

    var N = state.chunks.length;
    var scored = state.chunks.map(function (c) {
      var score = 0;
      qTokens.forEach(function (t) {
        var tf = c.tf.get(t) || 0;
        if (!tf) return;
        var df = state.df.get(t) || 1;
        var idf = Math.log((N + 1) / df);
        score += tf * idf;
        if (c.headingTokens.has(t)) score += idf * 2; // heading match bonus
      });
      return { chunk: c, score: score };
    });

    return scored
      .filter(function (s) { return s.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, topN)
      .map(function (s) {
        return {
          file: s.chunk.file,
          heading: s.chunk.heading,
          text: s.chunk.text,
          score: s.score
        };
      });
  }

  global.BBKB = {
    load: load,
    search: search,
    ready: function () { return state.ready || Promise.resolve(false); }
  };
})(window);
