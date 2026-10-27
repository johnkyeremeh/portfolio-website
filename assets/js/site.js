/* ============================================================================
   John Kyeremeh — site behaviours
   Progressive enhancement only. Every page's copy lives in real HTML so the
   site works (and indexes) with JavaScript disabled.
   ========================================================================= */

(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isDesktop = window.matchMedia("(min-width: 901px)").matches;

  /* ─────────────────────── Interactive constellation backdrop ───────────────────────
     Ported from certifiedg.ai. Monochrome spring-mesh on black; the cursor pushes
     nodes out of the way and they snap back. Static single frame under reduced motion. */
  function initConstellation() {
    var canvas = document.getElementById("constellation");
    if (!canvas) return;
    var ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    var width = 0, height = 0, dpr = 1;
    var nodes = [];
    var mouse = {
      x: -1000, y: -1000, prevX: -1000, prevY: -1000,
      vx: 0, vy: 0, radius: 220
    };
    var NODE = "255, 255, 255";
    var frame = null;

    function initNodes() {
      nodes = [];
      var spacing = 58;
      var cols = Math.ceil(width / spacing) + 1;
      var rows = Math.ceil(height / spacing) + 1;
      for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
          var x = i * spacing, y = j * spacing;
          nodes.push({
            x: x, y: y, vx: 0, vy: 0, baseX: x, baseY: y,
            radius: Math.random() * 1.2 + 1.2,
            pulse: Math.random() * Math.PI * 2
          });
        }
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initNodes();
    }

    function drawConnections() {
      var MAX = 78, MAXSQ = MAX * MAX;
      ctx.lineWidth = 0.7;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var n2 = nodes[j];
          var ndx = n.x - n2.x, ndy = n.y - n2.y, dsq = ndx * ndx + ndy * ndy;
          if (dsq < MAXSQ) {
            var nd = Math.sqrt(dsq);
            ctx.strokeStyle = "rgba(" + NODE + ", " + ((1 - nd / MAX) * 0.16) + ")";
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }
    }

    function staticPaint() {
      resize();
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
      drawConnections();
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        ctx.fillStyle = "rgba(" + NODE + ", 0.28)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    resize();

    if (prefersReduced) {
      staticPaint();
      window.addEventListener("resize", staticPaint);
      return;
    }

    function onMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    function onLeave() {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.prevX = -1000;
      mouse.prevY = -1000;
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onLeave);

    var lastTime = performance.now();
    var SPRING_K = 18, DAMPING = 0.82;

    function render(now) {
      var dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      mouse.vx = (mouse.x - mouse.prevX) / (dt * 1000 || 1);
      mouse.vy = (mouse.y - mouse.prevY) / (dt * 1000 || 1);
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      var speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.pulse += dt * 3;
        var dx = mouse.x - n.x, dy = mouse.y - n.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius && dist > 0) {
          var power = 1 - dist / mouse.radius;
          var force = power * (1500 + speed * 150);
          var angle = Math.atan2(dy, dx);
          n.vx -= Math.cos(angle) * force * dt;
          n.vy -= Math.sin(angle) * force * dt;
        }
        n.vx += (n.baseX - n.x) * SPRING_K * dt;
        n.vy += (n.baseY - n.y) * SPRING_K * dt;
        n.vx *= DAMPING;
        n.vy *= DAMPING;
        n.x += n.vx * dt * 60;
        n.y += n.vy * dt * 60;
      }

      drawConnections();

      for (var k = 0; k < nodes.length; k++) {
        var m = nodes[k];
        var mdx = mouse.x - m.x, mdy = mouse.y - m.y;
        var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        var baseAlpha = 0.22 + Math.sin(m.pulse) * 0.08;
        var r = m.radius + Math.sin(m.pulse) * 0.3;

        // Nodes bloom as the cursor approaches, then fade back into the mesh.
        if (mdist < mouse.radius) {
          baseAlpha += (1 - mdist / mouse.radius) * 0.5;
          r += (1 - mdist / mouse.radius) * 1.4;
        }

        ctx.fillStyle = "rgba(" + NODE + ", " + baseAlpha + ")";
        ctx.beginPath();
        ctx.arc(m.x, m.y, Math.max(0.5, r), 0, Math.PI * 2);
        ctx.fill();
      }

      frame = requestAnimationFrame(render);
    }
    frame = requestAnimationFrame(render);

    // Stop churning frames while the tab is hidden.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (frame) cancelAnimationFrame(frame);
        frame = null;
      } else if (!frame) {
        lastTime = performance.now();
        frame = requestAnimationFrame(render);
      }
    });
  }

  /* ─────────────────────── Nav + mobile menu ─────────────────────── */
  function initNav() {
    var menu = document.querySelector("[data-mobile-menu]");
    var openBtn = document.querySelector("[data-menu-open]");
    var closeBtn = document.querySelector("[data-menu-close]");
    if (!menu || !openBtn) return;

    function setOpen(on) {
      menu.classList.toggle("is-open", on);
      menu.setAttribute("aria-hidden", on ? "false" : "true");
      openBtn.setAttribute("aria-expanded", on ? "true" : "false");
      document.body.style.overflow = on ? "hidden" : "";
    }

    openBtn.addEventListener("click", function () { setOpen(true); });
    if (closeBtn) closeBtn.addEventListener("click", function () { setOpen(false); });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) setOpen(false);
    });
  }

  /* ─────────────────────── Word-by-word blur-in for the hero title ───────────────────────
     Splits on first paint so the un-split text is what search engines and no-JS
     visitors see. */
  function initBlurText() {
    var els = document.querySelectorAll("[data-blur-text]");
    if (!els.length) return;

    if (prefersReduced) {
      els.forEach(function (el) {
        el.classList.add("is-in");
        el.style.opacity = "1";
        el.style.filter = "none";
      });
      return;
    }

    els.forEach(function (el) {
      var words = (el.textContent || "").trim().split(/\s+/);
      el.textContent = "";
      words.forEach(function (word, i) {
        var span = document.createElement("span");
        span.className = "word";
        span.textContent = word;
        span.style.opacity = "0";
        span.style.filter = "blur(10px)";
        span.style.transform = "translateY(50px)";
        span.style.transition =
          "opacity 0.7s ease-out " + i * 0.1 + "s, filter 0.7s ease-out " + i * 0.1 + "s, transform 0.7s ease-out " + i * 0.1 + "s";
        el.appendChild(span);
      });

      function settle(hard) {
        el.querySelectorAll(".word").forEach(function (span) {
          // `hard` drops the transition first, so the final values are used
          // directly instead of relying on an animation timeline that may never
          // advance (backgrounded or non-compositing tab).
          if (hard) span.style.transition = "none";
          span.style.opacity = "1";
          span.style.filter = "blur(0px)";
          span.style.transform = "translateY(0)";
        });
      }

      // Flush the start values so the transition has something to animate from,
      // then settle. rAF alone is not enough here: if it never fires the
      // headline stays invisible, so we settle synchronously and then pin the
      // state once the stagger has had time to play.
      void el.offsetHeight;
      settle(false);
      setTimeout(function () { settle(true); }, 1400);
    });
  }

  /* ─────────────────────── Scroll reveal ─────────────────────── */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    // Reveal immediately if we cannot animate: reduced motion, no observer, or a
    // tab that starts hidden and may never advance the transition timeline.
    if (prefersReduced || !("IntersectionObserver" in window) || document.visibilityState === "hidden") {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseFloat(el.dataset.revealDelay || "0");
        setTimeout(function () { el.classList.add("is-in"); }, delay);
        obs.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    els.forEach(function (el) { obs.observe(el); });

    /* Failsafe. IntersectionObserver callbacks are delivered during rendering,
       so an element can sit hidden indefinitely if the page never renders (a
       tab opened in the background, or an embedded view that is not
       compositing). Reveal anything already in the viewport on load, and again
       after a beat, so the page can never present as blank. */
    function revealVisible() {
      els.forEach(function (el) {
        if (el.classList.contains("is-in")) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-in");
      });
    }
    window.addEventListener("load", revealVisible);
    setTimeout(revealVisible, 2500);
  }

  /* ─────────────────────── Hero: parallax + hover lift ─────────────────────── */
  function initHeroStage() {
    var wrap = document.querySelector("[data-stage]");
    if (!wrap) return;

    var slots = Array.prototype.slice.call(wrap.querySelectorAll(".card-slot"));
    slots.forEach(function (slot) {
      slot.addEventListener("pointerenter", function () { slot.classList.add("is-hover"); });
      slot.addEventListener("pointerleave", function () { slot.classList.remove("is-hover"); });
    });

    if (prefersReduced || !isDesktop) return;

    var targetX = 0, targetY = 0, curX = 0, curY = 0, raf = null;

    function onMove(e) {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    window.addEventListener("pointermove", onMove, { passive: true });

    function tick() {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      for (var i = 0; i < slots.length; i++) {
        var d = parseFloat(slots[i].dataset.depth) || 2;
        var dx = (-curX * d * 14).toFixed(2);
        var dy = (-curY * d * 14).toFixed(2);
        slots[i].style.transform = "translate(-50%,-50%) translate(" + dx + "px," + dy + "px)";
      }
      raf = requestAnimationFrame(tick);
    }
    tick();
  }

  /* ─────────────────────── Profile card tilt ─────────────────────── */
  function initTilt() {
    var root = document.querySelector("[data-tilt-root]");
    if (!root || prefersReduced) return;

    root.querySelectorAll(".tf-tilt").forEach(function (tilt) {
      var card = tilt.querySelector(".tf-card");
      if (!card) return;
      var RF = 10;
      var curX = 0, curY = 0, tgtX = 0, tgtY = 0, raf = null, active = false;

      function frame() {
        curX += (tgtX - curX) * 0.14;
        curY += (tgtY - curY) * 0.14;
        tilt.style.transform =
          "perspective(1000px) rotateX(" + curY.toFixed(2) + "deg) rotateY(" + curX.toFixed(2) + "deg)";
        if (active || Math.abs(tgtX - curX) > 0.02 || Math.abs(tgtY - curY) > 0.02) {
          raf = requestAnimationFrame(frame);
        } else {
          raf = null;
        }
      }
      function ensure() { if (!raf) raf = requestAnimationFrame(frame); }

      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var xPos = (e.clientX - r.left) / r.width - 0.5;
        var yPos = (e.clientY - r.top) / r.height - 0.5;
        tgtX = 2 * RF * xPos;
        tgtY = -2 * RF * yPos;
        active = true;
        ensure();
      });
      card.addEventListener("mouseleave", function () {
        tgtX = 0; tgtY = 0; active = false; ensure();
      });
    });
  }

  /* ─────────────────────── Seamless ticker ───────────────────────
     The track is rendered once in HTML; we duplicate it so translateX(-50%)
     lands exactly on a seam. */
  function initTicker() {
    document.querySelectorAll(".ticker-track").forEach(function (track) {
      var items = Array.prototype.slice.call(track.children);
      if (!items.length) return;
      items.forEach(function (node) {
        var clone = node.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("a").forEach(function (a) { a.tabIndex = -1; });
        track.appendChild(clone);
      });
      track.style.setProperty("--ticker-count", items.length);
    });
  }

  /* ─────────────────────── Work page: active row + case overlay ─────────────────────── */
  function initWorkPage() {
    var panel = document.querySelector("[data-case-panel]");
    if (!panel) return;

    var overlay = document.querySelector("[data-case-overlay]");
    var stickybar = document.querySelector("[data-case-stickybar]");
    var stickyText = document.querySelector("[data-case-stickybar-text]");
    var body = document.querySelector("[data-case-body]");
    var titleEl = panel.querySelector(".case-title");
    var deckEl = panel.querySelector(".case-deck");
    var metaEl = panel.querySelector("[data-case-meta]");
    var closeBtn = document.querySelector("[data-case-close]");
    var CASES = window.CASES || {};
    var lastFocus = null;

    /* ── Case body block renderer ── */
    function el(tag, className, text) {
      var n = document.createElement(tag);
      if (className) n.className = className;
      if (text != null) n.textContent = text;
      return n;
    }

    function appendBlock(target, block) {
      if (block.type === "h3") {
        target.appendChild(el("h3", "case-h3", block.text));
      } else if (block.type === "p") {
        target.appendChild(el("p", "case-p", block.text));
      } else if (block.type === "list") {
        var ul = el("ul", "case-list");
        block.items.forEach(function (item) { ul.appendChild(el("li", null, item)); });
        target.appendChild(ul);
      } else if (block.type === "figure") {
        var fig = el("figure", "case-figure");
        var img = el("img");
        img.src = block.src;
        img.alt = block.alt || "";
        img.loading = "lazy";
        fig.appendChild(img);
        if (block.caption) fig.appendChild(el("figcaption", null, block.caption));
        target.appendChild(fig);
      } else if (block.type === "impact") {
        var grid = el("div", "case-impact");
        block.items.forEach(function (item) {
          var card = el("div", "impact-card");
          card.appendChild(el("div", "impact-value", item.value));
          card.appendChild(el("div", "impact-label", item.label));
          grid.appendChild(card);
        });
        target.appendChild(grid);
      }
    }

    function renderCase(slug) {
      var c = CASES[slug];
      if (!c) return false;

      titleEl.textContent = c.title;
      deckEl.textContent = c.deck;
      stickyText.textContent = c.title;

      metaEl.innerHTML = "";
      (c.tags || []).forEach(function (tag) {
        var chip = el("span", "cap-tag liquid-glass", tag);
        metaEl.appendChild(chip);
      });

      body.innerHTML = "";

      if (c.specs && c.specs.length) {
        var dl = el("dl", "case-specs");
        c.specs.forEach(function (spec) {
          var row = el("div", "spec");
          row.appendChild(el("dt", null, spec.label));
          row.appendChild(el("dd", null, spec.value));
          dl.appendChild(row);
        });
        body.appendChild(dl);
      }

      (c.blocks || []).forEach(function (block) { appendBlock(body, block); });

      if (c.links && c.links.length) {
        var actions = el("div", "case-actions");
        c.links.forEach(function (link) {
          var a = el("a", "case-action liquid-glass", link.label);
          a.href = link.href;
          if (/^https?:/.test(link.href)) {
            a.target = "_blank";
            a.rel = "noopener noreferrer";
          }
          actions.appendChild(a);
        });
        body.appendChild(actions);
      }

      return true;
    }

    var isOpen = false;

    function openCase(slug, push) {
      if (!renderCase(slug)) return;
      lastFocus = document.activeElement;
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      if (overlay) overlay.classList.add("open");
      document.body.classList.add("case-open");
      panel.scrollTop = 0;
      isOpen = true;
      if (push !== false) {
        history.pushState({ project: slug }, "", "?project=" + encodeURIComponent(slug));
      }
      closeBtn.focus({ preventScroll: true });
    }

    /* Tear the panel down without touching history. */
    function detachCase() {
      // Focus must leave the panel *before* it is hidden from assistive tech, or
      // the browser rejects aria-hidden on an ancestor of the focused element.
      if (panel.contains(document.activeElement)) {
        if (lastFocus && typeof lastFocus.focus === "function") {
          lastFocus.focus({ preventScroll: true });
        } else {
          document.activeElement.blur();
        }
      }
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      if (overlay) overlay.classList.remove("open");
      document.body.classList.remove("case-open");
      if (stickybar) stickybar.classList.remove("scrolled");
      isOpen = false;
    }

    function closeCase() {
      if (!isOpen) return;
      // If we pushed a history entry for this case, unwinding it is the right move.
      // If the visitor deep-linked straight in, there is no entry of ours to pop,
      // and history.back() would take them off the page entirely.
      var pushedEntry = !!(history.state && history.state.project);
      detachCase();
      if (pushedEntry) {
        history.back();
      } else {
        history.replaceState({}, "", location.pathname);
      }
    }

    /* Open the case named in the URL so case studies are linkable/shareable. */
    function applyURL() {
      var slug = new URLSearchParams(location.search).get("project");
      if (slug && CASES[slug]) {
        openCase(slug, false);
      } else if (isOpen) {
        detachCase();
      }
    }

    document.querySelectorAll("[data-project]").forEach(function (node) {
      node.addEventListener("click", function (e) {
        var slug = node.dataset.project;
        if (!CASES[slug]) return;
        e.preventDefault();
        openCase(slug);
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", function () { closeCase(); });
    if (overlay) overlay.addEventListener("click", function () { closeCase(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) closeCase();
    });
    window.addEventListener("popstate", applyURL);

    /* Sticky bar gains its backdrop once the panel scrolls. */
    if (stickybar) {
      panel.addEventListener("scroll", function () {
        stickybar.classList.toggle("scrolled", panel.scrollTop > 12);
      }, { passive: true });
    }

    applyURL();

    /* ── Highlight the company row currently in view ── */
    var rows = Array.prototype.slice.call(document.querySelectorAll("[data-row]"));
    if (!rows.length) return;

    function pickActive() {
      var best = null, bestScore = -Infinity;
      var mid = window.innerHeight * 0.38;
      rows.forEach(function (row) {
        var r = row.getBoundingClientRect();
        var score = -(Math.abs(r.top + Math.min(r.height, window.innerHeight) / 2 - mid));
        if (r.bottom > 0 && r.top < window.innerHeight && score > bestScore) {
          bestScore = score;
          best = row;
        }
      });
      rows.forEach(function (row) { row.classList.toggle("is-active", row === best); });
    }

    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { pickActive(); ticking = false; });
    }, { passive: true });
    pickActive();
  }

  /* ─────────────────────── Portrait fallback ───────────────────────
     The profile frame ships with a monogram underneath and an <img> that is
     only satisfied once a portrait file exists. A missing portrait should never
     leave a broken-image box, so drop the element on error. */
  function initPortraitFallback() {
    document.querySelectorAll(".tf-img").forEach(function (img) {
      function drop() {
        if (!img.naturalWidth) img.remove();
      }
      if (img.complete) drop();
      img.addEventListener("error", drop);
    });
  }

  /* ─────────────────────── Footer year ─────────────────────── */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function boot() {
    initConstellation();
    initNav();
    initBlurText();
    initReveal();
    initHeroStage();
    initTilt();
    initTicker();
    initWorkPage();
    initPortraitFallback();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
