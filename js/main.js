/* =========================================================
   ALMÉRA — interactions
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Header: solid on scroll ---------- */
  const header = document.querySelector(".header");
  const onHero = header && header.classList.contains("header--onhero");

  function onScroll() {
    if (!header) return;
    const threshold = onHero ? window.innerHeight * 0.6 : 40;
    header.classList.toggle("header--solid", window.scrollY > threshold);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  const burger = document.querySelector(".burger");
  const mobileNav = document.querySelector(".mobile-nav");
  if (burger && mobileNav) {
    const toggle = (open) => {
      burger.classList.toggle("is-open", open);
      mobileNav.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", () =>
      toggle(!mobileNav.classList.contains("is-open"))
    );
    mobileNav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => toggle(false))
    );
  }

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Catalog filters (category + price) ---------- */
  const filterBar = document.querySelector("[data-filters]");
  if (filterBar) {
    const cards = Array.from(document.querySelectorAll("[data-category]"));
    let activeCategory = "all";

    // cache each card's numeric price (from "$1,234" / "From $2,980")
    const parsePrice = (t) => {
      const n = parseInt((t || "").replace(/[^0-9]/g, ""), 10);
      return isNaN(n) ? null : n;
    };
    cards.forEach((c) => {
      c._price = parsePrice(c.querySelector(".card__price")?.textContent);
    });

    // order the grid by price, cheapest first (items without a price go last)
    const grid = cards[0] && cards[0].parentNode;
    if (grid) {
      cards
        .slice()
        .sort((a, b) => (a._price == null ? Infinity : a._price) - (b._price == null ? Infinity : b._price))
        .forEach((c) => grid.appendChild(c));
    }

    // slider bounds from actual prices
    const prices = cards.map((c) => c._price).filter((n) => n != null);
    const floor50 = (n) => Math.floor(n / 50) * 50;
    const ceil50 = (n) => Math.ceil(n / 50) * 50;
    const boundMin = prices.length ? floor50(Math.min(...prices)) : 0;
    const boundMax = prices.length ? ceil50(Math.max(...prices)) : 1000;
    let curMin = boundMin,
      curMax = boundMax;
    const fmt = (v) => "$" + v.toLocaleString("en-US");

    const applyFilters = () => {
      cards.forEach((card, i) => {
        const catOk = activeCategory === "all" || card.dataset.category === activeCategory;
        const p = card._price;
        const priceOk = p == null || (p >= curMin && p <= curMax);
        const show = catOk && priceOk;
        card.classList.toggle("is-hidden", !show);
        if (show) {
          card.classList.remove("is-filtering");
          void card.offsetWidth;
          card.style.animationDelay = (i % 6) * 0.05 + "s";
          card.classList.add("is-filtering");
        }
      });
    };

    // category chips
    filterBar.querySelectorAll(".filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.filter;
        filterBar
          .querySelectorAll(".filter")
          .forEach((b) => b.classList.toggle("is-active", b === btn));
        applyFilters();
      });
    });

    // price range slider
    const pricebar = document.querySelector("[data-pricebar]");
    if (pricebar && prices.length && boundMax > boundMin) {
      const lower = pricebar.querySelector("[data-price-lower]");
      const upper = pricebar.querySelector("[data-price-upper]");
      const fill = pricebar.querySelector("[data-price-fill]");
      const minLbl = pricebar.querySelector("[data-price-min]");
      const maxLbl = pricebar.querySelector("[data-price-max]");
      [lower, upper].forEach((inp) => {
        inp.min = boundMin;
        inp.max = boundMax;
        inp.step = 10;
      });
      lower.value = boundMin;
      upper.value = boundMax;

      const pct = (v) => ((v - boundMin) / (boundMax - boundMin)) * 100;
      const render = () => {
        fill.style.left = pct(curMin) + "%";
        fill.style.width = pct(curMax) - pct(curMin) + "%";
        minLbl.textContent = fmt(curMin);
        maxLbl.textContent = fmt(curMax);
      };
      const onInput = () => {
        let lo = +lower.value,
          hi = +upper.value;
        if (lo > hi) {
          if (document.activeElement === lower) {
            hi = lo;
            upper.value = hi;
          } else {
            lo = hi;
            lower.value = lo;
          }
        }
        curMin = lo;
        curMax = hi;
        render();
        applyFilters();
      };
      lower.addEventListener("input", onInput);
      upper.addEventListener("input", onInput);
      render();
    }
  }

  /* ---------- Per-card image carousel (in the grid) ---------- */
  document.querySelectorAll("[data-category]").forEach((card) => {
    const media = card.querySelector(".card__media");
    if (!media) return;
    const firstImg = media.querySelector("img");
    if (!firstImg) return;

    const srcs = [firstImg.getAttribute("src")];
    if (firstImg.dataset.altSrc) {
      firstImg.dataset.altSrc.split(",").forEach((s) => {
        const t = s.trim();
        if (t) srcs.push(t);
      });
    }
    if (srcs.length < 2) return; // single image → no carousel

    // build track (reuse the original img as slide 0 so quick-view still works)
    const track = document.createElement("div");
    track.className = "card__track";
    firstImg.remove();
    srcs.forEach((src, i) => {
      const slide = document.createElement("div");
      slide.className = "card__slide";
      let im;
      if (i === 0) {
        im = firstImg;
      } else {
        im = document.createElement("img");
        im.src = src;
        im.alt = firstImg.alt;
        im.loading = "lazy";
      }
      slide.appendChild(im);
      track.appendChild(slide);
    });
    media.insertBefore(track, media.firstChild);

    // arrows
    const mkNav = (cls, label, d) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "card__nav " + cls;
      b.setAttribute("aria-label", label);
      b.innerHTML =
        '<svg width="9" height="16" viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="1.4"><path d="' +
        d + '"/></svg>';
      return b;
    };
    const prev = mkNav("card__prev", "Previous image", "M11 1L2 10l9 9");
    const next = mkNav("card__next", "Next image", "M1 1l9 9-9 9");
    media.appendChild(prev);
    media.appendChild(next);

    // dots
    const dots = document.createElement("div");
    dots.className = "card__dots";
    media.appendChild(dots);

    let idx = 0;
    const go = (i) => {
      idx = (i + srcs.length) % srcs.length;
      track.style.transform = "translateX(-" + idx * 100 + "%)";
      dots.querySelectorAll("button").forEach((d, di) =>
        d.classList.toggle("is-active", di === idx)
      );
    };
    srcs.forEach((s, i) => {
      const d = document.createElement("button");
      d.type = "button";
      d.setAttribute("aria-label", "Image " + (i + 1));
      d.addEventListener("click", (e) => {
        e.stopPropagation();
        go(i);
      });
      dots.appendChild(d);
    });
    prev.addEventListener("click", (e) => { e.stopPropagation(); go(idx - 1); });
    next.addEventListener("click", (e) => { e.stopPropagation(); go(idx + 1); });
    go(0);

    // touch swipe (also prevents opening quick-view on a swipe)
    let sx = null, swiped = false;
    media.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; swiped = false; }, { passive: true });
    media.addEventListener("touchend", (e) => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { go(idx + (dx < 0 ? 1 : -1)); swiped = true; }
      sx = null;
    }, { passive: true });
    media.addEventListener("click", (e) => { if (swiped) { e.stopPropagation(); swiped = false; } }, true);
  });

  /* ---------- Quick view (product card modal) ---------- */
  const qv = document.querySelector("[data-quickview]");
  if (qv) {
    const track = qv.querySelector(".qv-track");
    const dotsWrap = qv.querySelector("[data-qv-dots]");
    const prevBtn = qv.querySelector("[data-qv-prev]");
    const nextBtn = qv.querySelector("[data-qv-next]");
    const qvCat = qv.querySelector(".qv-cat");
    const qvName = qv.querySelector(".qv-name");
    const qvMeta = qv.querySelector(".qv-meta");
    const qvDesc = qv.querySelector(".qv-desc");
    const qvPrice = qv.querySelector(".qv-price");
    const qvShipping = qv.querySelector("[data-qv-shipping]");
    const qvSignature = qv.querySelector("[data-qv-signature]");
    const recsWrap = qv.querySelector("[data-qv-recs]");
    const recsRow = qv.querySelector("[data-qv-recs-row]");
    let lastFocus = null;
    let currentCard = null;

    // catalog + recommendation helpers
    const allCards = Array.from(document.querySelectorAll("[data-category]"));
    // cache metal from the English meta now, before any translation runs
    allCards.forEach((el) => {
      const m = (el.querySelector(".card__meta")?.textContent || "").toLowerCase();
      el.dataset.metal = m.includes("platinum") ? "platinum" : (m.includes("gold") ? "gold" : "");
    });
    const metalOf = (el) => ({ plat: el.dataset.metal === "platinum", gold: el.dataset.metal === "gold" });
    const enNameOf = (c) =>
      c.__enName || c.querySelector(".card__name")?.textContent.trim() || "";
    // curated "Complete the Look" sets — any item recommends the other three (both ways)
    const LOOK_SETS = [
      ["Diamond Blossom Bracelet", "Clover Diamond Pendant", "“Celestial Moth” Lab-Grown Diamond Earrings", "Halo Diamond Ring"],
      ["Wings of Tenderness Diamond Bracelet", "Butterfly Diamond Necklace", "Butterfly Diamond Stud Earrings", "Radiant Alliance Diamond Ring"],
      ["Infinity Diamond Tennis Bracelet", "Royal Tear Diamond Pendant", "Diamond Halo Drop Earrings", "Platinum Trio Diamond Ring"],
    ];
    // directed recommendations — only the named piece shows this exact list
    const RECS_DIRECT = {
      "Faith Diamond Pendant": ["Infinity Diamond Tennis Bracelet", "Radiance Diamond Stud Earrings", "Icy Heart Diamond Ring"],
      "Mirror Diamond Pendant": ["Elite Diamond Ring", "Platinum Bud Stud Earrings", "Diamond Blossom Bracelet"],
      "Felix Eye Diamond Pendant": ["Golden Clover Stud Earrings", "Harmony Diamond Ring", "Princess Diamond Ring"],
      "Flaming Crystal Diamond Pendant": ["Golden Ice Diamond Ring", "Princess Diamond Ring"],
    };

    const renderRecs = (card) => {
      if (!recsWrap || !recsRow) return;
      let picks = [];
      const enName = enNameOf(card);
      const look = LOOK_SETS.find((s) => s.includes(enName));
      if (RECS_DIRECT[enName]) {
        picks = RECS_DIRECT[enName]
          .map((n) => allCards.find((c) => enNameOf(c) === n))
          .filter(Boolean);
      } else if (look) {
        picks = look
          .filter((n) => n !== enName)
          .map((n) => allCards.find((c) => enNameOf(c) === n))
          .filter(Boolean);
      } else {
        const cat = card.dataset.category;
        const cm = metalOf(card);
        const order = ["rings", "necklaces", "earrings", "bracelets"].filter(
          (c) => c !== cat
        );
        order.forEach((tc) => {
          const pool = allCards.filter(
            (c) => c.dataset.category === tc && c !== card && !picks.includes(c)
          );
          if (!pool.length) return;
          let pick = pool.find((c) => {
            const mm = metalOf(c);
            return (cm.plat && mm.plat) || (cm.gold && mm.gold);
          });
          if (!pick) pick = pool[0];
          picks.push(pick);
        });
      }
      recsRow.innerHTML = "";
      picks.slice(0, 3).forEach((rc) => {
        const img = rc.querySelector("img");
        const item = document.createElement("div");
        item.className = "qv-rec";
        const media = document.createElement("div");
        media.className = "qv-rec__media";
        const im = document.createElement("img");
        im.src = img ? img.getAttribute("src") : "";
        im.alt = rc.querySelector(".card__name")?.textContent || "";
        im.loading = "lazy";
        media.appendChild(im);
        const nm = document.createElement("p");
        nm.className = "qv-rec__name";
        nm.textContent = rc.querySelector(".card__name")?.textContent || "";
        const pr = document.createElement("p");
        pr.className = "qv-rec__price";
        pr.textContent = rc.querySelector(".card__price")?.textContent || "";
        item.append(media, nm, pr);
        item.addEventListener("click", () => {
          openQV(rc);
        });
        recsRow.appendChild(item);
      });
      recsWrap.hidden = picks.length === 0;
    };
    let images = [];
    let index = 0;

    const goTo = (i) => {
      if (!images.length) return;
      index = (i + images.length) % images.length;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dotsWrap.querySelectorAll("button").forEach((d, di) =>
        d.classList.toggle("is-active", di === index)
      );
    };

    const buildCarousel = (imgs, alt) => {
      images = imgs;
      track.innerHTML = "";
      dotsWrap.innerHTML = "";
      imgs.forEach((src, i) => {
        const slide = document.createElement("div");
        slide.className = "qv-slide";
        const im = document.createElement("img");
        im.src = src;
        im.alt = alt + (imgs.length > 1 ? " — view " + (i + 1) : "");
        slide.appendChild(im);
        track.appendChild(slide);

        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "View image " + (i + 1));
        dot.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(dot);
      });
      const multi = imgs.length > 1;
      prevBtn.hidden = !multi;
      nextBtn.hidden = !multi;
      dotsWrap.style.display = multi ? "flex" : "none";
      track.style.transition = "none";
      goTo(0);
      requestAnimationFrame(() => { track.style.transition = ""; });
    };

    const openQV = (card) => {
      const img = card.querySelector("img");
      const name = card.querySelector(".card__name")?.textContent || "";
      const meta = card.querySelector(".card__meta")?.textContent || "";
      const price = card.querySelector(".card__price")?.textContent || "";
      const cat = card.dataset.category || "";
      const desc =
        card.dataset.desc ||
        "A considered Alméra piece, crafted in enduring materials and finished by hand — designed to be worn every day and kept for years to come.";

      const imgs = img ? [img.getAttribute("src")] : [];
      if (img && img.dataset.altSrc) {
        img.dataset.altSrc.split(",").forEach((s) => {
          const t = s.trim();
          if (t) imgs.push(t);
        });
      }
      buildCarousel(imgs, name);

      currentCard = card;
      qvCat.textContent = cat
        ? (window.ALMERA ? window.ALMERA.category(cat) : cat.charAt(0).toUpperCase() + cat.slice(1))
        : "";
      qvName.textContent = name;
      qvMeta.textContent = meta;
      qvDesc.textContent = desc;
      qvPrice.textContent = price;

      const priceNum = parseInt(price.replace(/[^0-9]/g, ""), 10);
      if (qvShipping) qvShipping.hidden = !(priceNum >= 2000);

      if (qvSignature) qvSignature.hidden = !card.querySelector(".card__badge");

      renderRecs(card);

      const dlg = qv.querySelector(".quickview__dialog");
      if (dlg) {
        dlg.scrollTop = 0;
        requestAnimationFrame(() => { dlg.scrollTop = 0; });
      }

      lastFocus = document.activeElement;
      qv.classList.add("is-open");
      qv.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      qv.querySelector(".quickview__close").focus({ preventScroll: true });
    };

    const closeQV = () => {
      qv.classList.remove("is-open");
      qv.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };

    document.querySelectorAll("[data-category]").forEach((card) => {
      card.addEventListener("click", () => openQV(card));
    });

    // auto-open a specific piece when arriving from another page (?view=<image-base>)
    const viewParam = new URLSearchParams(location.search).get("view");
    if (viewParam) {
      const target = allCards.find((c) => {
        const img = c.querySelector("img");
        if (!img) return false;
        const base = (img.getAttribute("src") || "")
          .split("/").pop().replace(/\.[^.]+$/, "");
        return base === viewParam;
      });
      if (target) openQV(target);
    }

    qv.querySelectorAll("[data-qv-close]").forEach((el) =>
      el.addEventListener("click", closeQV)
    );
    prevBtn.addEventListener("click", () => goTo(index - 1));
    nextBtn.addEventListener("click", () => goTo(index + 1));
    document.addEventListener("keydown", (e) => {
      if (!qv.classList.contains("is-open")) return;
      if (e.key === "Escape") closeQV();
      else if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === "ArrowRight") goTo(index + 1);
    });
    // refresh open quick view when language changes
    document.addEventListener("almera:langchange", () => {
      if (qv.classList.contains("is-open") && currentCard) openQV(currentCard);
    });
  }

  /* ---------- Contact form (prototype only) ---------- */
  const form = document.querySelector("[data-form]");
  if (form) {
    const note = form.querySelector(".form-note");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (note) {
        note.textContent =
          (window.ALMERA && window.ALMERA.t("form.note")) ||
          "Thank you — your message has been noted.";
      }
      form.reset();
    });
  }

  /* ---------- Image fallback (elegant placeholder) ---------- */
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    img.addEventListener("error", () => {
      const holder = img.closest(".imgfail-target") || img.parentElement;
      if (holder) holder.classList.add("imgfail");
    });
  });

  /* ---------- Current year in footer ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
