/*
 * Blissful Blinds — AI Sales & Support Assistant.
 *
 * Self-contained widget: builds its own DOM inside #bb-chatbot-root, loads
 * its own CSS/knowledge base, and never touches any selector, id, or global
 * used by app.js or styles.css. Safe to remove by deleting the container
 * div + the two <link>/<script> tags that load this file.
 *
 * Answers are extractive only (see chatbot-kb.js) — the bot only ever
 * surfaces text that already exists in /knowledge-base/, so it cannot
 * hallucinate facts or prices.
 */
(function () {
  'use strict';
  if (window.__bbChatInit) return;
  window.__bbChatInit = true;

  // document.currentScript is only available synchronously while this
  // script is first executing, so it must be captured here at the top
  // level — not inside the deferred boot() below.
  var scriptEl = document.currentScript;

  function boot() {
  var PHONE_DISPLAY = '01733 853037';
  var PHONE_TEL = '+441733853037';
  var WHATSAPP_URL = 'https://api.whatsapp.com/send?phone=+447341645339';
  var HISTORY_KEY = 'bb_chat_history_v1';
  var OPENED_BEFORE_KEY = 'bb_chat_opened_before';
  var MAX_HISTORY = 40;

  // ---- Resolve base path so this one file works from both the site root
  // (index.html) and one folder deep (roller-blinds/index.html etc.) ----
  var basePath = scriptEl ? scriptEl.src.replace(/chatbot\.js(\?.*)?$/, '') : './';

  var root = document.getElementById('bb-chatbot-root');
  if (!root) return;

  // ---------------------------------------------------------------------
  // DOM template
  // ---------------------------------------------------------------------
  root.innerHTML =
    '<div class="bb-chat-widget" id="bb-chat-widget">' +
      '<button type="button" class="bb-chat-toggle" id="bb-chat-toggle" aria-haspopup="dialog" aria-expanded="false" aria-controls="bb-chat-panel" aria-label="Chat with Blissful Blinds">' +
        '<svg class="bb-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
        '<svg class="bb-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '<span class="bb-chat-badge" id="bb-chat-badge">1</span>' +
      '</button>' +

      '<section class="bb-chat-panel" id="bb-chat-panel" role="dialog" aria-modal="false" aria-labelledby="bb-chat-title" hidden>' +
        '<header class="bb-chat-header">' +
          '<div class="bb-chat-header-info">' +
            '<span class="bb-chat-avatar" aria-hidden="true">' +
              '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h5"/></svg>' +
            '</span>' +
            '<div>' +
              '<div class="bb-chat-title" id="bb-chat-title">Blissful Blinds Assistant</div>' +
              '<div class="bb-chat-subtitle"><span class="bb-status-dot" aria-hidden="true"></span> Usually replies instantly</div>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="bb-chat-close" id="bb-chat-close" aria-label="Close chat">&times;</button>' +
        '</header>' +

        '<div class="bb-chat-messages" id="bb-chat-messages" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation with Blissful Blinds Assistant"></div>' +

        '<div class="bb-chat-suggestions" id="bb-chat-suggestions" aria-label="Suggested questions"></div>' +

        '<form class="bb-chat-input-row" id="bb-chat-form">' +
          '<label for="bb-chat-input" class="bb-sr-only">Type your message</label>' +
          '<input type="text" id="bb-chat-input" autocomplete="off" placeholder="Type your message&hellip;" maxlength="400">' +
          '<button type="submit" class="bb-chat-send" id="bb-chat-send" aria-label="Send message">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>' +
          '</button>' +
        '</form>' +

        '<div class="bb-chat-footer">' +
          '<a href="tel:' + PHONE_TEL + '">&#128222; Call ' + PHONE_DISPLAY + '</a>' +
          '<a href="' + WHATSAPP_URL + '" target="_blank" rel="noopener">&#128172; WhatsApp</a>' +
        '</div>' +
      '</section>' +
    '</div>';

  var widgetEl = document.getElementById('bb-chat-widget');
  var toggleBtn = document.getElementById('bb-chat-toggle');
  var panelEl = document.getElementById('bb-chat-panel');
  var closeBtn = document.getElementById('bb-chat-close');
  var messagesEl = document.getElementById('bb-chat-messages');
  var suggestionsEl = document.getElementById('bb-chat-suggestions');
  var formEl = document.getElementById('bb-chat-form');
  var inputEl = document.getElementById('bb-chat-input');
  var badgeEl = document.getElementById('bb-chat-badge');

  var kbLoadStarted = false;
  var quiz = null; // active product-recommendation quiz state, or null

  // ---------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------
  function loadHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
    } catch (e) { /* storage unavailable — conversation just won't persist */ }
  }

  var history = loadHistory();

  // ---------------------------------------------------------------------
  // Message rendering
  // ---------------------------------------------------------------------
  function formatTime(ts) {
    var d = new Date(ts);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderMessage(msg) {
    var wrap = document.createElement('div');
    wrap.className = 'bb-msg ' + (msg.role === 'user' ? 'bb-msg-user' : 'bb-msg-bot');

    var bubble = document.createElement('div');
    bubble.className = 'bb-msg-bubble';
    bubble.innerHTML = msg.html;
    wrap.appendChild(bubble);

    var time = document.createElement('div');
    time.className = 'bb-msg-time';
    time.textContent = formatTime(msg.time);
    wrap.appendChild(time);

    messagesEl.appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  function addMessage(role, html, opts) {
    opts = opts || {};
    var msg = { role: role, html: html, time: Date.now() };
    var el = renderMessage(msg);
    if (!opts.skipSave) {
      history.push(msg);
      saveHistory(history);
    }
    return el; // the rendered .bb-msg DOM node — callers that need to
    // further manipulate what was just posted (e.g. showLeadForm reading
    // its own bubble back out) need the element, not the plain message
    // record; nothing currently reads the message record from the
    // return value, only from `history`.
  }

  function showTyping() {
    var el = document.createElement('div');
    el.className = 'bb-msg bb-msg-bot';
    el.id = 'bb-typing-indicator';
    el.innerHTML = '<div class="bb-typing" role="status" aria-label="Assistant is typing"><span></span><span></span><span></span></div>';
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function hideTyping() {
    var el = document.getElementById('bb-typing-indicator');
    if (el) el.remove();
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ---------------------------------------------------------------------
  // Suggested question chips
  // ---------------------------------------------------------------------
  function setSuggestions(items) {
    suggestionsEl.innerHTML = '';
    items.forEach(function (item) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'bb-chip';
      chip.textContent = item.label;
      chip.addEventListener('click', function () {
        if (item.action) {
          item.action();
        } else {
          submitUserText(item.label);
        }
      });
      suggestionsEl.appendChild(chip);
    });
  }

  var DEFAULT_SUGGESTIONS = [
    { label: 'What blinds do you offer?' },
    { label: 'How much do blinds cost?' },
    { label: 'Do you cover my area?' },
    { label: 'Help me choose a blind', action: function () { startQuiz(); } },
    { label: 'Book a consultation', action: function () { showLeadForm(); } }
  ];

  // ---------------------------------------------------------------------
  // Knowledge base loading (deferred to first open, for performance)
  // ---------------------------------------------------------------------
  function ensureKBLoaded() {
    if (kbLoadStarted || !window.BBKB) return;
    kbLoadStarted = true;
    window.BBKB.load(basePath + 'knowledge-base/');
  }

  // ---------------------------------------------------------------------
  // Contact / lead-gen snippets (kept short so they compose well with
  // other answers)
  // ---------------------------------------------------------------------
  function contactBlock() {
    return '<br><br>&#128222; Call: <a href="tel:' + PHONE_TEL + '">' + PHONE_DISPLAY + '</a>' +
      '<br>&#128172; WhatsApp: <a href="' + WHATSAPP_URL + '" target="_blank" rel="noopener">' + PHONE_DISPLAY + '</a>';
  }

  var FALLBACK_TEXT = "I couldn't find confirmed information about that.<br><br>Please contact our team and we'll be happy to help." + contactBlock();

  var BUYING_INTENT_NUDGES = [
    'Would you like to request a quotation?',
    'Would you like to book a measuring appointment?',
    'Would you like our team to contact you?'
  ];

  function nudgeSuggestions() {
    return [
      { label: 'Request a quotation', action: function () { showLeadForm('quotation'); } },
      { label: 'Book a measuring appointment', action: function () { showLeadForm('appointment'); } },
      { label: 'Have the team call me', action: function () { showLeadForm('callback'); } }
    ];
  }

  // ---------------------------------------------------------------------
  // Product catalog response (mirrors knowledge-base/products.md &
  // services.md — the confirmed product/service list, verbatim names only)
  // ---------------------------------------------------------------------
  var CATALOG_TEXT =
    'We supply and fit a full range of made-to-measure window coverings:<br><br>' +
    '&bull; Roller Blinds<br>' +
    '&bull; Vertical Blinds<br>' +
    '&bull; Venetian Blinds (real wood, faux wood &amp; aluminium)<br>' +
    '&bull; Perfect Fit Blinds (no-drill, for UPVC windows)<br>' +
    '&bull; Vision (Day &amp; Night) Blinds<br>' +
    '&bull; Pleated / Cellular Blinds<br>' +
    '&bull; Roman Blinds<br>' +
    '&bull; Wooden Blinds<br>' +
    '&bull; Blackout Blinds<br>' +
    '&bull; Window Shutters (plantation shutters)<br><br>' +
    'Motorised operation is available on select ranges, and we also supply commercial &amp; landlord blinds packages.<br><br>' +
    'Want help picking the right one for your room?';

  // ---------------------------------------------------------------------
  // Intent detection
  // ---------------------------------------------------------------------
  var RE = {
    greeting: /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/i,
    pricing: /\b(price|prices|pricing|cost|costs|how much|quote|quotation|expensive|cheap|discount|deal|deals|afford)\b|\b(special|current|any) offers?\b/i,
    // "offer" alone is deliberately excluded above — "what blinds do you
    // offer" is a catalog question, not a pricing one, and the bare word
    // was wrongly routing it into the pricing script. "any offers"/
    // "special offer"/"current offer" still catch the deal-seeking sense.
    catalog: /\b(what (blinds|products) (do you )?(offer|have|sell|provide|stock)|which blinds (do you have|are available)|range of blinds|product range|full range|types? of blinds)\b/i,
    install: /\b(install|installation|fit|fitting|fitted)\b/i,
    repair: /\b(repair|broken|fix|fixed|spare part)\b/i,
    appointment: /\b(appointment|book|booking|visit|consultation|schedule)\b/i,
    commercial: /\b(commercial|office|landlord|business|rental|tenant)\b/i,
    compare: /\b(vs|versus|better|compare|comparison|difference between)\b/i,
    availability: /\b(available|availability|stock|delivery|deliver|lead time|how long|wait|waiting)\b/i,
    custom: /\bcustom(ise|ize|-made)?\b|bespoke/i,
    contact: /\b(phone|call|number|email|whatsapp|contact|address|located|location|opening hours|open|hours)\b/i,
    recommend: /\b(recommend|which blind|which one|help me choose|not sure what|best blind|suggest)\b/i,
    thanks: /\b(thanks|thank you|cheers|appreciate it)\b/i,
    bye: /\b(bye|goodbye|see you|that's all)\b/i
  };

  function isBuyingIntent(text) {
    return RE.install.test(text) || RE.repair.test(text) || RE.appointment.test(text) ||
      RE.commercial.test(text) || RE.compare.test(text) || RE.availability.test(text) ||
      RE.custom.test(text);
  }

  // ---------------------------------------------------------------------
  // Pricing policy response (mirrors knowledge-base/pricing-policy.md)
  // ---------------------------------------------------------------------
  var OFFER_TABLE = [
    { keys: ['4 vertical', 'vertical.*4', '4.*vertical'], html: '<strong>4 Vertical Blinds Package</strong> — &pound;199 / 4 windows. Includes measuring, fitting &amp; a 1-year guarantee. T&amp;Cs apply.' },
    { keys: ['4 roller', 'roller.*4', '4.*roller'], html: '<strong>4 Roller Blinds</strong> — from &pound;239 / 4 windows. Includes measuring, fitting &amp; child-safe operation. T&amp;Cs apply.' },
    { keys: ['full house', '6 window', 'whole house', 'entire house'], html: '<strong>Full House Vertical Blinds</strong> — &pound;299 for up to 6 windows. T&amp;Cs apply.' },
    { keys: ['conservatory'], html: '<strong>Conservatory Vertical Blinds</strong> — &pound;349 complete fitting. T&amp;Cs apply.' },
    { keys: ['venetian', 'vision', 'roman', 'skylight', 'shutter'], html: '<strong>25% OFF</strong> selected Venetian, Vision Day &amp; Night, Roman, Skylight and Shutter blinds.' }
  ];

  function findMatchingOffer(text) {
    var lower = text.toLowerCase();
    for (var i = 0; i < OFFER_TABLE.length; i++) {
      var offer = OFFER_TABLE[i];
      for (var j = 0; j < offer.keys.length; j++) {
        if (new RegExp(offer.keys[j]).test(lower)) return offer.html;
      }
    }
    return null;
  }

  function pricingResponse(text) {
    var html = 'Every window is unique, so we provide personalised quotations based on measurements, ' +
      'product selection, and installation requirements.<br><br>' +
      'For an accurate quotation, please contact our team.' + contactBlock() +
      '<br><br>We\'ll be happy to provide a no-obligation quotation at no extra cost to you.';

    var offer = findMatchingOffer(text);
    if (offer) {
      html += '<br><br>If it helps — we currently have this advertised package running: ' + offer;
    }
    return html;
  }

  function pricingPushbackResponse() {
    return 'Totally understandable — pricing depends on a few real factors: window size, product type, ' +
      'material, colour, quantity, motorisation, and installation.<br><br>' +
      'Because of that we can only give an accurate number after a quick, no-obligation home visit — ' +
      'nothing is charged for the consultation itself.' + contactBlock();
  }

  // ---------------------------------------------------------------------
  // Product recommendation quiz (chip-driven, deterministic — mirrors
  // knowledge-base/blind-buying-guide.md facts exactly)
  // ---------------------------------------------------------------------
  var QUIZ_ROOMS = [
    { label: 'Bedroom / nursery', key: 'bedroom' },
    { label: 'Kitchen / bathroom', key: 'wet' },
    { label: 'Living room / dining', key: 'living' },
    { label: 'Conservatory / skylight', key: 'conservatory' },
    { label: 'Large window / patio door', key: 'large' },
    { label: 'Home office', key: 'office' }
  ];

  var QUIZ_PRIORITIES = [
    { label: 'Total privacy & blackout', key: 'blackout' },
    { label: 'Flexible light control', key: 'light' },
    { label: 'Child / pet safety', key: 'safety' },
    { label: 'Energy efficiency', key: 'energy' },
    { label: 'Classic, elegant style', key: 'style' }
  ];

  var RECOMMENDATIONS = {
    'bedroom|blackout': 'For a bedroom or nursery needing total darkness, our <strong>Blackout Blinds</strong> are the natural fit — premium light-blocking lining gives 100% light blockout with no gaps. Cordless <strong>Perfect Fit</strong> or <strong>Pleated</strong> blinds are also worth considering for extra child safety.',
    'bedroom|safety': 'For a bedroom or nursery, <strong>Perfect Fit Blinds</strong> are 100% cordless with no hanging cords or loops, or a cordless <strong>Pleated Blind</strong> — both are safe choices around children.',
    'bedroom|energy': '<strong>Pleated (Cellular) Blinds</strong> use a honeycomb structure that traps air as a thermal barrier — good for keeping a bedroom warmer in winter.',
    'wet|light': '<strong>Faux Wood Venetian Blinds</strong> are 100% moisture-proof and give precise tilt control for light — ideal for kitchens and bathrooms.',
    'wet|safety': 'A <strong>Waterproof PVC Roller Blind</strong> or <strong>Perfect Fit Blind</strong> (cordless, clips into the frame) both suit damp rooms with children around.',
    'wet|energy': '<strong>Faux Wood Venetian Blinds</strong> won\'t warp or crack in humid rooms and are low-maintenance to boot.',
    'living|style': '<strong>Roman Blinds</strong> bring warmth and texture in a huge range of fabrics, or <strong>Wooden Blinds</strong> for a natural, elegant finish.',
    'living|light': '<strong>Vision (Day & Night) Blinds</strong> give you sheer-to-blackout control from one blind, great for a living or dining room.',
    'conservatory|energy': '<strong>Pleated Blinds</strong> are the go-to for conservatories and skylights — thermal &amp; blackout fabric options with a compact fold that fits irregular angles.',
    'conservatory|light': '<strong>Vision Blinds</strong> or <strong>Pleated Blinds</strong> both give strong light control in a conservatory.',
    'large|light': '<strong>Vertical Blinds</strong> are the most popular choice for large windows and patio doors, with full-length slat control.',
    'large|style': '<strong>Tracked Window Shutters</strong> fold back 180° and suit patio sliders and bi-folds beautifully.',
    'office|light': '<strong>Vision Blinds</strong> in an Anthracite Capri fabric are specifically noted as good for shielding computer screens from glare.'
  };

  function quizFallback(roomKey) {
    return 'Based on what you\'ve told me, a few options from our range are worth considering — see our full range for details, or let our team advise you during a no-cost home visit.' + contactBlock();
  }

  function startQuiz() {
    quiz = { step: 'room' };
    addMessage('bot', 'Happy to help you choose. Which room is this blind for?');
    setSuggestions(QUIZ_ROOMS.map(function (r) {
      return { label: r.label, action: function () { answerQuizRoom(r); } };
    }));
  }

  function answerQuizRoom(room) {
    addMessage('user', room.label);
    quiz.room = room.key;
    quiz.step = 'priority';
    showTyping();
    setTimeout(function () {
      hideTyping();
      addMessage('bot', 'Got it. What matters most to you for that room?');
      setSuggestions(QUIZ_PRIORITIES.map(function (p) {
        return { label: p.label, action: function () { answerQuizPriority(p); } };
      }));
    }, 500);
  }

  function answerQuizPriority(priority) {
    addMessage('user', priority.label);
    var key = quiz.room + '|' + priority.key;
    quiz = null;
    showTyping();
    setTimeout(function () {
      hideTyping();
      var text = RECOMMENDATIONS[key] || quizFallback();
      addMessage('bot', text);
      setSuggestions(nudgeSuggestions().concat([{ label: 'Ask about something else', action: function () { setSuggestions(DEFAULT_SUGGESTIONS); addMessage('bot', 'Sure — what else can I help with?'); } }]));
    }, 650);
  }

  // ---------------------------------------------------------------------
  // Lead capture form (cosmetic only — mirrors the site's existing
  // booking form fields and behaviour; nothing is sent to a backend,
  // matching how the site's own #bookingForm already works today)
  // ---------------------------------------------------------------------
  var leadFormCounter = 0;

  function showLeadForm(context) {
    leadFormCounter++;
    var id = 'bb-lead-' + leadFormCounter;
    var intro = context === 'appointment' ? 'Great — let\'s get a measuring appointment booked in.' :
      context === 'callback' ? 'No problem — leave your details and our team will call you back.' :
      'Great — let\'s get your quotation request sent over.';

    addMessage('bot', intro);

    var formHtml =
      '<form class="bb-lead-form" id="' + id + '" novalidate>' +
        '<div class="bb-lead-form-row">' +
          '<div><label for="' + id + '-name">Name*</label><input type="text" id="' + id + '-name" required></div>' +
          '<div><label for="' + id + '-phone">Phone*</label><input type="tel" id="' + id + '-phone" required></div>' +
        '</div>' +
        '<div><label for="' + id + '-email">Email*</label><input type="email" id="' + id + '-email" required></div>' +
        '<div class="bb-lead-form-row">' +
          '<div><label for="' + id + '-postcode">Postcode*</label><input type="text" id="' + id + '-postcode" required></div>' +
          '<div><label for="' + id + '-date">Preferred date</label><input type="date" id="' + id + '-date"></div>' +
        '</div>' +
        '<div><label for="' + id + '-time">Preferred time</label><select id="' + id + '-time">' +
          '<option value="">Select&hellip;</option><option>Morning</option><option>Afternoon</option><option>Evening</option>' +
        '</select></div>' +
        '<div><label for="' + id + '-message">Message</label><textarea id="' + id + '-message" rows="2"></textarea></div>' +
        // Honeypot — hidden from real visitors via inline styles + off-screen
        // position; a real user never sees or fills this field, so any
        // request that arrives with it populated is a bot.
        '<div style="position:absolute;left:-9999px;top:-9999px;height:0;width:0;overflow:hidden;" aria-hidden="true">' +
          '<label for="' + id + '-website">Leave this field empty</label>' +
          '<input type="text" id="' + id + '-website" tabindex="-1" autocomplete="off">' +
        '</div>' +
        '<button type="submit" class="bb-lead-submit">Send Request</button>' +
      '</form>';

    var renderedAt = Date.now();
    var wrap = addMessage('bot', formHtml, { skipSave: true });
    var formNode = document.getElementById(id);
    formNode.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById(id + '-name').value.trim();
      var phone = document.getElementById(id + '-phone').value.trim();
      var email = document.getElementById(id + '-email').value.trim();
      var postcode = document.getElementById(id + '-postcode').value.trim();
      var date = document.getElementById(id + '-date').value;
      var time = document.getElementById(id + '-time').value;
      var message = document.getElementById(id + '-message').value.trim();
      var website = document.getElementById(id + '-website').value.trim();
      if (!name || !phone || !email || !postcode) {
        formNode.querySelectorAll('input[required]').forEach(function (inp) {
          if (!inp.value.trim()) inp.style.borderColor = '#ef4444';
        });
        return;
      }

      var submitBtn = formNode.querySelector('.bb-lead-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      sendChatLeadNotification({ name: name, phone: phone, email: email, postcode: postcode, date: date, time: time, message: message, website: website, renderedAt: renderedAt })
        .then(function (ok) {
          var resultHtml = ok
            ? '<div class="bb-lead-success">&#9989; Thanks, ' + escapeHtml(name) + '! Your request has been sent — our team will contact you shortly on ' + escapeHtml(phone) + '.</div>'
            : '<div class="bb-lead-success">We couldn\'t send that through the site just now. Please contact us directly so we don\'t miss you:' + contactBlock() + '</div>';
          formNode.outerHTML = resultHtml;
          history.push({ role: 'bot', html: wrap.querySelector('.bb-msg-bubble').innerHTML, time: Date.now() });
          saveHistory(history);
          setSuggestions(DEFAULT_SUGGESTIONS);
        });
    });
  }

  // Sends the chatbot's lead form to /api/notify (a Vercel Serverless
  // Function in this same deployment — see /api/notify.js), the same
  // endpoint the site's main booking form uses (admin notification +
  // customer confirmation via Gmail SMTP / Nodemailer). Resolves to
  // true/false rather than throwing, so the caller can always show the
  // visitor a clear outcome instead of a silently-broken form.
  function sendChatLeadNotification(data) {
    return fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'chatbot-lead',
        name: data.name,
        phone: data.phone,
        email: data.email,
        postcode: data.postcode,
        appointmentDate: data.date,
        appointmentTime: data.time,
        message: data.message,
        website: data.website,
        renderedAt: data.renderedAt,
        pageUrl: window.location.href,
        referrer: document.referrer || ''
      })
    }).then(function (res) { return res.ok; }).catch(function () { return false; });
  }

  // ---------------------------------------------------------------------
  // Knowledge-base fallback answer
  // ---------------------------------------------------------------------
  function kbAnswer(text) {
    if (!window.BBKB) return FALLBACK_TEXT;
    var results = window.BBKB.search(text, 3);
    if (!results.length) return FALLBACK_TEXT;

    var top = results[0];
    var parts = [escapeHtml(top.text).replace(/\n/g, '<br>')];

    if (results[1] && results[1].file !== top.file && results[1].score >= top.score * 0.6) {
      parts.push(escapeHtml(results[1].text).replace(/\n/g, '<br>'));
    }
    return parts.join('<br><br>');
  }

  // ---------------------------------------------------------------------
  // Main response generator
  // ---------------------------------------------------------------------
  function generateResponse(rawText) {
    var text = rawText.trim();

    if (RE.thanks.test(text) && text.length < 40) {
      return { html: 'You\'re very welcome! Anything else I can help with?', suggestions: DEFAULT_SUGGESTIONS };
    }
    if (RE.bye.test(text) && text.length < 40) {
      return { html: 'Thanks for stopping by! Reach us anytime.' + contactBlock(), suggestions: DEFAULT_SUGGESTIONS };
    }
    if (RE.greeting.test(text) && text.length < 30) {
      return {
        html: 'Hello! I\'m the Blissful Blinds assistant. I can help you choose a blind, answer questions about our products and service areas, or get you booked in with the team. What would you like to know?',
        suggestions: DEFAULT_SUGGESTIONS
      };
    }
    if (RE.recommend.test(text)) {
      startQuiz();
      return null; // startQuiz manages its own messages/suggestions
    }
    if (RE.catalog.test(text)) {
      return {
        html: CATALOG_TEXT,
        suggestions: [{ label: 'Help me choose a blind', action: function () { startQuiz(); } }].concat(nudgeSuggestions())
      };
    }
    if (RE.pricing.test(text)) {
      return { html: pricingResponse(text), suggestions: nudgeSuggestions() };
    }

    var buying = isBuyingIntent(text);
    var answer = kbAnswer(text);
    var suggestions = DEFAULT_SUGGESTIONS;

    if (buying) {
      var nudge = BUYING_INTENT_NUDGES[Math.floor(Math.random() * BUYING_INTENT_NUDGES.length)];
      answer += '<br><br>' + nudge;
      suggestions = nudgeSuggestions();
    }

    return { html: answer, suggestions: suggestions };
  }

  // ---------------------------------------------------------------------
  // Pricing pushback detection: user asks for price again after already
  // receiving the standard pricing response once in this session
  // ---------------------------------------------------------------------
  var pricingAskCount = 0;

  function submitUserText(text) {
    text = (text || '').trim();
    if (!text) return;

    addMessage('user', escapeHtml(text));
    inputEl.value = '';
    ensureKBLoaded();
    showTyping();

    var responded = false;
    function respond() {
      if (responded) return;
      responded = true;
      hideTyping();
      if (RE.pricing.test(text)) pricingAskCount++;

      var result;
      if (RE.pricing.test(text) && pricingAskCount > 1) {
        result = { html: pricingPushbackResponse(), suggestions: nudgeSuggestions() };
      } else {
        result = generateResponse(text);
      }
      if (result) {
        addMessage('bot', result.html);
        setSuggestions(result.suggestions || DEFAULT_SUGGESTIONS);
      }
    }

    // Respond once the minimum "thinking" delay has passed AND the
    // knowledge base has finished loading — but never wait more than
    // ~2.5s for the KB even if the fetch is slow or offline, so the
    // assistant always replies. `respond` is idempotent, so whichever
    // path fires first wins and the other is a no-op.
    var minDelay = 500 + Math.random() * 500;
    var kbPromise = window.BBKB ? window.BBKB.ready()['catch'](function () {}) : Promise.resolve();
    var delayPromise = new Promise(function (resolve) { setTimeout(resolve, minDelay); });
    Promise.all([kbPromise, delayPromise]).then(respond);
    setTimeout(respond, 2500);
  }

  // ---------------------------------------------------------------------
  // Open / close
  // ---------------------------------------------------------------------
  var initialized = false;
  // Set by the drag handler below (makeToggleDraggable) for the one
  // click that follows a drag gesture, so the click handler can skip
  // toggling the panel for it. Shared here (rather than local to the
  // drag IIFE) since the click listener that needs to check it is
  // registered before that IIFE runs.
  var toggleJustDragged = false;

  function renderWelcomeIfEmpty() {
    if (history.length) {
      history.forEach(function (msg) { renderMessage(msg); });
      setSuggestions(DEFAULT_SUGGESTIONS);
      return;
    }
    addMessage('bot',
      'Hi, welcome to Blissful Blinds! &#128075; I can help you find the right blind, ' +
      'check pricing &amp; service areas, or get you booked in for a no-cost home visit.<br><br>' +
      'What can I help you with today?'
    );
    setSuggestions(DEFAULT_SUGGESTIONS);
  }

  function openPanel() {
    ensureKBLoaded();
    // Anchor the panel near the toggle button's current position —
    // matters once the toggle has been freely dragged around the screen
    // (see makeToggleDraggable below). No-op on mobile, where the panel
    // is always full-screen regardless of the toggle's position.
    positionPanelNearToggle();
    panelEl.hidden = false;
    widgetEl.classList.add('bb-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    badgeEl.hidden = true;
    try { localStorage.setItem(OPENED_BEFORE_KEY, '1'); } catch (e) {}
    if (!initialized) {
      initialized = true;
      renderWelcomeIfEmpty();
    }
    scrollToBottom();
    setTimeout(function () { inputEl.focus(); }, 50);
  }

  function closePanel() {
    panelEl.hidden = true;
    widgetEl.classList.remove('bb-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.focus();
  }

  // Keeps floating UI clear of the sticky announcement bar + header,
  // whatever their current combined height is at this viewport width —
  // re-read live rather than hard-coded so it stays correct across every
  // breakpoint and if either bar's height ever changes. Shared by the
  // toggle's drag bounds and the panel positioning below.
  function topClearance() {
    var header = document.querySelector('.site-header');
    if (header) {
      var rect = header.getBoundingClientRect();
      if (rect.height > 0) return rect.bottom + 10;
    }
    return 90;
  }

  // Places the panel next to wherever the toggle currently is (it can be
  // anywhere on screen now that it's freely draggable), flipping above/
  // below and left/right as needed so it always fits fully on screen.
  // No-op on mobile, where CSS forces the panel full-screen regardless.
  function positionPanelNearToggle() {
    if (window.innerWidth <= 480) return;
    var margin = 12;
    var toggleRect = toggleBtn.getBoundingClientRect();
    var panelW = Math.min(392, window.innerWidth - 32);
    var panelH = Math.min(640, window.innerHeight - 166);
    var top = topClearance();

    var openAbove = (toggleRect.top - panelH - margin) >= top;
    var panelTop = openAbove
      ? toggleRect.top - panelH - margin
      : toggleRect.bottom + margin;
    panelTop = Math.min(Math.max(panelTop, top), window.innerHeight - panelH - margin);

    var alignLeft = (toggleRect.left + panelW + margin) <= window.innerWidth;
    var panelLeft = alignLeft ? toggleRect.left : toggleRect.right - panelW;
    panelLeft = Math.min(Math.max(panelLeft, margin), window.innerWidth - panelW - margin);

    panelEl.style.left = panelLeft + 'px';
    panelEl.style.top = panelTop + 'px';
    panelEl.style.right = 'auto';
    panelEl.style.bottom = 'auto';
    panelEl.style.width = panelW + 'px';
    panelEl.style.height = panelH + 'px';
    panelEl.style.transformOrigin = (openAbove ? 'bottom' : 'top') + ' ' + (alignLeft ? 'left' : 'right');
  }

  toggleBtn.addEventListener('click', function () {
    // Skip the one click that immediately follows a drag gesture (see
    // makeToggleDraggable below) so dragging the button never also
    // opens/closes the panel.
    if (toggleJustDragged) { toggleJustDragged = false; return; }
    if (panelEl.hidden) openPanel(); else closePanel();
  });
  closeBtn.addEventListener('click', closePanel);

  // ---------------------------------------------------------------------
  // Freely draggable toggle button — lets a visitor drag it anywhere on
  // screen (up, down, left, right), like a mobile chat-head, so it can
  // always be moved out of the way of page content. Position (x, y) is
  // remembered per browser via localStorage and re-clamped into view on
  // resize/rotation. A small movement threshold tells a drag apart from
  // a normal tap, so the button still opens/closes the panel on click as
  // before.
  // ---------------------------------------------------------------------
  (function makeToggleDraggable() {
    var POS_KEY = 'bb_chat_toggle_pos';
    var DRAG_THRESHOLD = 9; // px of movement before a tap becomes a drag
    var EDGE_MARGIN = 12;

    var dragging = false;
    var moved = false;
    var activePointerId = null;
    var startClientX = 0, startClientY = 0;
    var startLeft = 0, startTop = 0;
    var currentLeft = 0, currentTop = 0;
    var rafId = null;
    var pendingX = 0, pendingY = 0;

    function getBounds(w, h) {
      var top = topClearance();
      return {
        minX: EDGE_MARGIN,
        maxX: Math.max(EDGE_MARGIN, window.innerWidth - w - EDGE_MARGIN),
        minY: top,
        maxY: Math.max(top, window.innerHeight - h - EDGE_MARGIN)
      };
    }

    function loadSavedPosition() {
      var raw = null;
      try { raw = localStorage.getItem(POS_KEY); } catch (e) {}
      if (!raw) return null;
      try {
        var parsed = JSON.parse(raw);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number' &&
            !isNaN(parsed.x) && !isNaN(parsed.y)) return parsed;
      } catch (e) {}
      return null;
    }

    function savePosition(x, y) {
      try { localStorage.setItem(POS_KEY, JSON.stringify({ x: x, y: y })); } catch (e) {}
    }

    function init() {
      var rect = toggleBtn.getBoundingClientRect();
      var b = getBounds(rect.width, rect.height);
      var saved = loadSavedPosition();
      var x = saved ? saved.x : rect.left;
      var y = saved ? saved.y : rect.top;
      x = Math.min(Math.max(x, b.minX), b.maxX);
      y = Math.min(Math.max(y, b.minY), b.maxY);
      toggleBtn.style.left = x + 'px';
      toggleBtn.style.top = y + 'px';
      toggleBtn.style.right = 'auto';
      toggleBtn.style.bottom = 'auto';
      currentLeft = x;
      currentTop = y;
    }

    // Document-level move/up listeners (added only while dragging) rather
    // than setPointerCapture — capturing the pointer on the toggle button
    // also redirects its compatibility click event, which can interfere
    // with the button's own click handler above in some browsers.
    //
    // While dragging, position is applied via `transform: translate3d()`
    // (GPU-composited, no layout) instead of writing left/top on every
    // event — writing left/top forces a synchronous reflow each time,
    // and on phones the browser can't keep up with pointermove's event
    // rate, so it drops frames and the button visibly jumps instead of
    // gliding with the finger. left/top are only written once the drag
    // ends. requestAnimationFrame also caps the work to once per frame
    // even if pointermove fires faster than that (a passive listener, so
    // it never blocks the browser's own scroll/compositor work either).
    function applyMove() {
      rafId = null;
      var dx = pendingX - startClientX;
      var dy = pendingY - startClientY;
      if (!moved) {
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        moved = true;
        toggleBtn.classList.add('is-dragging');
      }
      var b = getBounds(toggleBtn.offsetWidth, toggleBtn.offsetHeight);
      currentLeft = Math.min(Math.max(startLeft + dx, b.minX), b.maxX);
      currentTop = Math.min(Math.max(startTop + dy, b.minY), b.maxY);
      toggleBtn.style.transform = 'translate3d(' + (currentLeft - startLeft) + 'px, ' + (currentTop - startTop) + 'px, 0)';
    }

    function onPointerMove(e) {
      if (!dragging || e.pointerId !== activePointerId) return;
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (rafId === null) rafId = requestAnimationFrame(applyMove);
    }

    function finishDrag() {
      if (!dragging) return;
      dragging = false;
      activePointerId = null;
      // Flush any move that arrived after the last rAF-scheduled update
      // ran, so the release position is exactly where the pointer was
      // let go instead of lagging one frame behind.
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; applyMove(); }
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('blur', finishDrag);

      if (!moved) {
        toggleBtn.classList.remove('is-dragging');
        return;
      }

      // Commit the exact release position first, instantly (still under
      // `is-dragging`'s transition:none) — this becomes the start point
      // for the eased magnetic-snap animation below, so the release
      // feels like a continuation of the drag instead of a jump.
      toggleBtn.style.transform = '';
      toggleBtn.style.left = currentLeft + 'px';
      toggleBtn.style.top = currentTop + 'px';
      // Flags the click that follows this drag gesture so the toggle's
      // own click handler (registered above) skips it. Checked inline
      // rather than via a one-time document-level capture listener with
      // preventDefault()+stopPropagation() — that approach worked, but
      // stopping propagation on a click this way was found to also
      // interfere with a browser's user-activation bookkeeping, silently
      // breaking a *later*, genuinely separate click on the button.
      toggleJustDragged = true;

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var b = getBounds(toggleBtn.offsetWidth, toggleBtn.offsetHeight);
          // Magnetic edge snap — settle horizontally to whichever side
          // (left/right) is closer, like WhatsApp/Messenger chat heads.
          // Vertical position stays exactly where it was released.
          var snappedX = (currentLeft - b.minX) <= (b.maxX - currentLeft) ? b.minX : b.maxX;
          var clampedY = Math.min(Math.max(currentTop, b.minY), b.maxY);

          if (snappedX !== currentLeft || clampedY !== currentTop) {
            toggleBtn.classList.add('is-snapping');
            toggleBtn.style.left = snappedX + 'px';
            toggleBtn.style.top = clampedY + 'px';
          }
          currentLeft = snappedX;
          currentTop = clampedY;
          savePosition(currentLeft, currentTop);

          var cleanup = function () {
            toggleBtn.classList.remove('is-dragging', 'is-snapping');
            toggleBtn.removeEventListener('transitionend', cleanup);
          };
          toggleBtn.addEventListener('transitionend', cleanup);
          setTimeout(cleanup, 400); // fallback in case transitionend never fires
        });
      });
    }
    var onPointerUp = finishDrag;

    toggleBtn.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (dragging) return; // already tracking a different pointer
      dragging = true;
      moved = false;
      // Clear any stale flag from a previous drag whose release click
      // never landed back on this button (e.g. released far away) —
      // every legitimate click is preceded by its own pointerdown here,
      // so this guarantees the flag never leaks into an unrelated tap.
      toggleJustDragged = false;
      activePointerId = e.pointerId;
      startClientX = e.clientX;
      startClientY = e.clientY;
      var rect = toggleBtn.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      currentLeft = startLeft;
      currentTop = startTop;
      document.addEventListener('pointermove', onPointerMove, { passive: true });
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
      // Safety net: if the window loses focus mid-drag (alt-tab, a
      // mobile browser interruption, etc.) the pointerup we'd normally
      // get can be lost — end the drag anyway so it never gets stuck.
      window.addEventListener('blur', finishDrag);
    });

    // Keep the toggle inside the viewport if it's resized or rotated
    // (foldables, orientation change, browser window resize) — never
    // lets it end up stranded off-screen or behind the header.
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var b = getBounds(toggleBtn.offsetWidth, toggleBtn.offsetHeight);
        var x = Math.min(Math.max(currentLeft, b.minX), b.maxX);
        var y = Math.min(Math.max(currentTop, b.minY), b.maxY);
        if (x !== currentLeft || y !== currentTop) {
          toggleBtn.classList.add('is-snapping');
          toggleBtn.style.left = x + 'px';
          toggleBtn.style.top = y + 'px';
          currentLeft = x;
          currentTop = y;
          savePosition(x, y);
          setTimeout(function () { toggleBtn.classList.remove('is-snapping'); }, 400);
        }
      }, 150);
    });

    init();
  })();

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panelEl.hidden) closePanel();
  });

  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    submitUserText(inputEl.value);
  });

  // Hide the "new" badge permanently once the visitor has opened the chat
  // at least once before (across visits).
  try {
    if (localStorage.getItem(OPENED_BEFORE_KEY)) badgeEl.hidden = true;
  } catch (e) {}
  } // end boot()

  // Build the widget only once the page has finished loading, then wait
  // for an idle moment — so the chatbot never competes with the page's
  // own content for the main thread during initial load, and Core Web
  // Vitals (LCP/INP) for the real page are unaffected.
  function scheduleBoot() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(boot, { timeout: 2000 });
    } else {
      setTimeout(boot, 200);
    }
  }

  if (document.readyState === 'complete') {
    scheduleBoot();
  } else {
    window.addEventListener('load', scheduleBoot);
  }
})();
