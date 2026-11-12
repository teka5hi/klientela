
(function(){
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= KUCANJE ================= */
  var Type = (function(){
    function typeify(el){
      if(!el.dataset.typed){
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        var nodes = [], n;
        while((n = walker.nextNode())) if(n.nodeValue.length) nodes.push(n);
        nodes.forEach(function(node){
          var frag = document.createDocumentFragment();
          var txt = node.nodeValue;
          for(var i = 0; i < txt.length; i++){
            var s = document.createElement("span");
            s.className = "ch";
            s.textContent = txt[i];
            frag.appendChild(s);
          }
          node.parentNode.replaceChild(frag, node);
        });
        el.dataset.typed = "1";
      }
      el._chars = Array.prototype.slice.call(el.querySelectorAll(".ch"));
    }
    function clearCur(el){
      if(el._rafId){ clearTimeout(el._rafId); el._rafId = null; }
      if(el._cur){ el._cur.classList.remove("cur"); el._cur = null; }
    }
    function play(el, speed, delay, done){
      typeify(el);
      if(reduced){
        el._chars.forEach(function(s){ s.classList.add("on"); });
        if(done) done();
        return;
      }
      clearCur(el);
      el._chars.forEach(function(s){ s.classList.remove("on"); });
      var i = 0;
      var gen = (el._gen = (el._gen || 0) + 1);
      function tick(){
        if(gen !== el._gen) return;
        if(i >= el._chars.length){
          clearCur(el);
          if(done) done();
          return;
        }
        var c = el._chars[i];
        c.classList.add("on");
        if(el._cur && el._cur !== c) el._cur.classList.remove("cur");
        c.classList.add("cur");
        el._cur = c;
        i++;
        var sp = c.textContent === " " ? Math.max(8, speed * .4) : speed;
        el._rafId = setTimeout(tick, sp);
      }
      el._rafId = setTimeout(tick, delay || 0);
    }
    function finish(el){
      if(!el) return;
      typeify(el);
      clearCur(el);
      el._gen = (el._gen || 0) + 1;
      el._chars.forEach(function(s){ s.classList.add("on"); });
    }
    return { play: play, typeify: typeify, finish: finish };
  })();

  document.querySelectorAll("[data-type]").forEach(Type.typeify);
  document.querySelectorAll(".crs-caption h3, .crs-caption p").forEach(Type.typeify);
  if(reduced){
    document.querySelectorAll(".ch").forEach(function(s){ s.classList.add("on"); });
  }

  var header = document.getElementById("siteHeader");
  window.addEventListener("scroll", function(){
    header.classList.toggle("scrolled", window.scrollY > 10);
  }, {passive:true});

  var mnav = document.getElementById("mnav");
  var toggle = document.getElementById("navToggle");
  function setMenu(open){
    mnav.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  toggle.addEventListener("click", function(){ setMenu(!mnav.classList.contains("open")); });
  mnav.querySelectorAll("[data-close], a").forEach(function(el){
    el.addEventListener("click", function(){ setMenu(false); });
  });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape") setMenu(false); });

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, {threshold:.12, rootMargin:"0px 0px -40px 0px"});
  document.querySelectorAll("[data-reveal]").forEach(function(el){ io.observe(el); });

  var tio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        tio.unobserve(e.target);
        Type.play(e.target, 18, 120);
      }
    });
  }, {threshold:.3, rootMargin:"0px 0px -60px 0px"});
  document.querySelectorAll('[data-type]:not([data-type="hero"]):not([data-type="net"])').forEach(function(el){ tio.observe(el); });

  function fmt(n){ return n.toLocaleString("de-DE"); }
  function animateCount(el){
    var target = parseInt(el.dataset.target, 10);
    var suffix = el.dataset.suffix || "";
    if(reduced){ el.textContent = fmt(target) + suffix; return; }
    var dur = 1400, start = performance.now();
    function frame(t){
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased)) + suffix;
      if(p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var cio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ animateCount(e.target); cio.unobserve(e.target); }
    });
  }, {threshold:.4});
  document.querySelectorAll(".stat-num").forEach(function(el){ cio.observe(el); });

  var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  var so = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        navLinks.forEach(function(l){
          l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id);
        });
      }
    });
  }, {rootMargin:"-40% 0px -55% 0px"});
  document.querySelectorAll("main section[id]").forEach(function(s){ so.observe(s); });

  var form = document.getElementById("demoForm");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var ok = true;
    form.querySelectorAll("[required]").forEach(function(f){
      var err = f.closest(".field").querySelector(".field-err");
      var bad = !f.value.trim();
      if(!bad && f.type === "email") bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value);
      f.classList.toggle("invalid", bad);
      err.textContent = bad ? (f.type === "email" ? "Unesite ispravnu email adresu." : "Obavezno polje.") : "";
      if(bad) ok = false;
    });
    if(ok){
      form.querySelector(".form-body").style.display = "none";
      document.getElementById("formSuccess").style.display = "flex";
    }
  });
  form.querySelectorAll("input, textarea").forEach(function(f){
    f.addEventListener("input", function(){
      f.classList.remove("invalid");
      var err = f.closest(".field").querySelector(".field-err");
      if(err) err.textContent = "";
    });
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ================= CAROUSEL ================= */
  (function(){
    var crs = document.getElementById("crs");
    if(!crs) return;
    var viewport = document.getElementById("crsViewport");
    var track = document.getElementById("crsTrack");
    var dotsBox = document.getElementById("crsDots");
    var originals = Array.prototype.slice.call(track.children);
    var N = originals.length;
    if(N === 0) return;

    if(N > 1){
      var head = document.createDocumentFragment(), tail = document.createDocumentFragment();
      originals.forEach(function(s){ head.appendChild(s.cloneNode(true)); tail.appendChild(s.cloneNode(true)); });
      track.insertBefore(head, track.firstChild);
      track.appendChild(tail);
    }
    var slides = Array.prototype.slice.call(track.children);

    var dots = [];
    for(var d = 0; d < N; d++){
      (function(real){
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Slajd " + (real + 1));
        b.addEventListener("click", function(){ goTo(N + real, true); restart(); });
        dotsBox.appendChild(b);
        dots.push(b);
      })(d);
    }

    var index = N;
    var slideW = 0, stepW = 0;
    var inView = false, hovering = false, timer = null, typedInit = false;
    var typedLogical = {};

    function measure(){
      slideW = slides[0].offsetWidth;
      stepW = slides.length > 1 ? (slides[1].offsetLeft - slides[0].offsetLeft) : slideW;
    }
    function xFor(i){
      var vw = viewport.clientWidth;
      return (vw - slideW) / 2 - i * stepW;
    }
    function apply(anim){
      track.style.transition = anim ? "transform .65s cubic-bezier(.22,.61,.36,1)" : "none";
      track.style.transform = "translate3d(" + xFor(index).toFixed(1) + "px,0,0)";
    }
    function paint(){
      var real = ((index % N) + N) % N;
      slides.forEach(function(s, i){ s.classList.toggle("is-active", i === index); });
      dots.forEach(function(btn, i){ btn.classList.toggle("on", i === real); });
    }
    function typeCaption(slide, logical){
      var cap = slide.querySelector(".crs-caption");
      if(!cap) return;
      if(typedLogical[logical]){
        cap.querySelectorAll(".ch").forEach(function(s){ s.classList.add("on"); });
        return;
      }
      typedLogical[logical] = true;
      var h = cap.querySelector("h3"), p = cap.querySelector("p");
      if(h) Type.play(h, 24, 250);
      if(p) Type.play(p, 8, 250);
    }
    function goTo(i, anim){
      index = i;
      apply(anim);
      paint();
      typeCaption(slides[index], ((index % N) + N) % N);
    }
    function next(){ goTo(index + 1, true); }
    function prev(){ goTo(index - 1, true); }
    function restart(){ stopAuto(); startAuto(); }
    track.addEventListener("transitionend", function(e){
      if(e.target !== track || e.propertyName !== "transform") return;
      if(index >= 2 * N){ index -= N; apply(false); }
      else if(index < N){ index += N; apply(false); }
    });
    function stopAuto(){ if(timer){ clearInterval(timer); timer = null; } }
    function startAuto(){
      stopAuto();
      if(!reduced && inView && !hovering && N > 1) timer = setInterval(next, 4000);
    }
    crs.addEventListener("mouseenter", function(){ hovering = true; startAuto(); });
    crs.addEventListener("mouseleave", function(){ hovering = false; startAuto(); });
    new IntersectionObserver(function(en){
      inView = en[0].isIntersecting;
      if(inView && !typedInit){
        typedInit = true;
        typeCaption(slides[index], ((index % N) + N) % N);
      }
      startAuto();
    }, {threshold:.2}).observe(crs);
    document.getElementById("crsPrev").addEventListener("click", function(){ prev(); restart(); });
    document.getElementById("crsNext").addEventListener("click", function(){ next(); restart(); });
    var dragging = false, startX = 0, dx = 0, baseX = 0;
    viewport.addEventListener("pointerdown", function(e){
      if(N < 2) return;
      dragging = true; startX = e.clientX; dx = 0;
      baseX = xFor(index);
      track.style.transition = "none";
      viewport.classList.add("grabbing");
      if(viewport.setPointerCapture){ try{ viewport.setPointerCapture(e.pointerId); }catch(_){} }
    });
    viewport.addEventListener("pointermove", function(e){
      if(!dragging) return;
      dx = e.clientX - startX;
      track.style.transform = "translate3d(" + (baseX + dx).toFixed(1) + "px,0,0)";
    });
    function endDrag(){
      if(!dragging) return;
      dragging = false;
      viewport.classList.remove("grabbing");
      var delta = Math.abs(dx) > 50 ? (dx < 0 ? 1 : -1) : 0;
      if(delta !== 0){
        goTo(index + delta, true);
        restart();
      }
    }
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    document.addEventListener("keydown", function(e){
      if(!inView) return;
      if(e.key === "ArrowRight"){ next(); restart(); }
      else if(e.key === "ArrowLeft"){ prev(); restart(); }
    });
    window.addEventListener("resize", function(){ measure(); apply(false); });
    window.addEventListener("load", function(){ measure(); apply(false); });
    measure();
    apply(false);
    paint();
    startAuto();
  })();

  /* ==========================================================
     HERO SEKVENSA — MREŽA POSTAJE LOGO (1:1)

     - broj čvorova mreže = broj TAČAKA iz tvog trace-a
     - svaki čvor leti na SVOJU tačku iz LOGO_DATA
     - linije mreže se gase, a između ISTIH čvorova niču
       linije loga (3 paralelne = debljina znaka), redom
       duž svake nacrtane linije
     - čestice teku duž linija loga nakon prelaska
     ========================================================== */
  var canvas = document.getElementById("net");
  var netCopy = document.getElementById("netCopy");
  var netTitle = document.getElementById("netTitle");
  var heroInner = document.getElementById("heroInner");
  var heroEl = document.querySelector(".hero");
  var heroH1 = document.querySelector('h1[data-type="hero"]');
  var heroSub = document.querySelector('.hero-sub[data-type="hero"]');

  if(!canvas || reduced){
    document.body.classList.add("hero-in");
    if(canvas) canvas.style.display = "none";
    if(netCopy) netCopy.classList.add("gone");
  } else {
    var ctx = canvas.getContext("2d"), w, h, nodes = [], raf = null;
    var PH = {HERO:0, TRANSFORM:1, NET:2, DONE:3};
    var phase = PH.HERO;
    var t0 = null, ft0 = 0, netAt = 0;
    var WARP_MS = 900;
    var warpQueued = false, heroTyped = false, unlocked = false;
    var net = null, touchUsed = false, tInNet = false;
    var morph = 0, fadeAll = 0, netCopyGone = false;

    var PAL = [
      ["105,152,255", .36],
      ["150,202,255", .28],
      ["255,255,255", .26],
      ["65,113,245", .10]
    ];
    function pickColor(){
      var r = Math.random(), acc = 0;
      for(var i = 0; i < PAL.length; i++){ acc += PAL[i][1]; if(r < acc) return PAL[i][0]; }
      return "255,255,255";
    }

    var TOP_LB = ["input","fc1","fc2","fc3","fc4","output"];
    var IN_LB  = ["građevinski radovi","IT oprema","zdravstvo","vodoprivreda","energetika","usluge","dobavke"];
    var OUT_LB = ["FIRMA A","FIRMA B","FIRMA C","FIRMA D"];

    /* ==========================================================
       LOGO — tvoje trace tačke; mreža se u njih PRETOPTI
       ========================================================== */
    var LOGO_DATA = {"w":152,"h":102,"paths":[{"closed":false,"w":0.02,"pts":[[0.0473,0.1592],[0.0463,0.7612],[0.0995,0.7597],[0.1005,0.5453],[0.1232,0.4925],[0.2049,0.7612],[0.264,0.7612],[0.1704,0.4323],[0.2611,0.1607],[0.197,0.1592],[0.1113,0.4382],[0.1094,0.1592],[0.0483,0.1607]]},{"closed":false,"w":0.02,"pts":[[0.2138,0.4264],[0.3044,0.1636],[0.9054,0.1621],[0.9911,0.4279],[0.9123,0.767],[0.3103,0.7656],[0.2167,0.4308]]},{"closed":false,"w":0.02,"pts":[[0.2611,0.4294],[0.331,0.2223],[0.3842,0.2253],[0.4631,0.425],[0.3901,0.7054],[0.3389,0.7083],[0.2591,0.4323]]},{"closed":true,"w":0.02,"pts":[[0.4355,0.2238],[0.4847,0.3515],[0.531,0.2253],[0.4325,0.2194]]},{"closed":false,"w":0.02,"pts":[[0.5793,0.2267],[0.6355,0.2282],[0.6975,0.4338],[0.6335,0.7024],[0.5842,0.7039],[0.5015,0.4367],[0.5793,0.2253]]},{"closed":false,"w":0.02,"pts":[[0.4818,0.5233],[0.4384,0.7054],[0.5409,0.7024],[0.4818,0.5219]]},{"closed":false,"w":0.02,"pts":[[0.6867,0.2297],[0.7557,0.4161],[0.6887,0.7054],[0.8778,0.7024],[0.9448,0.4411],[0.8808,0.2209],[0.6837,0.2238]]}]};

    var logoVerts = [];    /* {x,y} normalizovano — redom kako si kliktao */
    var logoEdges = [];    /* {va,vb,ord} — veze između susjednih tačaka */
    var logoBox = {LW:0, LH:0, ox:0, oy:0};
    var logoOK = false;
    var logoParts = [], logoNextPart = 0;

    function logoPrepare(){
      logoVerts = []; logoEdges = []; logoOK = false;
      if(!LOGO_DATA || !LOGO_DATA.paths || !LOGO_DATA.paths.length) return;
      var base = 0;
      LOGO_DATA.paths.forEach(function(P){
        var n = P.pts.length;
        if(n < 2) return;
        for(var j = 0; j < n; j++)
          logoVerts.push({x: P.pts[j][0], y: P.pts[j][1]});
        var segs = P.closed ? n : n - 1;
        for(var s = 0; s < segs; s++)
          logoEdges.push({va: base + s, vb: base + (s + 1) % n, ord: logoEdges.length});
        base += n;
      });
      logoOK = logoVerts.length >= 8 && logoEdges.length > 0;
    }
    logoPrepare();

    /* broj čvorova mreže = broj tačaka loga */
    function layersForLogo(){
      var V = logoVerts.length;
      if(!logoOK || V < 14) return [7,9,10,8,9,4];
      var fr = [.16,.19,.20,.17,.18], ls = [], sum = 0;
      fr.forEach(function(f){ var n = Math.max(2, Math.round(V * f)); ls.push(n); sum += n; });
      ls.push(Math.max(2, V - sum));
      return ls;
    }

    /* veza čvor↔tačka + geometrija; zove se iz buildNet i resize */
    function buildLogoDots(){
      logoParts = [];
      if(!net || !logoOK) return;
      var aspect = LOGO_DATA.h / LOGO_DATA.w;
      var LW = Math.round(w < 900 ? Math.min(w * .9, 560) : Math.min(w * .62, 980));
      var LH = Math.round(LW * aspect);
      if(LH > h * .55){ LH = Math.round(h * .55); LW = Math.round(LH / aspect); }
      logoBox = {LW: LW, LH: LH, ox: Math.round((w - LW) / 2), oy: Math.round(h * .47 - LH / 2)};
      var V = logoVerts.length;
      net.nodes.forEach(function(nd, i){
        if(i < V){
          nd.vp = {x: logoBox.ox + logoVerts[i].x * LW, y: logoBox.oy + logoVerts[i].y * LH};
        } else nd.vp = null;
      });
      console.log("KLIENTELA logo:", V, "tačaka /", logoEdges.length, "linija — mreža:", net.nodes.length, "čvorova");
    }

    /* ================= INTERAKCIJA ================= */
    var mx = -99999, my = -99999, mActive = false;
    var REPEL_R = 120, DISP_N = 64, DISP_S = 90;

    function trackPointer(cx, cy){
      var r = canvas.getBoundingClientRect();
      mx = cx - r.left; my = cy - r.top;
      mActive = (mx > -40 && my > -40 && mx < w + 40 && my < h + 40);
    }
    window.addEventListener("pointermove", function(e){
      if(e.pointerType === "touch") return;
      trackPointer(e.clientX, e.clientY);
    }, {passive:true});
    window.addEventListener("touchstart", function(e){
      if(e.touches && e.touches.length){
        trackPointer(e.touches[0].clientX, e.touches[0].clientY);
        tInNet = net ? inNetArea(e.touches[0].clientX, e.touches[0].clientY) : false;
      }
    }, {passive:true});
    window.addEventListener("touchmove", function(e){
      if(e.touches && e.touches.length) trackPointer(e.touches[0].clientX, e.touches[0].clientY);
    }, {passive:true});
    window.addEventListener("touchend", function(){ mActive = false; }, {passive:true});
    window.addEventListener("touchcancel", function(){ mActive = false; }, {passive:true});
    window.addEventListener("pointerout", function(e){ if(!e.relatedTarget) mActive = false; });
    window.addEventListener("blur", function(){ mActive = false; });

    function updateStarForce(){
      for(var i = 0; i < nodes.length; i++){
        var s = nodes[i], tx = 0, ty = 0;
        if(mActive){
          var dx = s.x - mx, dy = s.y - my, d = Math.sqrt(dx*dx + dy*dy);
          if(d < REPEL_R && d > .01){
            var f = 1 - d / REPEL_R;
            f = f * f * DISP_S;
            tx = (dx / d) * f; ty = (dy / d) * f;
          }
        }
        var sp = (tx !== 0 || ty !== 0) ? .18 : .06;
        s.ox += (tx - s.ox) * sp;
        s.oy += (ty - s.oy) * sp;
      }
    }
    function updateNetForce(){
      if(!net) return;
      for(var i = 0; i < net.nodes.length; i++){
        var nd = net.nodes[i], tx = 0, ty = 0;
        if(mActive && morph < .5){
          var dx = nd.lx - mx, dy = nd.ly - my, d = Math.sqrt(dx*dx + dy*dy);
          if(d < REPEL_R && d > .01){
            var f = 1 - d / REPEL_R;
            f = f * f * DISP_N;
            tx = (dx / d) * f; ty = (dy / d) * f;
          }
        }
        var sp = (tx !== 0 || ty !== 0) ? .16 : .05;
        nd.ox += (tx - nd.ox) * sp;
        nd.oy += (ty - nd.oy) * sp;
      }
    }

    function makeNodes(){
      var count = Math.min(170, Math.max(90, Math.floor(w * h / 9500)));
      nodes = [];
      for(var i = 0; i < count; i++){
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
          r: Math.random() * 1.6 + .8,
          z: .5 + Math.random() * .9,
          ox: 0, oy: 0
        });
      }
    }

    function geo(){
      var mob = w < 900;
      return {
        mob: mob,
        bw: mob ? Math.min(w * .74, 520) : Math.min(w * (w < 1200 ? .46 : .52), 780),
        bh: mob ? Math.min(h * .34, 360) : Math.min(h * .58, 520),
        cx: mob ? w * .5   : w * (w < 1200 ? .36 : .39),
        cy: mob ? h * .29  : h * .51
      };
    }

    function resize(){
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeNodes();
      if(net && phase !== PH.HERO){ layoutGeo(); placeNetCopy(); }
      buildLogoDots();
    }

    function buildNet(){
      var g = geo();
      var layers = layersForLogo();          /* ← čvorova = tačaka loga */
      var colX = [], i, j;
      for(i = 0; i < layers.length; i++) colX.push(g.cx - g.bw/2 + g.bw * i / (layers.length - 1));

      var used = {}, list = [];
      for(i = 0; i < layers.length; i++){
        var n = layers[i];
        for(j = 0; j < n; j++){
          var ay = g.cy - g.bh/2 + g.bh * (j + .5) / n + (Math.random() - .5) * (g.bh / n) * .5;
          ay = Math.max(g.cy - g.bh/2 + 10, Math.min(g.cy + g.bh/2 - 10, ay));
          var ax = colX[i] + (Math.random() - .5) * g.bw * .012;
          var best = -1, bd = Infinity;
          for(var k = 0; k < nodes.length; k++){
            if(used[k]) continue;
            var ddx = nodes[k].x - ax, ddy = nodes[k].y - ay, dd = ddx*ddx + ddy*ddy;
            if(dd < bd){ bd = dd; best = k; }
          }
          var sx = ax, sy = ay;
          if(best >= 0){ used[best] = 1; sx = nodes[best].x; sy = nodes[best].y; }
          list.push({i:i, j:j, lx:ax, ly:ay, sx:sx, sy:sy,
            size: (g.mob ? 2 : 2.3) + Math.random() * 1.6,
            col: pickColor(),
            ph: Math.random() * 6.283, sp: .0005 + Math.random() * .0009,
            ox: 0, oy: 0, vp: null, label: null});
        }
      }

      var off = [], acc = 0;
      for(i = 0; i < layers.length; i++){ off.push(acc); acc += layers[i]; }
      var edges = [], readyMax = 0;
      for(i = 0; i < layers.length - 1; i++){
        for(var a = 0; a < layers[i]; a++){
          for(var b = 0; b < layers[i + 1]; b++){
            var delay = 60 + i * 40 + Math.random() * 70;
            var dur = 170 + Math.random() * 80;
            readyMax = Math.max(readyMax, delay + dur);
            edges.push({
              a: off[i] + a, b: off[i + 1] + b, layer: i,
              col: pickColor(),
              alpha: .08 + Math.random() * .24,
              wgt: .7 + Math.random() * .8,
              tw: Math.random() < .16,
              twP: Math.random() * 6.283,
              delay: delay, dur: dur
            });
          }
        }
      }

      if(!g.mob){
        var inN = Math.min(layers[0], IN_LB.length);
        for(var q = 0; q < inN; q++) list[q].label = {t: IN_LB[q], side: -1};
        var lastOff = off[layers.length - 1];
        var outN = Math.min(layers[layers.length - 1], OUT_LB.length);
        for(q = 0; q < outN; q++) list[lastOff + q].label = {t: OUT_LB[q], side: 1};
      }

      nodes = nodes.filter(function(s, i2){ return !used[i2]; });
      net = {layers:layers, colX:colX, cx:g.cx, cy:g.cy, bw:g.bw, bh:g.bh, mob:g.mob,
        nodes:list, edges:edges, ready: readyMax + 40,
        wave:0, nextWave:0, parts:[], nextPart:0};

      buildLogoDots();
    }

    function layoutGeo(){
      var g = geo();
      var layers = net.layers;
      net.bw = g.bw; net.bh = g.bh; net.cx = g.cx; net.cy = g.cy; net.mob = g.mob;
      net.colX = [];
      for(var i = 0; i < layers.length; i++) net.colX.push(g.cx - g.bw/2 + g.bw * i / (layers.length - 1));
      net.nodes.forEach(function(nd){
        var n = layers[nd.i];
        nd.lx = net.colX[nd.i];
        nd.ly = g.cy - g.bh/2 + g.bh * (nd.j + .5) / n;
      });
    }

    function placeNetCopy(){
      if(!netCopy) return;
      var hTop = heroEl ? heroEl.offsetTop : 0;
      if(w < 900){
        var gm = geo();
        netCopy.style.top = Math.round(gm.cy + gm.bh / 2 + 16 - hTop) + "px";
        netCopy.style.left = "";
        netCopy.style.width = "";
        netCopy.style.right = "auto";
        return;
      }
      var g = geo();
      var netRight = g.cx + g.bw / 2;
      var padR = 56;
      var gap = w - padR - netRight;
      var tw = Math.min(520, w * .34);
      if(gap >= tw + 20){
        netCopy.style.width = tw + "px";
        netCopy.style.left = Math.round(netRight + (gap - tw) / 2) + "px";
      } else {
        netCopy.style.width = Math.max(200, gap - 24) + "px";
        netCopy.style.left = Math.round(netRight + 18) + "px";
      }
      netCopy.style.top = Math.round(g.cy - hTop) + "px";
      netCopy.style.right = "auto";
    }

    function nodePos(nd, now, eq){
      var tx = nd.lx + Math.sin(now * nd.sp + nd.ph) * 2.4 + nd.ox;
      var ty = nd.ly + Math.cos(now * nd.sp * .9 + nd.ph * 1.7) * 2.4 + nd.oy;
      if(eq < 1) return {x: nd.sx + (tx - nd.sx) * eq, y: nd.sy + (ty - nd.sy) * eq};
      return {x: tx, y: ty};
    }
    function waveE(layer, now){
      if(!net || !net.wave) return 0;
      var p = (now - net.wave - layer * 170) / 360;
      if(p <= 0 || p >= 1) return 0;
      return Math.sin(p * Math.PI);
    }

    function ambient(lineA, dotA){
      var i, j, a, b, dx2, dy2, d;
      for(i = 0; i < nodes.length; i++){
        a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if(a.x < -10) a.x = w + 10; else if(a.x > w + 10) a.x = -10;
        if(a.y < -10) a.y = h + 10; else if(a.y > h + 10) a.y = -10;
      }
      if(lineA > .004 && nodes.length > 1){
        var maxD = 140;
        ctx.lineWidth = 1; ctx.strokeStyle = "#fff";
        for(i = 0; i < nodes.length; i++){
          for(j = i + 1; j < nodes.length; j++){
            a = nodes[i]; b = nodes[j];
            var ax = a.x + a.ox, ay = a.y + a.oy;
            var bx = b.x + b.ox, by = b.y + b.oy;
            dx2 = ax - bx; dy2 = ay - by;
            d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if(d < maxD){
              ctx.globalAlpha = (1 - d / maxD) * lineA;
              ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
            }
          }
        }
      }
      if(dotA > .004){
        ctx.fillStyle = "#fff";
        for(i = 0; i < nodes.length; i++){
          a = nodes[i];
          ctx.globalAlpha = dotA * (.45 + .55 * a.z);
          ctx.beginPath(); ctx.arc(a.x + a.ox, a.y + a.oy, a.r * .9, 0, 6.283); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    /* ---------- mreža + logo u jednom prolazu ---------- */
    function drawNet(now, aMul, rise){
      ctx.save();
      ctx.translate(0, -rise);
      var t = now - ft0;
      var eq = 1 - Math.pow(1 - Math.min(t / 320, 1), 3);
      var me = morph > 0 ? 1 - Math.pow(1 - morph, 3) : 0;
      var i, e;

      /* pozicije svih čvorova — jednom po frejmu;
         tokom morfa svaki ide na SVOJU tačku loga */
      var pos = [];
      for(i = 0; i < net.nodes.length; i++){
        var nd = net.nodes[i];
        var p = nodePos(nd, now, eq);
        if(me > 0 && nd.vp){
          p.x += (nd.vp.x - p.x) * me;
          p.y += (nd.vp.y - p.y) * me;
        }
        pos.push(p);
      }

      /* mrežne grane — gase se tokom morfa */
      ctx.lineCap = "round";
      for(i = 0; i < net.edges.length; i++){
        e = net.edges[i];
        var pr = (t - e.delay) / e.dur;
        if(pr <= 0) continue;
        if(pr > 1) pr = 1;
        var pe = 1 - Math.pow(1 - pr, 2);
        var pA = pos[e.a], pB = pos[e.b];
        var al = e.alpha * aMul * (1 - me);
        if(e.tw) al *= .6 + .4 * Math.sin(now * .0025 + e.twP);
        al *= 1 + waveE(e.layer, now) * 1.4;
        if(al <= .005) continue;
        var hx = pA.x + (pB.x - pA.x) * pe, hy = pA.y + (pB.y - pA.y) * pe;
        ctx.globalAlpha = Math.max(0, Math.min(al, 1));
        ctx.strokeStyle = "rgb(" + e.col + ")";
        ctx.lineWidth = e.wgt;
        ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(hx, hy); ctx.stroke();
      }

      /* čvorovi — vide se i u mreži i kao tačke loga */
      for(i = 0; i < net.nodes.length; i++){
        var nd2 = net.nodes[i];
        var p2 = pos[i];
        var we = waveE(nd2.i, now);
        var s = nd2.size * (1 + we * .55) * (1 - me * .5);
        ctx.globalAlpha = Math.min(1, eq) * Math.max(aMul, me * .95);
        ctx.shadowColor = "rgb(" + nd2.col + ")";
        ctx.shadowBlur = (5 + we * 15) * (1 - me * .7);
        ctx.fillStyle = "rgb(" + nd2.col + ")";
        ctx.fillRect(p2.x - s, p2.y - s, s * 2, s * 2);
        ctx.shadowBlur = 0;
      }

      /* labele slojeva — gase se tokom morfa */
      var labA = Math.max(0, Math.min((t - 320) / 250, 1)) * aMul * (1 - me);
      if(labA > .01){
        ctx.font = (net.mob ? "600 9px " : "500 10px ") + "'IBM Plex Mono',monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "rgba(255,255,255," + (.38 * labA).toFixed(3) + ")";
        for(i = 0; i < net.layers.length; i++){
          var lbx = Math.max(40, Math.min(w - 40, net.colX[i]));
          ctx.fillText(TOP_LB[i] || ("s" + i), lbx, net.cy - net.bh/2 - 14);
        }
        if(!net.mob){
          var showIn  = net.colX[0] > 165;
          var showOut = (w - net.colX[net.colX.length - 1]) > 145;
          ctx.textBaseline = "middle";
          for(i = 0; i < net.nodes.length; i++){
            var nd3 = net.nodes[i];
            if(!nd3.label) continue;
            if(nd3.label.side < 0 && !showIn) continue;
            if(nd3.label.side > 0 && !showOut) continue;
            var p3 = pos[i];
            ctx.textAlign = nd3.label.side < 0 ? "right" : "left";
            ctx.fillStyle = "rgba(255,255,255," + (.5 * labA).toFixed(3) + ")";
            ctx.fillText(nd3.label.t, p3.x + nd3.label.side * 10, p3.y);
          }
        }
      }

      /* mrežni pulsi — samo dok je mreža "mreža" */
      if((phase === PH.NET || phase === PH.DONE) && me < .6){
        if(now > net.nextWave){
          net.wave = now;
          net.nextWave = now + 1700 + Math.random() * 1300;
        }
        if(now > net.nextPart && net.parts.length < 9){
          net.parts.push({e:(Math.random() * net.edges.length) | 0, t0: now, dur: 520 + Math.random() * 380});
          net.nextPart = now + 170 + Math.random() * 260;
        }
        for(i = net.parts.length - 1; i >= 0; i--){
          var pt = net.parts[i], pp = (now - pt.t0) / pt.dur;
          if(pp >= 1){ net.parts.splice(i, 1); continue; }
          var ee = net.edges[pt.e];
          var P1 = pos[ee.a], P2 = pos[ee.b];
          var px = P1.x + (P2.x - P1.x) * pp, py = P1.y + (P2.y - P1.y) * pp;
          ctx.globalAlpha = aMul * (pp < .15 ? pp / .15 : 1) * (1 - me);
          ctx.fillStyle = "rgb(" + ee.col + ")";
          ctx.shadowColor = "rgb(" + ee.col + ")";
          ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(px, py, 1.8, 0, 6.283); ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      /* ============ LOGO SLOJ — između ISTIH čvorova ============ */
      if(logoOK && me > .02){
       

        /* linije loga niču redom duž svake nacrtane linije,
           između čvorova koji upravo slijeću na tvoje tačke;
           3 paralelne linije = debljina znaka */
        var off = logoBox.LH * .016;
        for(i = 0; i < logoEdges.length; i++){
          var LE = logoEdges[i];
          var na = net.nodes[LE.va], nb = net.nodes[LE.vb];
          if(!na || !nb || !na.vp || !nb.vp) continue;
          var A = pos[LE.va], B = pos[LE.vb];
          var lp = (me - .3 - LE.ord * .006) / .4;
          if(lp <= 0) continue;
          if(lp > 1) lp = 1;
          lp = 1 - Math.pow(1 - lp, 2);
          var dx = B.x - A.x, dy = B.y - A.y;
          var dl = Math.sqrt(dx * dx + dy * dy) || 1;
          var nx = -dy / dl, ny = dx / dl;
          var ex = A.x + dx * lp, ey = A.y + dy * lp;
          var col = na.col;
          ctx.strokeStyle = "rgb(" + col + ")";
          ctx.globalAlpha = .6 * me;
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(ex, ey); ctx.stroke();
          ctx.globalAlpha = .3 * me;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(A.x + nx * off, A.y + ny * off); ctx.lineTo(ex + nx * off, ey + ny * off);
          ctx.moveTo(A.x - nx * off, A.y - ny * off); ctx.lineTo(ex - nx * off, ey - ny * off);
          ctx.stroke();
        }

        /* čestice teku duž linija loga */
        if(me > .92){
          if(now > logoNextPart && logoParts.length < 12){
            logoParts.push({e:(Math.random() * logoEdges.length) | 0,
              t0: now, dur: 650 + Math.random() * 450, rev: Math.random() < .5});
            logoNextPart = now + 160 + Math.random() * 220;
          }
          for(i = logoParts.length - 1; i >= 0; i--){
            var LP = logoParts[i], lpp = (now - LP.t0) / LP.dur;
            if(lpp >= 1){ logoParts.splice(i, 1); continue; }
            var LE2 = logoEdges[LP.e];
            var na2 = net.nodes[LE2.va], nb2 = net.nodes[LE2.vb];
            if(!na2 || !nb2 || !na2.vp || !nb2.vp){ logoParts.splice(i, 1); continue; }
            var A2 = pos[LE2.va], B2 = pos[LE2.vb];
            var tt = LP.rev ? 1 - lpp : lpp;
            var t2 = Math.max(0, tt - .1);
            var qx = A2.x + (B2.x - A2.x) * t2, qy = A2.y + (B2.y - A2.y) * t2;
            var px2 = A2.x + (B2.x - A2.x) * tt, py2 = A2.y + (B2.y - A2.y) * tt;
            ctx.globalAlpha = (lpp < .2 ? lpp / .2 : 1) * me;
            var pg = ctx.createLinearGradient(qx, qy, px2, py2);
            pg.addColorStop(0, "rgba(" + na2.col + ",0)");
            pg.addColorStop(1, "rgba(" + na2.col + ",.9)");
            ctx.strokeStyle = pg; ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px2, py2); ctx.stroke();
            ctx.fillStyle = "rgb(" + na2.col + ")";
            ctx.shadowColor = "rgb(" + na2.col + ")"; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(px2, py2, 1.9, 0, 6.283); ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function unlockNow(){
      if(unlocked) return;
      unlocked = true;
      phase = PH.DONE;
      document.documentElement.classList.remove("net-lock");
    }
    function startTransform(){
      if(phase !== PH.HERO) return;
      phase = PH.TRANSFORM;
      ft0 = performance.now();
      Type.finish(heroH1); Type.finish(heroSub);
      heroInner.classList.add("hero-hide");
      buildNet();
      placeNetCopy();
      netCopy.classList.add("on");
      if(netTitle) Type.play(netTitle, 6, 120);
    }
    function skipToEnd(){
      Type.finish(heroH1); Type.finish(heroSub); Type.finish(netTitle);
      heroTyped = true; warpQueued = false; touchUsed = false;
      if(!net){
        buildNet();
        placeNetCopy();
        ft0 = performance.now() - 5000;
        net.nextWave = performance.now() + 300;
        net.nextPart = performance.now() + 500;
      }
      netCopy.classList.add("on");
      heroInner.classList.add("hero-hide");
      document.body.classList.add("hero-in");
      unlockNow();
    }
    function userNext(){
      if(phase === PH.HERO){
        if(!heroTyped){ warpQueued = true; return; }
        startTransform();
      } else if(phase === PH.NET){
        if(performance.now() - netAt > 350) unlockNow();
      }
    }
    function whenFonts(cb){
      var fired = false;
      function go(){ if(fired) return; fired = true; cb(); }
      if(document.fonts && document.fonts.ready && document.fonts.ready.then){
        document.fonts.ready.then(go);
      }
      setTimeout(go, 1200);
    }

    function step(now){
      if(t0 === null) t0 = now;
      ctx.clearRect(0, 0, w, h);

      var scrollYv = window.scrollY || window.pageYOffset || 0;
      var vh = window.innerHeight || 800;
      morph = unlocked ? Math.min(scrollYv / (vh * .25), 1) : 0;
      var fd = unlocked ? Math.max(0, Math.min((scrollYv - vh * 1.5) / (vh * .6), 1)) : 0;
      if(fd !== fadeAll){
        fadeAll = fd;
        canvas.style.opacity = String(1 - fadeAll);
      }
      if(netCopy){
        if(morph > .04 && !netCopyGone){
          netCopyGone = true;
          netCopy.classList.remove("on"); netCopy.classList.add("out");
        } else if(morph === 0 && netCopyGone && phase === PH.DONE){
          netCopyGone = false;
          netCopy.classList.remove("out"); netCopy.classList.add("on");
        }
      }

      if(fadeAll >= 1){ raf = requestAnimationFrame(step); return; }

      updateStarForce();
      if(net) updateNetForce();

      var i, a, t;

      if(phase === PH.HERO){
        t = now - t0;
        if(t < WARP_MS){
          var p = Math.min(t / WARP_MS, 1);
          var ws = 86 * Math.pow(1 - p, 1.8);
          var trail = Math.min(160, ws * 5), m = trail + 14;
          for(i = 0; i < nodes.length; i++){
            a = nodes[i];
            a.y += ws * a.z + a.vy;
            a.x += a.vx;
            if(a.y > h + m){ a.y = -m - Math.random() * 80; a.x = Math.random() * w; }
            else if(a.y < -m - 80){ a.y = h + m; }
            if(a.x < -m) a.x = w + m - 1; else if(a.x > w + m) a.x = -m + 1;
          }
          ctx.lineCap = "round";
          for(i = 0; i < nodes.length; i++){
            a = nodes[i];
            if(trail > 2){
              var tl = trail * a.z;
              var g = ctx.createLinearGradient(a.x, a.y - tl, a.x, a.y);
              g.addColorStop(0, "rgba(255,255,255,0)");
              g.addColorStop(1, "rgba(255,255,255,.85)");
              ctx.globalAlpha = 1; ctx.strokeStyle = g;
              ctx.lineWidth = Math.min(a.r * 1.6, 2.4);
              ctx.beginPath(); ctx.moveTo(a.x, a.y - tl); ctx.lineTo(a.x, a.y); ctx.stroke();
            }
            ctx.globalAlpha = .85; ctx.fillStyle = "#fff";
            ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
          }
          ctx.globalAlpha = 1;
        } else {
          if(!heroTyped){
            heroTyped = true;
            document.body.classList.add("hero-in");
            if(phase === PH.HERO){
              if(warpQueued){ warpQueued = false; startTransform(); }
              else {
                whenFonts(function(){
                  Type.play(heroH1, 16, 100);
                  Type.play(heroSub, 8, 150);
                });
              }
            }
          }
          if(phase === PH.HERO) ambient(.26, .8);
        }
      }
      else if(phase === PH.TRANSFORM){
        var tt = now - ft0;
        ambient(.26 * (1 - Math.min(tt / 500, 1)), .8 * (1 - Math.min(tt / 700, 1) * .5));
        if(net) drawNet(now, 1, 0);
        if(net && tt >= net.ready){
          phase = PH.NET; netAt = now;
          net.nextWave = now + 450;
          net.nextPart = now + 750;
        }
      }
      else {
        /* NET i DONE — mreža živi; skrol je pretvara u logo */
        var mAl = 1 - morph;
        ambient(.06 * mAl, .38 * mAl);
        if(net) drawNet(now, mAl, 0);
      }

      raf = requestAnimationFrame(step);
    }

    if("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.documentElement.classList.add("net-lock");

    window.addEventListener("wheel", function(){
      if(unlocked) return;
      userNext();
    }, {passive:true});

    function inNetArea(x, y){
      if(!net) return false;
      var r = canvas.getBoundingClientRect();
      var px = x - r.left, py = y - r.top;
      return px > net.cx - net.bw/2 - 34 && px < net.cx + net.bw/2 + 34 &&
             py > net.cy - net.bh/2 - 46 && py < net.cy + net.bh/2 + 46;
    }
    window.addEventListener("touchmove", function(e){
      if(document.body.classList.contains("menu-open")) return;
      if(unlocked){
        if(tInNet && net) e.preventDefault();
        return;
      }
      e.preventDefault();
      if(phase === PH.HERO || phase === PH.NET){
        if(!touchUsed){ touchUsed = true; userNext(); }
      }
    }, {passive:false});
    window.addEventListener("touchend", function(){ touchUsed = false; tInNet = false; }, {passive:true});
    window.addEventListener("touchcancel", function(){ touchUsed = false; tInNet = false; }, {passive:true});

    window.addEventListener("keydown", function(e){
      if(unlocked) return;
      if(e.repeat) return;
      var k = e.key;
      if(k === "ArrowDown" || k === "PageDown" || k === " " || k === "Spacebar"){
        e.preventDefault();
        userNext();
      }
    });

    document.addEventListener("click", function(e){
      if(phase === PH.DONE && unlocked) return;
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if(!a) return;
      var href = a.getAttribute("href");
      if(!href || href === "#") return;
      e.preventDefault();
      e.stopPropagation();
      if(mnav.contains(a)) setMenu(false);
      skipToEnd();
      var target = document.querySelector(href);
      if(target) target.scrollIntoView({behavior: "smooth"});
    }, true);

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(step);
  }
})();
