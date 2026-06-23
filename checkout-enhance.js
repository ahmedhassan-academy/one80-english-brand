/* One80 English — Checkout enhancer (CartFlows modern-skin version)
   Adds the approved mockup's conversion elements onto the NEW checkout page only.
   Loaded via per-page footer code on /checkout-one80/ — the live /checkout/ never sees it.
   URL-gated + body-class-scoped as belt-and-braces so it can NEVER touch the old checkout.
   Idempotent + re-applies after WooCommerce AJAX (updated_checkout).                       */
(function () {
  "use strict";

  /* hard gate: only ever run on the new page */
  if (!/\/checkout-one80(\/|$)/.test(location.pathname)) return;
  if (window.__one80co) return;
  window.__one80co = true;

  /* ---------- styles ---------- */
  function injectCSS() {
    if (document.getElementById("one80co-css")) return;
    var f = document.createElement("link");
    f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Inter:wght@500;600;700&display=swap";
    document.head.appendChild(f);
    var ti = document.createElement("link");
    ti.rel = "stylesheet";
    ti.href = "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.7.0/dist/tabler-icons.min.css";
    document.head.appendChild(ti);
    var s = document.createElement("style");
    s.id = "one80co-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------- 1) offer bar + step indicator at top of the form ---------- */
  function buildChrome() {
    var host = document.getElementById("wcf-embed-checkout-form");
    if (!host || host.querySelector(".one80-chrome")) return;
    var wrap = document.createElement("div");
    wrap.className = "one80-chrome";
    wrap.dir = "rtl";
    wrap.innerHTML =
      '<div class="o-offer"><i class="ti ti-clock"></i> ينتهي عرض اليوم خلال <span id="o-cd" style="font-family:Inter">--:--:--</span></div>' +
      '<div class="o-steps">' +
        '<span class="o-s on"><span class="o-dot">1</span> بياناتك</span><span class="o-ln"></span>' +
        '<span class="o-s on"><span class="o-dot">2</span> الدفع</span><span class="o-ln"></span>' +
        '<span class="o-s"><span class="o-dot">3</span> تأكيد</span>' +
      '</div>';
    host.insertBefore(wrap, host.firstChild);
    startCountdown();
  }
  function startCountdown() {
    var el = document.getElementById("o-cd");
    if (!el || el.dataset.on) return;
    el.dataset.on = "1";
    function tick() {
      var now = new Date();
      var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      var t = Math.max(0, Math.floor((end - now) / 1000));
      var p = function (x) { return String(x).padStart(2, "0"); };
      el.textContent = p(Math.floor(t / 3600)) + ":" + p(Math.floor((t % 3600) / 60)) + ":" + p(t % 60);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- 2) guest note + city optional ---------- */
  function tuneFields() {
    var left = document.querySelector(".wcf-col2-set") || document.querySelector("#customer_details");
    if (left && !left.querySelector(".o-guest")) {
      var g = document.createElement("div");
      g.className = "o-guest";
      g.innerHTML = '<i class="ti ti-user-check"></i> هتكمل كزائر — من غير ما تعمل حساب';
      var anchor = document.getElementById("billing_first_name_field");
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(g, anchor.nextSibling);
      else left.insertBefore(g, left.firstChild);
    }
    // default Egypt
    var c = document.getElementById("billing_country");
    if (c && c.value !== "EG" && c.querySelector('option[value="EG"]')) {
      c.value = "EG";
      if (window.jQuery) jQuery(c).trigger("change");
    }
    // payment reassurance under the local (COD) method
    var cod = document.querySelector(".payment_method_cod > label");
    if (cod && !cod.parentNode.querySelector(".o-paysub")) {
      var sub = document.createElement("div");
      sub.className = "o-paysub";
      sub.textContent = "هنبعتلك التفاصيل ونأكد طلبك فورًا على واتساب";
      cod.parentNode.insertBefore(sub, cod.nextSibling);
    }
  }

  /* ---------- helpers ---------- */
  function money(s) {
    var n = (s || "").replace(/[^\d.,]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
    return parseFloat(n) || 0;
  }
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }

  /* ---------- 3) order summary extras ---------- */
  function enhanceReview(cart) {
    var wrap = document.querySelector(".wcf-order-wrap");
    if (!wrap) return;

    var totalEl = document.querySelector(".order-total .woocommerce-Price-amount, .order-total td");
    var total = totalEl ? money(totalEl.textContent) : 0;

    // months from product name -> days
    var days = 180;
    var nameEl = document.querySelector(".cart_item .product-name, td.product-name");
    if (nameEl) {
      var mm = nameEl.textContent.match(/(\d+)\s*(?:شهر|شهور|month)/i);
      if (mm) days = (parseInt(mm[1], 10) || 6) * 30;
    }

    // honest discount from real regular vs sale price
    var reg = 0, sale = 0;
    if (cart && cart.items && cart.items.length) {
      cart.items.forEach(function (it) { reg += it.reg * it.qty; sale += it.sale * it.qty; });
    }
    var hasDiscount = reg > 0 && sale > 0 && reg > sale;

    var anchor = document.querySelector(".woocommerce-checkout-review-order") || wrap;

    // discount + per-day block
    if (!wrap.querySelector(".o-extras1")) {
      var box = document.createElement("div");
      box.className = "o-extras1";
      var html = "";
      if (hasDiscount) {
        html +=
          '<div class="o-sline"><span>السعر الأصلي</span><span class="o-strike">' + fmt(reg) + ' ج</span></div>' +
          '<div class="o-sline"><span>الخصم</span><span class="o-disc">− ' + fmt(reg - sale) + ' ج</span></div>';
      }
      var perday = total && days ? Math.round(total / days) : 0;
      if (perday) {
        html += '<div class="o-perday"><span class="l">يعني تقريبًا</span><span class="v">≈ ' + fmt(perday) + ' ج / اليوم</span></div>';
      }
      html += '<div class="o-incl"><i class="ti ti-circle-check"></i> السعر شامل · بدون رسوم إضافية</div>';
      box.innerHTML = html;
      anchor.appendChild(box);
    }

    // review + trust block (before place order)
    var po = document.querySelector(".place-order");
    if (po && !document.querySelector(".o-extra2")) {
      var ex = document.createElement("div");
      ex.className = "o-extra2";
      ex.innerHTML =
        '<div class="o-trust"><span><i class="ti ti-lock"></i> دفع آمن</span><span><i class="ti ti-shield-check"></i> ضمان استرجاع</span><span><i class="ti ti-bolt"></i> تأكيد فوري</span></div>' +
        '<div class="o-rev"><div class="o-stars">★★★★★ <span class="o-score">٤.٨ / ٥</span></div>' +
        '<p>"كنت بتخض أتكلم، دلوقتي بتكلم في الشغل بالإنجليزي عادي."</p>' +
        '<div class="o-who">— مريم · من آلاف الطلاب اللي بدأوا الرحلة</div></div>';
      po.parentNode.insertBefore(ex, po);
    }

    // guarantee after place order
    if (po && !po.parentNode.querySelector(".o-guar")) {
      var gu = document.createElement("div");
      gu.className = "o-guar";
      gu.innerHTML = '<i class="ti ti-rosette-discount-check"></i> ضمان استرجاع كامل خلال 7 أيام — من غير أسئلة';
      po.parentNode.insertBefore(gu, po.nextSibling);
    }

    // CTA text
    var btn = document.getElementById("place_order");
    if (btn && total) btn.value = "إتمام الطلب · " + fmt(total) + " ج";
  }

  /* ---------- run ---------- */
  var cartData = null;
  async function loadCart() {
    if (cartData) return cartData;
    try {
      var r = await fetch("/wp-json/wc/store/v1/cart", { headers: { Accept: "application/json" }, credentials: "same-origin" });
      var c = await r.json();
      var u = c.totals.currency_minor_unit, d = function (v) { return Number(v) / Math.pow(10, u); };
      cartData = { items: c.items.map(function (i) { return { reg: d(i.prices.regular_price), sale: d(i.prices.sale_price || i.prices.price), qty: i.quantity }; }) };
    } catch (e) { cartData = { items: [] }; }
    return cartData;
  }

  async function apply() {
    document.body.classList.add("one80-co-page");
    injectCSS();
    if (!document.querySelector("form.checkout")) return;
    buildChrome();
    tuneFields();
    var cart = await loadCart();
    enhanceReview(cart);
  }

  if (document.readyState !== "loading") apply();
  else document.addEventListener("DOMContentLoaded", apply);
  if (window.jQuery) {
    jQuery(document.body).on("updated_checkout", function () { setTimeout(apply, 40); });
  }

  /* ---------- CSS (scoped to body.one80-co-page) ---------- */
  var CSS = [
    ".one80-co-page{--navy:#1A2F6E;--red:#E31B23;--green:#0F8A5F;--ink:#1b2440;--muted:#737a90;--line:#e7eaf3;--soft:#f4f7fd}",
    /* offer + steps */
    ".one80-co-page .one80-chrome{font-family:'Cairo',system-ui,Arial,sans-serif}",
    ".one80-co-page .o-offer{display:flex;align-items:center;justify-content:center;gap:8px;background:#fff4ec;color:#b5430f;font-size:13.5px;font-weight:700;padding:10px;border-radius:12px;margin-bottom:10px}",
    ".one80-co-page .o-steps{display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 0 16px;font-size:13px;color:var(--muted);flex-wrap:wrap}",
    ".one80-co-page .o-s{display:inline-flex;align-items:center;gap:7px}",
    ".one80-co-page .o-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 12px Inter;background:#e9edf8;color:var(--muted)}",
    ".one80-co-page .o-s.on .o-dot{background:var(--navy);color:#fff}.one80-co-page .o-s.on{color:var(--navy);font-weight:700}",
    ".one80-co-page .o-ln{width:26px;height:2px;background:var(--line)}",
    /* guest note */
    ".one80-co-page .o-guest{display:flex;align-items:center;gap:8px;background:#eafaf2;border:1px solid #cdeede;color:#0c7a52;font-size:13px;font-weight:600;border-radius:11px;padding:11px 13px;margin:0 0 14px}",
    /* summary extras */
    ".one80-co-page .o-extras1{margin-top:8px}",
    ".one80-co-page .o-sline{display:flex;justify-content:space-between;font-size:13.5px;margin-top:8px;color:var(--muted)}",
    ".one80-co-page .o-strike{text-decoration:line-through;color:#aab}",
    ".one80-co-page .o-disc{color:var(--green);font-weight:700}",
    ".one80-co-page .o-perday{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid var(--line);border-radius:11px;padding:9px 12px;margin-top:12px}",
    ".one80-co-page .o-perday .l{font-size:12.5px;color:var(--muted)}",
    ".one80-co-page .o-perday .v{font-weight:800;color:var(--navy);font-size:15px}",
    ".one80-co-page .o-incl{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);font-weight:600;margin-top:10px}",
    ".one80-co-page .o-incl i{color:var(--green)}",
    /* trust / review / guarantee */
    ".one80-co-page .o-extra2{margin-top:14px}",
    ".one80-co-page .o-trust{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:12px;font-weight:600}",
    ".one80-co-page .o-trust i{color:var(--navy)}",
    ".one80-co-page .o-rev{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:12px}",
    ".one80-co-page .o-stars{color:#f5a623;font-size:14px;letter-spacing:1px}",
    ".one80-co-page .o-score{color:#1b2440;font-size:12.5px;font-weight:700}",
    ".one80-co-page .o-rev p{font-size:12.5px;color:#444;margin:7px 0 0;line-height:1.6}",
    ".one80-co-page .o-who{font-size:11.5px;color:var(--muted);margin-top:6px}",
    ".one80-co-page .o-guar{display:flex;align-items:center;justify-content:center;gap:7px;font-size:12.5px;color:var(--green);font-weight:600;margin-top:12px}",
    /* payment reassurance */
    ".one80-co-page .o-paysub{font-size:12px;color:var(--muted);margin-top:4px}",
    /* CTA */
    ".one80-co-page #place_order{background:var(--red)!important;border-color:var(--red)!important;color:#fff!important;font-size:17px!important;font-weight:800!important;border-radius:13px!important;padding:16px!important;box-shadow:0 12px 26px rgba(227,27,35,.32)!important;width:100%}",
    ".one80-co-page #place_order:hover{background:#c8161d!important}",
    ".one80-co-page i.ti{vertical-align:-2px}"
  ].join("\n");
})();
