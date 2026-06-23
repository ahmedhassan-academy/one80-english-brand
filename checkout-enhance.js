/* One80 English — Checkout enhancer
   Transforms a standard [woocommerce_checkout] into the approved mockup design.
   Loaded ONLY on the new /checkout-one80/ page. Never touches the live /checkout/.
   Idempotent + re-applies after WooCommerce AJAX (updated_checkout).            */
(function () {
  "use strict";
  if (window.__one80co) return;
  window.__one80co = true;

  var BRAND = {
    navy: "#1A2F6E", red: "#E31B23", green: "#0F8A5F", ink: "#1b2440",
    muted: "#737a90", line: "#e7eaf3", soft: "#f4f7fd", bg: "#eceff7"
  };

  /* ---------- 1) inject fonts + styles ---------- */
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

  /* ---------- 2) header / offer / steps above the form ---------- */
  function buildChrome(root) {
    if (root.querySelector(".one80-chrome")) return;
    var wrap = document.createElement("div");
    wrap.className = "one80-chrome";
    wrap.dir = "rtl";
    wrap.innerHTML =
      '<div class="o-head">' +
        '<div class="o-brand">' +
          '<svg viewBox="0 0 200 130" width="46" aria-hidden="true"><path d="M24 96 A54 54 0 0 1 132 96" fill="none" stroke="#1A2F6E" stroke-width="8" stroke-linecap="round"/><path d="M37 96 A41 41 0 0 1 119 96" fill="none" stroke="#E31B23" stroke-width="7" stroke-linecap="round"/><line x1="78" y1="96" x2="124" y2="98" stroke="#1A2F6E" stroke-width="6" stroke-linecap="round"/><circle cx="78" cy="96" r="8" fill="#E31B23"/></svg>' +
          '<b><span style="color:#1A2F6E">One</span><span style="color:#E31B23">80</span></b>' +
        '</div>' +
        '<span class="o-secure"><i class="ti ti-lock"></i> دفع آمن ومشفّر SSL</span>' +
      '</div>' +
      '<div class="o-card-top">' +
        '<div class="o-offer"><i class="ti ti-clock"></i> ينتهي عرض اليوم خلال <span id="o-cd" style="font-family:Inter">--:--:--</span></div>' +
        '<div class="o-steps">' +
          '<span class="o-s on"><span class="o-dot">1</span> بياناتك</span><span class="o-ln"></span>' +
          '<span class="o-s on"><span class="o-dot">2</span> الدفع</span><span class="o-ln"></span>' +
          '<span class="o-s"><span class="o-dot">3</span> تأكيد</span>' +
        '</div>' +
      '</div>';
    root.insertBefore(wrap, root.firstChild);
    startCountdown();
  }

  /* honest countdown: counts down to local midnight, resets daily */
  function startCountdown() {
    var el = document.getElementById("o-cd");
    if (!el) return;
    function tick() {
      var now = new Date();
      var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      var t = Math.max(0, Math.floor((end - now) / 1000));
      var h = String(Math.floor(t / 3600)).padStart(2, "0");
      var m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
      var s = String(t % 60).padStart(2, "0");
      el.textContent = h + ":" + m + ":" + s;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- 3) field labels + trim ---------- */
  var LABELS = {
    billing_email: "البريد الإلكتروني",
    billing_first_name: "الاسم بالكامل",
    billing_country: "الدولة",
    billing_city: "المدينة",
    billing_phone: "رقم الهاتف",
    billing_postcode: "رقم واتساب"
  };
  // fields we hide and auto-fill so the form stays short but still submits
  var AUTOFILL = {
    billing_last_name: ".",
    billing_address_1: "—",
    billing_address_2: ""
  };
  var HIDE = ["billing_company", "billing_address_2", "billing_state"];

  function tuneFields() {
    Object.keys(LABELS).forEach(function (id) {
      var f = document.getElementById(id + "_field");
      if (!f) return;
      var lab = f.querySelector("label");
      if (lab) {
        var req = lab.querySelector(".required, .optional");
        lab.childNodes.forEach && lab.childNodes.forEach(function (n) {
          if (n.nodeType === 3) n.textContent = "";
        });
        lab.insertBefore(document.createTextNode(LABELS[id] + " "), lab.firstChild);
        if (id === "billing_city" && req) req.outerHTML = '<span class="o-opt">(اختياري)</span>';
      }
    });

    // auto-fill + hide required-but-unwanted fields
    Object.keys(AUTOFILL).forEach(function (id) {
      var inp = document.getElementById(id);
      if (inp && !inp.value) { inp.value = AUTOFILL[id]; }
      var f = document.getElementById(id + "_field");
      if (f) f.classList.add("o-hidden");
    });
    HIDE.forEach(function (id) {
      var f = document.getElementById(id + "_field");
      if (f) f.classList.add("o-hidden");
    });

    // default Egypt
    var c = document.getElementById("billing_country");
    if (c && c.value !== "EG" && c.querySelector('option[value="EG"]')) {
      c.value = "EG";
      if (window.jQuery) jQuery(c).trigger("change");
    }

    // guest note (only if not logged in / shown)
    var details = document.getElementById("customer_details");
    if (details && !details.querySelector(".o-guest")) {
      var g = document.createElement("div");
      g.className = "o-guest";
      g.innerHTML = '<i class="ti ti-user-check"></i> هتكمل كزائر — من غير ما تعمل حساب';
      var firstCol = details.querySelector(".col-1, .woocommerce-billing-fields") || details;
      var anchor = document.getElementById("billing_first_name_field");
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(g, anchor.nextSibling);
      else firstCol.insertBefore(g, firstCol.firstChild);
    }
  }

  /* ---------- 4) order summary extras ---------- */
  function money(s) {
    var n = (s || "").replace(/[^\d.,]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
    return parseFloat(n) || 0;
  }
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }

  function enhanceReview() {
    var review = document.getElementById("order_review");
    if (!review) return;

    // total
    var totalEl = review.querySelector(".order-total .woocommerce-Price-amount, .order-total td");
    var total = totalEl ? money(totalEl.textContent) : 0;

    // per-day (months from product name * 30, default 180)
    var days = 180;
    var nameEl = review.querySelector(".cart_item .product-name, td.product-name");
    if (nameEl) {
      var mm = nameEl.textContent.match(/(\d+)\s*شهور|(\d+)\s*month/i);
      if (mm) days = (parseInt(mm[1] || mm[2], 10) || 6) * 30;
    }
    var perday = total && days ? Math.round(total / days) : 0;

    // per-day box (before payment)
    if (perday && !review.querySelector(".o-perday")) {
      var pd = document.createElement("div");
      pd.className = "o-perday";
      pd.innerHTML = '<span class="l">يعني تقريبًا</span><span class="v">≈ ' + fmt(perday) + ' ج / اليوم</span>';
      var pay = document.getElementById("payment");
      if (pay) review.insertBefore(pd, pay);
      else review.appendChild(pd);
    }

    // "price includes" tag under total
    if (total && !review.querySelector(".o-incl")) {
      var tl = review.querySelector(".order-total");
      if (tl) {
        var inc = document.createElement("tr");
        inc.className = "o-incl";
        inc.innerHTML = '<td colspan="2">شامل · بدون رسوم إضافية</td>';
        tl.parentNode.insertBefore(inc, tl.nextSibling);
      }
    }

    // trust + review + guarantee block (once, after payment/place order)
    var pay2 = document.getElementById("payment");
    if (pay2 && !pay2.querySelector(".o-extra")) {
      var ex = document.createElement("div");
      ex.className = "o-extra";
      ex.innerHTML =
        '<div class="o-trust"><span><i class="ti ti-lock"></i> دفع آمن</span><span><i class="ti ti-shield-check"></i> ضمان استرجاع</span><span><i class="ti ti-bolt"></i> تأكيد فوري</span></div>' +
        '<div class="o-rev"><div class="o-stars">★★★★★ <span class="o-score">٤.٨ / ٥</span></div>' +
        '<p>"كنت بتخض أتكلم، دلوقتي بتكلم في الشغل بالإنجليزي عادي."</p>' +
        '<div class="o-who">— مريم · من آلاف الطلاب اللي بدأوا الرحلة</div></div>';
      var po = pay2.querySelector(".place-order");
      if (po) pay2.insertBefore(ex, po);
      else pay2.appendChild(ex);
    }
    if (pay2 && !pay2.querySelector(".o-guar")) {
      var gu = document.createElement("div");
      gu.className = "o-guar";
      gu.innerHTML = '<i class="ti ti-rosette-discount-check"></i> ضمان استرجاع كامل خلال 7 أيام — من غير أسئلة';
      pay2.appendChild(gu);
    }

    // CTA text + lock
    var btn = document.getElementById("place_order");
    if (btn && total) {
      btn.innerHTML = '<i class="ti ti-lock"></i> إتمام الطلب · ' + fmt(total) + ' ج';
    }

    // payment reassurance line under local method
    var cod = document.querySelector(".payment_method_cod label");
    if (cod && !cod.parentNode.querySelector(".o-paysub")) {
      var sub = document.createElement("div");
      sub.className = "o-paysub";
      sub.textContent = "هنبعتلك التفاصيل ونأكد طلبك فورًا على واتساب";
      cod.parentNode.insertBefore(sub, cod.nextSibling);
    }
  }

  /* ---------- run ---------- */
  function apply() {
    var root = document.getElementById("one80-checkout") || document.querySelector(".woocommerce");
    if (!root) return;
    injectCSS();
    var form = document.querySelector("form.checkout");
    if (form) buildChrome(root);
    tuneFields();
    enhanceReview();
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(apply);
  if (window.jQuery) {
    jQuery(document.body).on("updated_checkout", function () { setTimeout(apply, 30); });
    jQuery(document.body).on("country_to_state_changed", function () { setTimeout(tuneFields, 30); });
  }

  /* ---------- CSS ---------- */
  var CSS = [
    ":root{--navy:" + BRAND.navy + ";--red:" + BRAND.red + ";--green:" + BRAND.green + ";--ink:" + BRAND.ink + ";--muted:" + BRAND.muted + ";--line:" + BRAND.line + ";--soft:" + BRAND.soft + ";--bg:" + BRAND.bg + "}",
    "#one80-checkout{font-family:'Cairo',system-ui,Arial,sans-serif;color:var(--ink);max-width:900px;margin:0 auto;padding:18px 14px 56px;line-height:1.65}",
    "body.one80-co-page{background:var(--bg)}",
    ".o-hidden{display:none!important}",
    /* header */
    ".one80-chrome{display:block}",
    ".o-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px}",
    ".o-brand{display:flex;align-items:center;gap:9px}",
    ".o-brand b{font-family:'Inter';font-size:23px;font-weight:700}",
    ".o-secure{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--green);font-weight:600}",
    ".o-card-top{background:#fff;border-radius:18px 18px 0 0;box-shadow:0 10px 40px rgba(20,36,87,.10);overflow:hidden;border-bottom:1px solid var(--line)}",
    ".o-offer{display:flex;align-items:center;justify-content:center;gap:8px;background:#fff4ec;color:#b5430f;font-size:13.5px;font-weight:700;padding:10px;border-bottom:1px solid #f6e2d4}",
    ".o-steps{display:flex;align-items:center;justify-content:center;gap:6px;padding:14px;font-size:13px;color:var(--muted);flex-wrap:wrap}",
    ".o-s{display:inline-flex;align-items:center;gap:7px}",
    ".o-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 12px Inter;background:#e9edf8;color:var(--muted)}",
    ".o-s.on .o-dot{background:var(--navy);color:#fff}.o-s.on{color:var(--navy);font-weight:700}",
    ".o-ln{width:26px;height:2px;background:var(--line)}",
    /* form card */
    "#one80-checkout form.checkout{background:#fff;border-radius:0 0 18px 18px;box-shadow:0 10px 40px rgba(20,36,87,.10);display:grid;grid-template-columns:1.05fr .95fr;overflow:hidden}",
    "#one80-checkout #customer_details{padding:22px;border-inline-end:1px solid var(--line)}",
    "#one80-checkout #order_review_heading{display:none}",
    "#one80-checkout #order_review{padding:22px;background:var(--soft)}",
    "@media(max-width:760px){#one80-checkout form.checkout{grid-template-columns:1fr}#one80-checkout #customer_details{border-inline-end:none;border-bottom:1px solid var(--line)}}",
    /* fields */
    "#one80-checkout .form-row{margin-bottom:13px;padding:0;float:none;width:auto}",
    "#one80-checkout label{display:block;font-size:12.5px;color:var(--muted);margin-bottom:5px;font-weight:500}",
    "#one80-checkout .o-opt{color:#aab;font-weight:500}",
    "#one80-checkout input.input-text,#one80-checkout select,#one80-checkout .select2-selection{border:1px solid var(--line)!important;border-radius:11px!important;padding:12px 14px!important;font-size:14px!important;min-height:46px!important;background:#fff;box-shadow:none!important}",
    "#one80-checkout .select2-selection__rendered{line-height:22px!important;padding:0!important}",
    "#one80-checkout .select2-selection__arrow{top:10px!important}",
    ".o-guest{display:flex;align-items:center;gap:8px;background:#eafaf2;border:1px solid #cdeede;color:#0c7a52;font-size:13px;font-weight:600;border-radius:11px;padding:11px 13px;margin-bottom:13px}",
    /* order review table */
    "#one80-checkout .shop_table{border:none;background:transparent}",
    "#one80-checkout .shop_table th,#one80-checkout .shop_table td{border:none;padding:7px 0;font-size:13.5px}",
    "#one80-checkout .shop_table tfoot .order-total td,#one80-checkout .shop_table tfoot .order-total th{font-size:20px;color:var(--navy);font-weight:800;border-top:1px dashed #d6ddee;padding-top:12px}",
    "#one80-checkout tr.o-incl td{color:var(--muted);font-size:12px;font-weight:600;padding-top:0;text-align:start}",
    ".o-perday{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid var(--line);border-radius:11px;padding:9px 12px;margin:12px 0}",
    ".o-perday .l{font-size:12.5px;color:var(--muted)}",
    ".o-perday .v{font-weight:800;color:var(--navy);font-size:15px}",
    /* coupon */
    "#one80-checkout .checkout_coupon{border:1px solid var(--line)!important;border-radius:12px;background:#fff;margin-bottom:12px}",
    /* payment */
    "#one80-checkout #payment{background:transparent;border-radius:0}",
    "#one80-checkout #payment ul.wc_payment_methods{border:none;padding:0;margin:0 0 8px}",
    "#one80-checkout #payment li.wc_payment_method{border:1.5px solid var(--line);border-radius:13px;padding:12px 13px;margin-bottom:10px;list-style:none;background:#fff}",
    "#one80-checkout #payment li.wc_payment_method>label{font-size:14px!important;font-weight:700;color:var(--ink);margin:0;display:inline-block}",
    ".o-paysub{font-size:12px;color:var(--muted);margin-top:4px}",
    "#one80-checkout #payment .payment_box{background:#f6f8ff!important;border-radius:10px;font-size:12.5px;color:#596079}",
    "#one80-checkout #payment .payment_box:before{display:none}",
    /* trust / review / guarantee */
    ".o-trust{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin:14px 0 0;color:var(--muted);font-size:12px;font-weight:600}",
    ".o-trust i{color:var(--navy)}",
    ".o-rev{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:12px}",
    ".o-stars{color:#f5a623;font-size:14px;letter-spacing:1px}",
    ".o-score{color:#1b2440;font-size:12.5px;font-weight:700}",
    ".o-rev p{font-size:12.5px;color:#444;margin:7px 0 0;line-height:1.6}",
    ".o-who{font-size:11.5px;color:var(--muted);margin-top:6px}",
    ".o-guar{display:flex;align-items:center;justify-content:center;gap:7px;font-size:12.5px;color:var(--green);font-weight:600;margin-top:12px}",
    /* CTA button */
    "#one80-checkout #place_order{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;background:var(--red)!important;color:#fff!important;font-size:17px!important;font-weight:800!important;border-radius:13px!important;padding:16px!important;margin-top:14px;box-shadow:0 12px 26px rgba(227,27,35,.32);border:none;text-shadow:none;float:none}",
    "#one80-checkout #place_order:hover{background:#c8161d!important}",
    "i.ti{vertical-align:-2px}"
  ].join("\n");
})();
