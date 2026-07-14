document.addEventListener('DOMContentLoaded', () => {
  // Hero Carousel Slider (Homepage Only)
  const heroFrontImg = document.querySelector('.hero-image-card img');
  const heroSection = document.querySelector('.hero');
  if (heroFrontImg && heroSection && !document.querySelector('.breadcrumbs-container')) {
    const heroImages = [
      "images/products/luxury_hero_blinds.jpg",
      "images/products/faux-wood-blinds.jpg",
      "images/products/motorised-blinds.jpg",
      "images/products/commercial-blinds.jpg",
      "images/products/roller-blinds-image-1024x1024.jpg.webp",
      "images/products/vertical-blinds-hero.jpg.webp",
      "images/products/roman-blinds-image.jpg.webp",
      "images/products/skylight-blinds-image.jpg.webp"
    ];
    let currentHeroIndex = 0;
    
    // Preload images for seamless transitions
    heroImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    setInterval(() => {
      currentHeroIndex = (currentHeroIndex + 1) % heroImages.length;
      const nextImg = heroImages[currentHeroIndex];
      
      // Start fade out
      heroFrontImg.classList.add('fade-out');
      
      setTimeout(() => {
        // Change src and backdrop background
        heroFrontImg.src = nextImg;
        heroSection.style.backgroundImage = `linear-gradient(135deg, rgba(11, 17, 32, 0.93) 0%, rgba(40, 10, 18, 0.75) 55%, rgba(11, 17, 32, 0.88) 100%), url('${nextImg}')`;
        
        // Remove fade out once loaded
        heroFrontImg.onload = () => {
          heroFrontImg.classList.remove('fade-out');
        };
        setTimeout(() => {
          heroFrontImg.classList.remove('fade-out');
        }, 100);
      }, 600); // matches CSS transition duration
    }, 4500); // Change image every 4.5 seconds
  }

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
        const opened = parent.classList.toggle('open');
        // The dropdown expands inline inside the scrollable mobile nav
        // panel rather than as an overlay, so a submenu with many items
        // (e.g. the 13-item "Window Blinds" list) can expand well past
        // the bottom of the panel with no visual hint that there's more
        // below — a user opening it sees the list cut off partway
        // through and no obvious way to reach the last few items.
        // Scrolling the freshly-revealed menu's bottom edge into view
        // fixes that without needing a redesign of the dropdown itself.
        if (opened) {
          requestAnimationFrame(() => {
            navMenu.scrollTo({ top: navMenu.scrollHeight, behavior: 'smooth' });
          });
        }
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
    threshold: 0.05,
    rootMargin: '0px 0px -10px 0px'
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
      const preferredColor = document.getElementById('preferredColor') ? document.getElementById('preferredColor').value.trim() : '';
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

      // Send an email notification
      sendBookingEmailNotification({ name, email, phone, postcode, address, blindsType, preferredColor, callTime, hearAboutUs, message }, successMessage);

      // Successful state
      bookingForm.style.display = 'none';
      successMessage.style.display = 'block';

      // Clear sessionStorage on successful submit
      const fields = ['name', 'phone', 'email', 'postcode', 'blindsType', 'preferredColor', 'message', 'address', 'callTime', 'hearAboutUs'];
      fields.forEach(fieldId => sessionStorage.removeItem(`session_form_${fieldId}`));

      // Scroll to form success message
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // Posts booking form data to /api/notify
  function sendBookingEmailNotification(data, successMessage) {
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'booking',
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        postcode: data.postcode,
        service: data.blindsType,
        preferredColor: data.preferredColor,
        appointmentTime: data.callTime,
        hearAboutUs: data.hearAboutUs,
        message: data.message
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

    const fields = ['name', 'phone', 'email', 'postcode', 'blindsType', 'preferredColor', 'message', 'address', 'callTime', 'hearAboutUs'];
    
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
        title: 'Luton Service Area',
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

    // Initialize Leaflet Map using official Google Maps Roadmap tile layers
    const map = L.map('map', {
      scrollWheelZoom: false
    }).setView(regions.peterborough.center, regions.peterborough.zoom);

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: 'Map data &copy; <a href="https://maps.google.com">Google</a>',
      maxZoom: 20
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

      // Draw service circle on map to show coverage range
      const circle = L.circle(reg.circle.center, {
        radius: reg.circle.radius,
        color: '#e11d48',
        fillColor: '#e11d48',
        fillOpacity: 0.18,
        weight: 2.5
      }).addTo(shapeLayerGroup);

      // Add a pin marker at the centre
      const marker = L.marker(reg.circle.center, {
        title: reg.title
      }).addTo(shapeLayerGroup);
      marker.bindPopup(`<strong>${reg.title}</strong><br>Free home visits, measurement & fitting.`).openPopup();

      // Ensure Leaflet container dimensions are fully updated before calculating bounds
      map.invalidateSize();

      // Automatically adjust map zoom and position to fit the entire circle on screen
      map.fitBounds(circle.getBounds(), {
        padding: [20, 20],
        animate: true,
        duration: 0.8
      });
    }

    // Keep Leaflet map container dimensions correct on window resize
    window.addEventListener('resize', () => {
      map.invalidateSize();
    }, { passive: true });

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
        luton:        ['LU', 'MK', 'SG']
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
  // Freely draggable floating widgets (WhatsApp here; the chatbot toggle
  // has its own copy in chatbot.js since that widget builds its own DOM
  // independently — see the note at the top of that file). Lets a
  // visitor drag the widget anywhere on screen — up, down, left, right —
  // like a mobile chat-head. Position (x, y) is remembered per browser
  // via localStorage and re-clamped into view on resize/rotation. A
  // small movement threshold tells a drag apart from a normal tap, so
  // the WhatsApp link still opens instantly on click/tap.
  // ---------------------------------------------------------------------
  function makeFreelyDraggable(el, storageKey) {
    if (!el) return;

    var DRAG_THRESHOLD = 9; // px of movement before a tap becomes a drag
    var EDGE_MARGIN = 12;

    var dragging = false;
    var moved = false;
    var justDragged = false;
    var activePointerId = null;
    var startClientX = 0, startClientY = 0;
    var startLeft = 0, startTop = 0;
    var currentLeft = 0, currentTop = 0;
    var rafId = null;
    var pendingX = 0, pendingY = 0;

    // Keeps the widget clear of the sticky announcement bar + header,
    // whatever their current combined height is at this viewport width
    // — re-read live rather than hard-coded so it stays correct across
    // every breakpoint and if either bar's height ever changes.
    function topClearance() {
      var header = document.querySelector('.site-header');
      if (header) {
        var rect = header.getBoundingClientRect();
        if (rect.height > 0) return rect.bottom + 10;
      }
      return 90;
    }

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
      try { raw = localStorage.getItem(storageKey); } catch (e) {}
      if (!raw) return null;
      try {
        var parsed = JSON.parse(raw);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number' &&
            !isNaN(parsed.x) && !isNaN(parsed.y)) return parsed;
      } catch (e) {}
      return null;
    }

    function savePosition(x, y) {
      try { localStorage.setItem(storageKey, JSON.stringify({ x: x, y: y })); } catch (e) {}
    }

    function init() {
      var rect = el.getBoundingClientRect();
      var b = getBounds(rect.width, rect.height);
      var saved = loadSavedPosition();
      var x = saved ? saved.x : rect.left;
      var y = saved ? saved.y : rect.top;
      x = Math.min(Math.max(x, b.minX), b.maxX);
      y = Math.min(Math.max(y, b.minY), b.maxY);
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      currentLeft = x;
      currentTop = y;
    }

    // Deliberately NOT using setPointerCapture here: capturing the
    // pointer on this wrapping div also redirects the compatibility
    // mouse/click events it generates to the div itself, which silently
    // breaks the nested WhatsApp <a>'s native click-to-navigate. Plain
    // document-level move/up listeners (added only while dragging) avoid
    // that entirely.
    //
    // While dragging, position is applied via `transform: translate3d()`
    // (GPU-composited, no layout) instead of writing left/top on every
    // event — writing left/top forces a synchronous reflow each time,
    // and on phones the browser can't keep up with pointermove's event
    // rate, so it drops frames and the widget visibly jumps instead of
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
        el.classList.add('is-dragging');
      }
      var b = getBounds(el.offsetWidth, el.offsetHeight);
      currentLeft = Math.min(Math.max(startLeft + dx, b.minX), b.maxX);
      currentTop = Math.min(Math.max(startTop + dy, b.minY), b.maxY);
      el.style.transform = 'translate3d(' + (currentLeft - startLeft) + 'px, ' + (currentTop - startTop) + 'px, 0)';
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
        el.classList.remove('is-dragging');
        return;
      }

      // Commit the exact release position first, instantly (still under
      // `is-dragging`'s transition:none) — this becomes the start point
      // for the eased magnetic-snap animation below. Doing this in one
      // step and the snap in a separate, later step (rather than jumping
      // straight to the snapped position) is what makes the release feel
      // like a continuation of the drag instead of a jump.
      el.style.transform = '';
      el.style.left = currentLeft + 'px';
      el.style.top = currentTop + 'px';
      // Flags the click that follows this drag gesture so the listener
      // below can cancel the WhatsApp link's navigation for it. Checked
      // (and reset) inline rather than via a one-time document-level
      // capture listener with stopPropagation() — that approach worked,
      // but stopping propagation on a click this way was found to also
      // interfere with a browser's user-activation bookkeeping, silently
      // breaking a *later*, genuinely separate click on the same link.
      justDragged = true;

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var b = getBounds(el.offsetWidth, el.offsetHeight);
          // Magnetic edge snap — settle horizontally to whichever side
          // (left/right) is closer, like WhatsApp/Messenger chat heads.
          // Vertical position stays exactly where it was released.
          var snappedX = (currentLeft - b.minX) <= (b.maxX - currentLeft) ? b.minX : b.maxX;
          var clampedY = Math.min(Math.max(currentTop, b.minY), b.maxY);

          if (snappedX !== currentLeft || clampedY !== currentTop) {
            el.classList.add('is-snapping');
            el.style.left = snappedX + 'px';
            el.style.top = clampedY + 'px';
          }
          currentLeft = snappedX;
          currentTop = clampedY;
          savePosition(currentLeft, currentTop);

          var cleanup = function () {
            el.classList.remove('is-dragging', 'is-snapping');
            el.removeEventListener('transitionend', cleanup);
          };
          el.addEventListener('transitionend', cleanup);
          setTimeout(cleanup, 400); // fallback in case transitionend never fires
        });
      });
    }
    var onPointerUp = finishDrag;

    // Cancels the WhatsApp link's navigation only for the click that
    // immediately follows a drag; a plain tap (justDragged left false)
    // passes through untouched. Bubble phase on the wrapping div (an
    // ancestor of the actual <a>) is enough — preventDefault() cancels
    // the anchor's default action from any point in propagation.
    el.addEventListener('click', function (ev) {
      window.__waClickDebug = window.__waClickDebug || [];
      window.__waClickDebug.push({ justDragged: justDragged, defaultPrevented: ev.defaultPrevented, t: Date.now() });
      if (justDragged) {
        justDragged = false;
        ev.preventDefault();
      }
    });

    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (dragging) return; // already tracking a different pointer
      dragging = true;
      moved = false;
      // Clear any stale flag from a previous drag whose release click
      // never landed back on this element (e.g. released far away) —
      // every legitimate click is preceded by its own pointerdown here,
      // so this guarantees the flag never leaks into an unrelated tap.
      justDragged = false;
      activePointerId = e.pointerId;
      startClientX = e.clientX;
      startClientY = e.clientY;
      var rect = el.getBoundingClientRect();
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

    // Keep the widget inside the viewport if it's resized or rotated
    // (foldables, orientation change, browser window resize) — never
    // lets it end up stranded off-screen or behind the header.
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var b = getBounds(el.offsetWidth, el.offsetHeight);
        var x = Math.min(Math.max(currentLeft, b.minX), b.maxX);
        var y = Math.min(Math.max(currentTop, b.minY), b.maxY);
        if (x !== currentLeft || y !== currentTop) {
          el.classList.add('is-snapping');
          el.style.left = x + 'px';
          el.style.top = y + 'px';
          currentLeft = x;
          currentTop = y;
          savePosition(x, y);
          setTimeout(function () { el.classList.remove('is-snapping'); }, 400);
        }
      }, 150);
    });

    init();
  }

  // 12. Scroll Reveal IntersectionObserver
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal-fade-up');
    if (revealEls.length === 0) return;

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.05
    });

    revealEls.forEach(el => revealObserver.observe(el));
  }

  initScrollReveal();

  makeFreelyDraggable(document.getElementById('waChatWidget'), 'bb_wa_widget_pos');
});


