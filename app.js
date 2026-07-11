document.addEventListener('DOMContentLoaded', () => {
  // 1 & 2. Scroll Progress Bar + Sticky Header
  // Merged into a single rAF-throttled scroll listener so both reads/writes
  // happen once per animation frame instead of on every raw scroll event
  // (avoids layout thrashing and keeps scrolling smooth).
  const progressBar = document.getElementById('progressBar');
  const header = document.querySelector('.site-header');
  const topBanner = document.querySelector('.top-banner');
  let scrollTicking = false;

  function updateOnScroll() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    if (progressBar) {
      progressBar.style.width = scrolled + '%';
    }
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 50);
    }
    if (topBanner) {
      topBanner.classList.toggle('scrolled', window.scrollY > 50);
    }
    scrollTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(updateOnScroll);
      scrollTicking = true;
    }
  }, { passive: true });

  // Keep the sticky header's offset in sync with the announcement bar's
  // real height, so they never overlap even if the bar wraps to more
  // lines than expected (text zoom, translation, long content).
  if (topBanner && 'ResizeObserver' in window) {
    const syncBannerHeight = () => {
      document.documentElement.style.setProperty('--banner-h', `${topBanner.offsetHeight}px`);
    };
    syncBannerHeight();
    new ResizeObserver(syncBannerHeight).observe(topBanner);
  }

  // 3. Mobile Navigation Menu
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });
  }

  // Mobile navigation links click behavior (close menu on select)
  const navLinks = document.querySelectorAll('.nav-link:not(.dropdown-trigger)');
  const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileToggle && navMenu) {
        mobileToggle.classList.remove('open');
        navMenu.classList.remove('open');
      }
    });
  });

  // Mobile dropdown menu toggle
  dropdownTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        const parent = trigger.parentElement;
        parent.classList.toggle('open');
      }
    });
  });

  // Close menus if click outside
  document.addEventListener('click', (e) => {
    if (navMenu && navMenu.classList.contains('open')) {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
        mobileToggle.classList.remove('open');
        navMenu.classList.remove('open');
      }
    }
  });

  // 4. Scroll Animations (Fade-in using IntersectionObserver)
  const animElements = document.querySelectorAll('.scroll-animate, .timeline-item');
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        entry.target.classList.add('animate'); // timeline compatibility
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animElements.forEach(el => {
    observer.observe(el);
  });

  // 5. Testimonial/Review Carousel Slider
  const slider = document.getElementById('reviewsSlider');
  const dots = document.querySelectorAll('.review-dot');
  const slides = document.querySelectorAll('.review-slide');
  const prevBtn = document.getElementById('reviewsPrev');
  const nextBtn = document.getElementById('reviewsNext');
  let currentSlide = 0;
  const totalSlides = dots.length;

  function updateSlide(index) {
    if (!slider || totalSlides === 0) return;
    currentSlide = index;
    slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlide);
    });
    
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === currentSlide);
    });
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => updateSlide(idx));
  });

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      let prevSlide = (currentSlide - 1 + totalSlides) % totalSlides;
      updateSlide(prevSlide);
    });
    
    nextBtn.addEventListener('click', () => {
      let nextSlide = (currentSlide + 1) % totalSlides;
      updateSlide(nextSlide);
    });
  }

  // Auto slide reviews every 6 seconds
  if (slider && totalSlides > 0) {
    setInterval(() => {
      let nextSlide = (currentSlide + 1) % totalSlides;
      updateSlide(nextSlide);
    }, 6000);
  }


  // 6. Interactive Lightbox for Gallery
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  let currentImgIndex = 0;
  const galleryImgUrls = Array.from(galleryItems).map(item => item.getAttribute('data-img'));

  // Preload all gallery images in the background for instant display
  if (galleryImgUrls && galleryImgUrls.length > 0) {
    window.addEventListener('load', () => {
      galleryImgUrls.forEach(url => {
        if (url) {
          const img = new Image();
          img.src = url;
        }
      });
    });
  }

  function showImage(index) {
    if (index < 0) index = galleryImgUrls.length - 1;
    if (index >= galleryImgUrls.length) index = 0;
    currentImgIndex = index;
    
    // Add temporary loading style or fade out
    lightboxImg.style.opacity = 0;
    setTimeout(() => {
      lightboxImg.src = galleryImgUrls[currentImgIndex];
      lightboxImg.style.opacity = 1;
    }, 200);
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      if (lightbox && lightboxImg) {
        showImage(index);
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden'; // stop body scroll
      }
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = 'auto';
    });
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      showImage(currentImgIndex - 1);
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      showImage(currentImgIndex + 1);
    });
  }

  if (lightbox) {
    lightbox.addEventListener('click', () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = 'auto';
    });
  }

  // Keyboard navigation for lightbox
  document.addEventListener('keydown', (e) => {
    if (lightbox && lightbox.classList.contains('open')) {
      if (e.key === 'Escape') {
        lightbox.classList.remove('open');
        document.body.style.overflow = 'auto';
      } else if (e.key === 'ArrowLeft') {
        showImage(currentImgIndex - 1);
      } else if (e.key === 'ArrowRight') {
        showImage(currentImgIndex + 1);
      }
    }
  });

  // 7. FAQs Accordion & Tabs
  const faqTabBtns = document.querySelectorAll('.faq-tab-btn');
  const faqGroups = document.querySelectorAll('.faq-group');
  
  faqTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      faqTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      faqGroups.forEach(group => {
        if (group.id === tabId) {
          group.classList.add('active');
        } else {
          group.classList.remove('active');
        }
      });
    });
  });

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    const content = item.querySelector('.faq-content');
    
    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      
      // Close all other items in this active group
      const activeGroup = item.parentElement;
      const siblingItems = activeGroup.querySelectorAll('.faq-item');
      siblingItems.forEach(sib => {
        sib.classList.remove('open');
        const sibContent = sib.querySelector('.faq-content');
        if (sibContent) sibContent.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        item.classList.remove('open');
        content.style.maxHeight = null;
      }
    });
  });

  // 8. Appointment Booking Form Validation & Submission
  const bookingForm = document.getElementById('bookingForm');
  const successMessage = document.getElementById('formSuccess');
  
  if (bookingForm && successMessage) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Simple validation
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const postcode = document.getElementById('postcode').value.trim();
      const address = document.getElementById('address') ? document.getElementById('address').value.trim() : 'N/A';
      const blindsType = document.getElementById('blindsType') ? document.getElementById('blindsType').value.trim() : '';
      const callTime = document.getElementById('callTime') ? document.getElementById('callTime').value.trim() : '';
      const hearAboutUs = document.getElementById('hearAboutUs') ? document.getElementById('hearAboutUs').value.trim() : '';
      const message = document.getElementById('message') ? document.getElementById('message').value.trim() : '';

      if (!name || !email || !phone || !postcode || !address || !blindsType || !callTime || !hearAboutUs) {
        alert('Please fill out all required fields.');
        return;
      }

      // Email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
      }

      // Send an email notification (admin + customer confirmation) in the
      // background. Not awaited on purpose — the existing instant
      // success transition below is unchanged either way; if delivery
      // fails, a small fallback note is appended to the success message
      // the customer is already looking at.
      sendBookingEmailNotification({ name, email, phone, postcode, blindsType, callTime, hearAboutUs, message }, successMessage);

      // Successful state
      bookingForm.style.display = 'none';
      successMessage.style.display = 'block';

      // Clear sessionStorage on successful submit
      const fields = ['name', 'phone', 'email', 'postcode', 'blindsType', 'message', 'address', 'callTime', 'hearAboutUs'];
      fields.forEach(fieldId => sessionStorage.removeItem(`session_form_${fieldId}`));

      // Scroll to form success message
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // Posts booking form data to the review-system backend's email service
  // (admin notification + customer confirmation, sent via Gmail SMTP /
  // Nodemailer). window.BB_REVIEWS_API_BASE is set inline near the bottom
  // of the page, right beside where this script is loaded.
  function sendBookingEmailNotification(data, successMessage) {
    if (!window.BB_REVIEWS_API_BASE) return;
    var combinedMessage = data.message +
      (data.hearAboutUs ? (data.message ? ' ' : '') + '(Heard about us via: ' + data.hearAboutUs + ')' : '');

    fetch(window.BB_REVIEWS_API_BASE + '/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'booking',
        name: data.name,
        email: data.email,
        phone: data.phone,
        postcode: data.postcode,
        service: data.blindsType,
        appointmentTime: data.callTime,
        message: combinedMessage
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('notify request failed');
    }).catch(function () {
      if (!successMessage || successMessage.querySelector('.booking-email-fallback-note')) return;
      var note = document.createElement('p');
      note.className = 'booking-email-fallback-note';
      note.style.cssText = 'color: var(--text-muted, #94a3b8); font-size: 0.8125rem; margin-top: 12px;';
      note.textContent = "If you don't hear from us within 24 hours, please call us on 07341 645339 to make sure we received your request.";
      successMessage.appendChild(note);
    });
  }

  // 9. Session Persistence for Booking Form
  function initSessionFormPersistence() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    const fields = ['name', 'phone', 'email', 'postcode', 'blindsType', 'message', 'address', 'callTime', 'hearAboutUs'];
    
    // Load from sessionStorage
    fields.forEach(fieldId => {
      const input = document.getElementById(fieldId);
      if (input) {
        const storedVal = sessionStorage.getItem(`session_form_${fieldId}`);
        if (storedVal) {
          input.value = storedVal;
        }
        
        // Save to sessionStorage on input/change events
        const saveVal = () => {
          sessionStorage.setItem(`session_form_${fieldId}`, input.value);
        };
        input.addEventListener('input', saveVal);
        input.addEventListener('change', saveVal);
      }
    });
  }

  initSessionFormPersistence();

  // 10. Cookie Consent Banner Injection & Logic
  function initCookieConsent() {
    // Check if user already consented
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    const setCookie = (name, value, days) => {
      let expires = "";
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
      }
      document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    };

    // If cookie already exists, don't show banner
    if (getCookie('cookie_consent_369')) {
      return;
    }

    // Create Banner Elements
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-content">
        <div class="cookie-icon"><i class="fa-solid fa-cookie-bite"></i></div>
        <div class="cookie-text">
          <h3>We Value Your Privacy</h3>
          <p>We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.</p>
        </div>
      </div>
      <div class="cookie-actions">
        <button class="cookie-btn cookie-decline" id="cookieDecline">Decline</button>
        <button class="cookie-btn cookie-accept" id="cookieAccept">Accept All</button>
      </div>
    `;

    document.body.appendChild(banner);

    // Fade-in animation delay
    setTimeout(() => {
      banner.classList.add('show');
    }, 1000);

    // Event Listeners
    document.getElementById('cookieAccept').addEventListener('click', () => {
      setCookie('cookie_consent_369', 'accepted', 365);
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 600);
    });

    document.getElementById('cookieDecline').addEventListener('click', () => {
      setCookie('cookie_consent_369', 'declined', 30);
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 600);
    });
  }

  // 11. Interactive Coverage Map
  function initCoverageMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    // Each region is one of the 3 actual service locations on the website
    const regions = {
      peterborough: {
        center: [52.5695, -0.2405],
        zoom: 11,
        circle: { center: [52.5695, -0.2405], radius: 16000 },
        title: 'Peterborough Service Area',
        cities: [
          'Peterborough City Centre',
          'Stamford',
          'Spalding',
          'Wisbech',
          'March',
          'Whittlesey',
          'Market Deeping',
          'Oundle',
          'Yaxley',
          'Crowland'
        ]
      },
      leicester: {
        center: [52.6369, -1.1398],
        zoom: 11,
        circle: { center: [52.6369, -1.1398], radius: 16000 },
        title: 'Leicester Service Area',
        cities: [
          'Leicester City Centre',
          'Loughborough',
          'Hinckley',
          'Wigston',
          'Coalville',
          'Melton Mowbray',
          'Market Harborough',
          'Oadby',
          'Lutterworth',
          'Ashby-de-la-Zouch'
        ]
      },
      luton: {
        center: [51.8787, -0.4143],
        zoom: 11,
        circle: { center: [51.8787, -0.4143], radius: 18000 },
        title: 'Luton & Bedfordshire Service Area',
        cities: [
          'Luton Town Centre',
          'Dunstable',
          'Bedford',
          'Leighton Buzzard',
          'Houghton Regis',
          'Ampthill',
          'Flitwick',
          'Sandy',
          'Biggleswade',
          'Kempston'
        ]
      }
    };

    // Initialize Leaflet Map — centered on Peterborough by default
    const map = L.map('map', {
      scrollWheelZoom: false
    }).setView(regions.peterborough.center, regions.peterborough.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    const shapeLayerGroup = L.layerGroup().addTo(map);
    let activeRegion = 'peterborough';

    // Tab button references
    const tabBtns = {
      peterborough: document.getElementById('tab-peterborough'),
      leicester:    document.getElementById('tab-leicester'),
      luton:        document.getElementById('tab-luton')
    };

    function renderRegion(regionKey) {
      shapeLayerGroup.clearLayers();
      const reg = regions[regionKey];

      // Update sidebar title
      const detailsTitle = document.getElementById('coverage-details-title');
      if (detailsTitle) detailsTitle.textContent = reg.title;

      // Update sidebar town list
      const listEl = document.getElementById('coverage-details-list');
      if (listEl) {
        listEl.innerHTML = '';
        reg.cities.forEach(city => {
          const li = document.createElement('li');
          li.className = 'coverage-details-item';
          li.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${city}`;
          listEl.appendChild(li);
        });
      }

      // Draw service circle on map
      const circle = L.circle(reg.circle.center, {
        radius: reg.circle.radius,
        color: '#1dbcd6',
        fillColor: '#1dbcd6',
        fillOpacity: 0.18,
        weight: 2.5
      }).addTo(shapeLayerGroup);

      // Add a pin marker at the centre
      const marker = L.marker(reg.circle.center, {
        title: reg.title
      }).addTo(shapeLayerGroup);
      marker.bindPopup(`<strong>${reg.title}</strong><br>Free home visits, measurement & fitting.`).openPopup();

      // Fly to the selected region smoothly
      map.flyTo(reg.center, reg.zoom, { duration: 0.8 });
    }

    // Initial render
    renderRegion('peterborough');

    // Tab click handlers
    Object.keys(tabBtns).forEach(key => {
      const btn = tabBtns[key];
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (activeRegion === key) return;
        activeRegion = key;
        // Update active class
        Object.values(tabBtns).forEach(b => b && b.classList.remove('active'));
        btn.classList.add('active');
        renderRegion(key);
      });
    });

    // Postcode Checker Logic
    const postcodeBtn        = document.getElementById('postcode-check-btn');
    const postcodeCheckInput = document.getElementById('postcode-check-input');
    const checkerResult      = document.getElementById('postcode-checker-result');

    if (postcodeBtn && postcodeCheckInput && checkerResult) {
      const postcodeMap = {
        peterborough: ['PE'],
        leicester:    ['LE'],
        luton:        ['LU', 'MK', 'SG', 'AL', 'HP']
      };

      const checkPostcode = () => {
        const inputVal = postcodeCheckInput.value.trim().toUpperCase();
        if (!inputVal) {
          checkerResult.className = 'postcode-result error';
          checkerResult.textContent = 'Please enter a postcode or postcode prefix (e.g. PE1, LE5, LU2).';
          return;
        }

        const match = inputVal.match(/^([A-Z]{1,2})/);
        if (!match) {
          checkerResult.className = 'postcode-result error';
          checkerResult.textContent = 'Invalid postcode format. Please enter letters only (e.g. PE3).';
          return;
        }

        const area = match[1];
        let found = false;

        for (const [regionKey, prefixes] of Object.entries(postcodeMap)) {
          if (prefixes.includes(area)) {
            const reg = regions[regionKey];
            checkerResult.className = 'postcode-result success';
            checkerResult.textContent = `✅ Great news! We cover ${inputVal} — ${reg.title}.`;
            // Switch to that tab
            if (activeRegion !== regionKey) {
              activeRegion = regionKey;
              Object.values(tabBtns).forEach(b => b && b.classList.remove('active'));
              if (tabBtns[regionKey]) tabBtns[regionKey].classList.add('active');
              renderRegion(regionKey);
            }
            found = true;
            break;
          }
        }

        if (!found) {
          checkerResult.className = 'postcode-result error';
          checkerResult.textContent = `❌ Sorry, ${inputVal} is outside our current service areas. Please call us to confirm.`;
        }
      };

      postcodeBtn.addEventListener('click', checkPostcode);
      postcodeCheckInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPostcode();
      });
    }

    // Sync header dropdown nav links to auto-focus the correct region tab
    document.querySelectorAll('a[href*="areas-covered"]').forEach(link => {
      link.addEventListener('click', () => {
        const text = link.textContent.trim().toLowerCase();
        let targetKey = null;
        if (text === 'peterborough') targetKey = 'peterborough';
        else if (text === 'leicester')   targetKey = 'leicester';
        else if (text === 'luton')       targetKey = 'luton';
        if (targetKey && activeRegion !== targetKey) {
          activeRegion = targetKey;
          Object.values(tabBtns).forEach(b => b && b.classList.remove('active'));
          if (tabBtns[targetKey]) tabBtns[targetKey].classList.add('active');
          renderRegion(targetKey);
        }
      });
    });
  }

  // Defer map init (and its tile-image requests) until the map section is
  // actually about to scroll into view, instead of loading it eagerly on
  // page load — keeps initial load fast for visitors who never reach it.
  const mapSection = document.getElementById('map');
  if (mapSection && 'IntersectionObserver' in window) {
    const mapObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          initCoverageMap();
          obs.disconnect();
        }
      });
    }, { rootMargin: '300px 0px' });
    mapObserver.observe(mapSection);
  } else {
    initCoverageMap();
  }

  initCookieConsent();

  // ---------------------------------------------------------------------
  // Draggable WhatsApp widget — lets a visitor drag it up/down so it can
  // be moved out of the way of page content on any screen size. Only the
  // vertical position (`bottom`) changes; the corner it's anchored to
  // stays fixed. A small movement threshold tells a drag apart from a
  // normal tap so the WhatsApp link still opens on click/tap as before.
  // Position is remembered (per browser) via localStorage.
  // ---------------------------------------------------------------------
  function makeVerticallyDraggable(el, storageKey) {
    if (!el) return;
    let dragging = false;
    let moved = false;
    let startY = 0;
    let startBottom = 0;

    function clampBottom(value) {
      const maxBottom = Math.max(12, window.innerHeight - el.offsetHeight - 90);
      return Math.min(Math.max(value, 12), maxBottom);
    }

    let saved = null;
    try { saved = localStorage.getItem(storageKey); } catch (e) {}
    const savedNum = saved !== null ? parseFloat(saved) : NaN;
    if (!isNaN(savedNum)) el.style.bottom = clampBottom(savedNum) + 'px';

    // Deliberately NOT using setPointerCapture here: capturing the
    // pointer on this wrapping div also redirects the compatibility
    // mouse/click events it generates to the div itself, which silently
    // breaks the nested WhatsApp <a>'s native click-to-navigate. Plain
    // document-level move/up listeners (added only while dragging) avoid
    // that entirely.
    function onPointerMove(e) {
      if (!dragging) return;
      const dy = e.clientY - startY;
      if (Math.abs(dy) > 4) moved = true;
      el.style.bottom = clampBottom(startBottom - dy) + 'px';
    }

    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-dragging');
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      if (moved) {
        try { localStorage.setItem(storageKey, parseFloat(el.style.bottom)); } catch (err) {}
        // Suppress the synthetic click that follows this drag gesture so
        // it doesn't also open the WhatsApp link. Attached on document
        // (an ancestor of the click target) so its capture-phase handler
        // runs before the target's own click listener.
        document.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
        }, { capture: true, once: true });
      }
    }

    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      moved = false;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      startBottom = window.innerHeight - rect.bottom;
      el.classList.add('is-dragging');
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
    });
  }

  makeVerticallyDraggable(document.getElementById('waChatWidget'), 'bb_wa_widget_bottom');
});


