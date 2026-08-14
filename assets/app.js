/* ============================================================
   Pet Planet Brunette — app.js
   ============================================================
   CONFIGURATION — fill these in before launch
   ============================================================ */

const CONFIG = {
  // 1. Web3Forms (free up to 250/month) — primary lead delivery
  WEB3FORMS_ACCESS_KEY: "e52acb55-1ed1-483b-94e6-0cadb9f439a9",

  // 2. Fallback email if Web3Forms fails
  FALLBACK_EMAIL: "brunette@coquitlam.petplanet.ca",

  // 3. Thank-you page for conversion tracking
  THANK_YOU_PAGE: "thank-you.html",

  // 4. GTM / Meta Pixel IDs — injected dynamically so one config change covers all pages
  GTM_IDS: ["GTM-K34XKB59", "GTM-WCBNSWTP"],
  META_PIXEL_ID: "2408756286271482",

  // 5. HubSpot — booking form submissions are sent here to create/update CRM contacts
  HUBSPOT_PORTAL_ID: "343526399",
  HUBSPOT_REGION: "na3",
  HUBSPOT_BOOKING_FORM_ID: "42ffff5a-2756-4444-a578-240a68a41fac",
};

/* ============================================================
   TRACKING — GTM + Meta Pixel injected on every page
   ============================================================ */
function injectTracking() {
  // GTM head snippets
  CONFIG.GTM_IDS.forEach(id => {
    const s = document.createElement("script");
    s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`;
    document.head.appendChild(s);
    // GTM noscript
    const ns = document.createElement("noscript");
    ns.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(ns, document.body.firstChild);
  });

  // Meta Pixel
  const mp = document.createElement("script");
  mp.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${CONFIG.META_PIXEL_ID}');fbq('track','PageView');`;
  document.head.appendChild(mp);
}

/* Push a custom event to GTM dataLayer + fire a Meta Pixel custom event */
function trackEvent(eventName, params = {}) {
  if (window.dataLayer) window.dataLayer.push({ event: eventName, ...params });
  if (window.fbq) fbq("trackCustom", eventName, params);
}

/* ============================================================
   HUBSPOT LEAD CAPTURE
   Submits form data to HubSpot's Forms API so a Contact is
   created/updated in the CRM, tied to the visitor's tracking
   cookie for journey tracking. Runs alongside (not instead of)
   the existing email delivery, and never blocks it on failure.
   ============================================================ */
function getCookie(name) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : "";
}

async function submitToHubSpot(formId, fields) {
  if (!CONFIG.HUBSPOT_PORTAL_ID || !formId) return;
  try {
    await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${CONFIG.HUBSPOT_PORTAL_ID}/${formId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: fields.filter(f => f.value !== "" && f.value != null),
        context: {
          hutk: getCookie("hubspotutk"),
          pageUri: window.location.href,
          pageName: document.title
        }
      })
    });
  } catch (err) { /* non-blocking — booking flow must not depend on HubSpot */ }
}

/* ============================================================
   LOCAL BUSINESS SCHEMA — injected on every page
   ============================================================ */
function injectSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Pet Planet Brunette Dog Daycare",
    "description": "Dog daycare, overnight boarding, grooming and spa in Coquitlam, BC. Your dog's first day is free.",
    "url": "https://daycare.petplanet.ca",
    "telephone": "+17783971364",
    "email": "brunette@coquitlam.petplanet.ca",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "822 Brunette Ave",
      "addressLocality": "Coquitlam",
      "addressRegion": "BC",
      "postalCode": "V3K 1C4",
      "addressCountry": "CA"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 49.2265,
      "longitude": -122.8957
    },
    "openingHoursSpecification": [
      { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "06:00", "closes": "19:00" },
      { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday","Sunday"], "opens": "09:00", "closes": "17:00" }
    ],
    "priceRange": "$$",
    "image": "https://daycare.petplanet.ca/wp-content/uploads/2025/09/petplanet_daycare_03-scaled.jpeg",
    "sameAs": ["https://www.facebook.com/PetPlanetHealth/", "https://www.instagram.com/mypetplanethealth/"],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Dog Daycare Services",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Dog Daycare" }, "price": "47.00", "priceCurrency": "CAD" },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Overnight Boarding" }, "price": "30.00", "priceCurrency": "CAD" },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Dog Grooming and Spa" }, "price": "35.00", "priceCurrency": "CAD" }
      ]
    }
  };
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(schema);
  document.head.appendChild(s);
}

/* ============================================================
   MOBILE NAV
   ============================================================ */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", nav.classList.contains("open"));
    });

    // Close nav when any link is tapped (important for mobile UX)
    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }
}

/* ============================================================
   BOOKING CALENDAR
   Meet & Greet slots aligned to store hours:
   Mon–Fri 6 AM–7 PM  → evaluation slots 9 AM–5 PM
   Sat–Sun 9 AM–5 PM  → evaluation slots 10 AM–3 PM
   Bookable window: tomorrow through 30 days out.
   ============================================================ */
const SLOTS = {
  weekday: ["9:00 AM","10:00 AM","11:00 AM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"],
  weekend: ["10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM"]
};

const state = { viewYear: 0, viewMonth: 0, selectedDate: null, selectedSlot: null };

function startOfDay(d) { const c = new Date(d); c.setHours(0,0,0,0); return c; }
function bookableRange() {
  const min = startOfDay(new Date()); min.setDate(min.getDate()+1);
  const max = startOfDay(new Date()); max.setDate(max.getDate()+30);
  return { min, max };
}

function initBookingWidget() {
  const today = new Date();
  state.viewYear = today.getFullYear();
  state.viewMonth = today.getMonth();
  document.getElementById("calPrev").addEventListener("click", () => shiftMonth(-1));
  document.getElementById("calNext").addEventListener("click", () => shiftMonth(1));
  renderCalendar();
  const form = document.getElementById("bookingForm");
  if (form) form.addEventListener("submit", submitBooking);
}

function shiftMonth(delta) {
  state.viewMonth += delta;
  if (state.viewMonth < 0) { state.viewMonth = 11; state.viewYear -= 1; }
  if (state.viewMonth > 11) { state.viewMonth = 0; state.viewYear += 1; }
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById("calGrid");
  const label = document.getElementById("calMonth");
  const { min, max } = bookableRange();
  const first = new Date(state.viewYear, state.viewMonth, 1);
  label.textContent = first.toLocaleDateString("en-CA", { month:"long", year:"numeric" });
  document.getElementById("calPrev").disabled = new Date(state.viewYear, state.viewMonth, 1) <= new Date(min.getFullYear(), min.getMonth(), 1);
  document.getElementById("calNext").disabled = new Date(state.viewYear, state.viewMonth, 1) >= new Date(max.getFullYear(), max.getMonth(), 1);
  grid.innerHTML = "";
  ["Su","Mo","Tu","We","Th","Fr","Sa"].forEach(d => {
    const el = document.createElement("div"); el.className = "cal-dow"; el.textContent = d; grid.appendChild(el);
  });
  for (let i = 0; i < first.getDay(); i++) {
    const pad = document.createElement("button"); pad.className = "cal-day empty"; pad.disabled = true; grid.appendChild(pad);
  }
  const daysInMonth = new Date(state.viewYear, state.viewMonth+1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(state.viewYear, state.viewMonth, day);
    const btn = document.createElement("button");
    btn.className = "cal-day"; btn.type = "button"; btn.textContent = day;
    const inRange = date >= min && date <= max;
    btn.disabled = !inRange;
    if (state.selectedDate && date.getTime() === state.selectedDate.getTime()) btn.classList.add("selected");
    if (inRange) btn.addEventListener("click", () => selectDate(date));
    grid.appendChild(btn);
  }
}

function selectDate(date) {
  state.selectedDate = startOfDay(date); state.selectedSlot = null;
  renderCalendar(); renderSlots(); updateSummary();
  trackEvent("booking_date_selected", { date: date.toISOString().slice(0,10) });
}

function renderSlots() {
  const wrapEl = document.getElementById("slotWrap");
  const gridEl = document.getElementById("slotGrid");
  const labelEl = document.getElementById("slotDateLabel");
  if (!state.selectedDate) { wrapEl.classList.add("hidden"); return; }
  wrapEl.classList.remove("hidden");
  const dow = state.selectedDate.getDay();
  const slots = (dow === 0 || dow === 6) ? SLOTS.weekend : SLOTS.weekday;
  labelEl.textContent = state.selectedDate.toLocaleDateString("en-CA", { weekday:"long", month:"long", day:"numeric" });
  gridEl.innerHTML = "";
  slots.forEach(time => {
    const btn = document.createElement("button");
    btn.className = "slot"; btn.type = "button"; btn.textContent = time;
    if (state.selectedSlot === time) btn.classList.add("selected");
    btn.addEventListener("click", () => {
      state.selectedSlot = time; renderSlots(); updateSummary();
      trackEvent("booking_time_selected", { time });
      document.getElementById("formPanel").scrollIntoView({ behavior:"smooth", block:"start" });
    });
    gridEl.appendChild(btn);
  });
}

function updateSummary() {
  const el = document.getElementById("bookingSummary");
  if (!el) return;
  if (state.selectedDate && state.selectedSlot) {
    el.textContent = "Free first visit: " + state.selectedDate.toLocaleDateString("en-CA", { weekday:"long", month:"long", day:"numeric" }) + " at " + state.selectedSlot;
    el.classList.remove("hidden");
  } else if (state.selectedDate) {
    el.textContent = "Now choose a time for " + state.selectedDate.toLocaleDateString("en-CA", { weekday:"long", month:"long", day:"numeric" });
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

async function submitBooking(e) {
  e.preventDefault();
  const form = e.target;
  if (!state.selectedDate || !state.selectedSlot) {
    alert("Please pick a date and time first."); return;
  }
  const payload = {
    source: "petplanet-brunette-website",
    request_type: "free_first_visit",
    utm_source: getUTM("utm_source"),
    utm_medium: getUTM("utm_medium"),
    utm_campaign: getUTM("utm_campaign"),
    utm_content: getUTM("utm_content"),
    visit_date: state.selectedDate.toISOString().slice(0,10),
    visit_time: state.selectedSlot,
    parent_name: form.parentName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    service: form.service ? form.service.value : "",
    dog_name: form.dogName.value.trim(),
    dog_breed: form.dogBreed.value.trim(),
    dog_size: form.dogSize.value,
    vaccinated: form.vaccinated.value,
    spayed_neutered: form.fixed.value,
    notes: form.notes.value.trim(),
    submitted_at: new Date().toISOString()
  };
  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.disabled = true; submitBtn.textContent = "Sending request...";

  // Fire conversion events BEFORE redirect
  trackEvent("booking_submitted", { dog_name: payload.dog_name, visit_date: payload.visit_date });
  if (window.fbq) fbq("track", "Lead", { content_name: "Free First Visit Booking", currency: "CAD", value: 0 });
  if (window.dataLayer) window.dataLayer.push({ event: "conversion", send_to: "booking_free_visit" });

  // Send the lead to HubSpot so a Contact is created/updated in the CRM
  const nameParts = payload.parent_name.split(/\s+/);
  const SERVICE_LABELS = { daycare: "Dog Daycare", boarding: "Overnight Boarding", grooming: "Grooming & Spa", "daycare-boarding": "Daycare + Boarding", "not-sure": "Not sure yet" };
  const SIZE_LABELS = { small: "Small (under 25 lb)", medium: "Medium (25–55 lb)", large: "Large (55–90 lb)", xlarge: "X-Large (90 lb+)" };
  submitToHubSpot(CONFIG.HUBSPOT_BOOKING_FORM_ID, [
    { name: "email", value: payload.email },
    { name: "firstname", value: nameParts[0] || "" },
    { name: "lastname", value: nameParts.slice(1).join(" ") },
    { name: "phone", value: payload.phone },
    { name: "dog_s_name", value: payload.dog_name },
    { name: "dog_breed", value: payload.dog_breed },
    { name: "dog_size", value: SIZE_LABELS[payload.dog_size] || payload.dog_size },
    { name: "service_interested_in", value: SERVICE_LABELS[payload.service] || payload.service },
    { name: "visit_date", value: payload.visit_date },
    { name: "visit_time", value: payload.visit_time },
    { name: "vaccinated", value: payload.vaccinated === "yes" ? "Yes" : payload.vaccinated === "no" ? "No / Not sure" : "" },
    { name: "spayed_neutered", value: payload.spayed_neutered === "yes" ? "Yes" : payload.spayed_neutered === "no" ? "No" : "" },
    { name: "notes", value: payload.notes }
  ]);

  let delivered = false;

  if (CONFIG.WEB3FORMS_ACCESS_KEY) {
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          access_key: CONFIG.WEB3FORMS_ACCESS_KEY,
          subject: `New Booking Request – ${payload.dog_name} (${payload.visit_date} at ${payload.visit_time})`,
          from_name: "Pet Planet Brunette Website",
          to: "brunette@coquitlam.petplanet.ca",
          ...payload
        })
      });
      delivered = res.ok;
    } catch(err) { delivered = false; }
  }

  if (!delivered) {
    const body = encodeURIComponent("Free first visit request\n\n" + Object.entries(payload).map(([k,v]) => k+": "+v).join("\n"));
    window.open("mailto:"+CONFIG.FALLBACK_EMAIL+"?subject=Free%20first%20visit%20-%20"+encodeURIComponent(payload.dog_name)+"&body="+body, "_blank");
  }
  // Redirect to thank-you page for conversion tracking
  sessionStorage.setItem("pp_booking", JSON.stringify(payload));
  window.location.href = CONFIG.THANK_YOU_PAGE;
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      source: "petplanet-brunette-contact-form",
      utm_source: getUTM("utm_source"),
      utm_medium: getUTM("utm_medium"),
      utm_campaign: getUTM("utm_campaign"),
      name: form.contactName.value.trim(),
      email: form.contactEmail.value.trim(),
      phone: form.contactPhone.value.trim(),
      subject: form.contactSubject.value,
      message: form.contactMessage.value.trim(),
      submitted_at: new Date().toISOString()
    };
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Sending...";
    trackEvent("contact_form_submitted", { subject: payload.subject });
    if (window.fbq) fbq("track", "Contact");
    let delivered = false;
    if (CONFIG.WEB3FORMS_ACCESS_KEY) {
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            access_key: CONFIG.WEB3FORMS_ACCESS_KEY,
            subject: `New Contact Form – ${payload.subject}`,
            from_name: "Pet Planet Brunette Website",
            ...payload
          })
        });
        delivered = res.ok;
      } catch(err) { delivered = false; }
    }
    document.getElementById("contactFormWrap").classList.add("hidden");
    document.getElementById("contactConfirm").classList.remove("hidden");
  });
}

/* ============================================================
   UTM PARAMETER CAPTURE
   Reads UTMs from URL and stores in sessionStorage so they
   persist across page navigations and attach to every form submission.
   ============================================================ */
function captureUTMs() {
  const params = new URLSearchParams(window.location.search);
  ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","gclid","fbclid"].forEach(k => {
    if (params.get(k)) sessionStorage.setItem(k, params.get(k));
  });
}
function getUTM(key) { return sessionStorage.getItem(key) || ""; }

/* ============================================================
   THANK-YOU PAGE — reads booking from sessionStorage
   ============================================================ */
function initThankYou() {
  const el = document.getElementById("thankYouDetail");
  if (!el) return;
  try {
    const b = JSON.parse(sessionStorage.getItem("pp_booking"));
    if (b) {
      el.textContent = b.dog_name + "'s free first visit is confirmed for " +
        new Date(b.visit_date + "T12:00:00").toLocaleDateString("en-CA", { weekday:"long", month:"long", day:"numeric" }) +
        " at " + b.visit_time + ". We will send a confirmation to " + b.email + ".";
      sessionStorage.removeItem("pp_booking");
    }
  } catch(e) {}
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  captureUTMs();
  injectTracking();
  injectSchema();
  initNav();
  if (document.getElementById("calGrid")) initBookingWidget();
  initContactForm();
  initThankYou();
});
