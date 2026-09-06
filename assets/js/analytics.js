/* ============================================================================
   アコード結婚相談所 ｜ 無料個別診断 広告専用LP
   assets/js/analytics.js
   ---------------------------------------------------------------------------
   ・計測タグの読み込み（既存サイトの設定をそのまま引き継いでいます）
   ・流入元パラメータの取得と保持（予約完了まで維持）
   ・dataLayerイベント送信の共通処理
   計測の追加・変更は、できるかぎりGTM側で行ってください。
   ============================================================================ */
(function (w, d) {
  'use strict';

  /* ------------------------------------------------------------------
     1. 計測ID（既存index.htmlから引き継ぎ。空欄のものは読み込みません）
     ------------------------------------------------------------------ */
  var TAGS = {
    gtmId:       'GTM-5FZHVHXW',      /* Googleタグマネージャー（計測はGTMへ一本化） */
    ga4Id:       '',                  /* GA4（G-N2QDZ2RSWV）はGTM側で設定済みのため空欄 */
    clarityId:   '',                  /* Microsoft ClarityもGTM側で設定済みのため空欄 */
    xPixelId:    'retf6',             /* X（旧Twitter）広告ピクセル */
    metaPixelId: '1387328040199947'   /* Metaピクセル */
  };

  /* 公開中のヘッドライン案（CRO_TEST_PLAN.md 参照）。現在はD案です。 */
  var DEFAULT_VARIANT = 'D';

  /* 保持する流入元パラメータ */
  var SRC_KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term',
                  'twclid','fbclid','gclid','lp_variant'];
  var STORE_KEY = 'accord_src';

  w.dataLayer = w.dataLayer || [];

  /* ------------------------------------------------------------------
     2. タグ読み込み
     ------------------------------------------------------------------ */
  function load(src) {
    var el = d.createElement('script');
    el.async = true; el.src = src;
    (d.head || d.documentElement).appendChild(el);
  }

  if (TAGS.gtmId) {
    w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    load('https://www.googletagmanager.com/gtm.js?id=' + TAGS.gtmId);
  }
  if (TAGS.ga4Id) {
    w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
    load('https://www.googletagmanager.com/gtag/js?id=' + TAGS.ga4Id);
    w.gtag('js', new Date()); w.gtag('config', TAGS.ga4Id);
  }
  if (TAGS.clarityId) {
    w.clarity = w.clarity || function () { (w.clarity.q = w.clarity.q || []).push(arguments); };
    load('https://www.clarity.ms/tag/' + TAGS.clarityId);
  }
  if (TAGS.xPixelId) {
    if (!w.twq) {
      var tw = w.twq = function () { tw.exe ? tw.exe.apply(tw, arguments) : tw.queue.push(arguments); };
      tw.version = '1.1'; tw.queue = [];
      load('https://static.ads-twitter.com/uwt.js');
    }
    w.twq('config', TAGS.xPixelId);
  }
  if (TAGS.metaPixelId) {
    if (!w.fbq) {
      var fb = w.fbq = function () { fb.callMethod ? fb.callMethod.apply(fb, arguments) : fb.queue.push(arguments); };
      if (!w._fbq) w._fbq = fb;
      fb.push = fb; fb.loaded = true; fb.version = '2.0'; fb.queue = [];
      load('https://connect.facebook.net/en_US/fbevents.js');
    }
    w.fbq('init', TAGS.metaPixelId);
    w.fbq('track', 'PageView');
  }

  /* ------------------------------------------------------------------
     3. 流入元パラメータの取得と保持
        初回訪問時にURLから取得し、sessionStorageへ保存。
        以降のページ（thanks.htmlを含む）でも同じ値を使います。
     ------------------------------------------------------------------ */
  function readStore() {
    try {
      var raw = w.sessionStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function writeStore(obj) {
    try { w.sessionStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch (e) {}
  }

  var stored = readStore() || {};
  var q;
  try { q = new URLSearchParams(w.location.search); } catch (e) { q = null; }

  var incoming = {}, hasIncoming = false;
  if (q) {
    SRC_KEYS.forEach(function (k) {
      var v = q.get(k);
      if (v) { incoming[k] = String(v).slice(0, 180); hasIncoming = true; }
    });
  }

  var src = hasIncoming ? incoming : stored;
  if (!src.lp_variant) src.lp_variant = stored.lp_variant || DEFAULT_VARIANT;
  if (hasIncoming || !readStore()) writeStore(src);

  /* ------------------------------------------------------------------
     4. 共通のイベント送信
     ------------------------------------------------------------------ */
  var sentOnce = {};

  function params(extra) {
    var o = {};
    SRC_KEYS.forEach(function (k) { o[k] = src[k] || ''; });
    if (extra) { for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k]; } }
    return o;
  }

  function track(name, extra) {
    w.dataLayer.push(Object.assign({ event: name }, params(extra)));
  }

  /* 1セッションで1回だけ送るイベント（予約完了の二重送信防止に使用） */
  function trackOnce(name, extra, storageKey) {
    if (sentOnce[name]) return false;
    if (storageKey) {
      try {
        if (w.sessionStorage.getItem(storageKey)) { sentOnce[name] = true; return false; }
        w.sessionStorage.setItem(storageKey, String(Date.now()));
      } catch (e) {}
    }
    sentOnce[name] = true;
    track(name, extra);
    return true;
  }

  /* 流入元をURLへ引き継ぐ（TimeRexへの外部遷移などで使用） */
  function appendSource(url) {
    try {
      var u = new URL(url, w.location.href);
      SRC_KEYS.forEach(function (k) { if (src[k]) u.searchParams.set(k, src[k]); });
      return u.toString();
    } catch (e) { return url; }
  }

  w.ACCORD = w.ACCORD || {};
  w.ACCORD.track = track;
  w.ACCORD.trackOnce = trackOnce;
  w.ACCORD.source = src;
  w.ACCORD.sourceKeys = SRC_KEYS;
  w.ACCORD.appendSource = appendSource;
  w.ACCORD.BOOKING_FLAG = 'accord_booking_complete_sent';

})(window, document);
