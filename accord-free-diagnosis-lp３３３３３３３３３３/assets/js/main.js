/* ============================================================================
   アコード結婚相談所 ｜ 無料個別診断 広告専用LP
   assets/js/main.js
   ---------------------------------------------------------------------------
   ・FAQ（アコーディオン）
   ・スマートフォン下部固定CTA
   ・計測イベント（lp_view / lp_cta_click / booking_section_view /
     timerex_widget_loaded / booking_start / booking_complete / faq_open）
   ・TimeRexウィジェットの遅延読み込みと外部遷移フォールバック
   ============================================================================ */
(function (w, d) {
  'use strict';

  /* --------------------------------------------------------------------
     ページ内設定
     -------------------------------------------------------------------- */
  var LP_CONFIG = {
    /* 担当者本人の実写写真がある場合のみ、ファイルパスを設定してください。
       例： advisorPhoto: 'assets/images/advisor.webp'
       空欄のままでも、写真なしのレイアウトで正しく表示されます。
       ストック写真や生成画像は使用しないでください。 */
    advisorPhoto: '',
    advisorAlt: '坂本 早貴',

    /* 埋め込みが使えないときのCTA挙動
       'scroll'   … 予約セクションへスクロール（既定。セクション内のボタンで予約へ進みます）
       'redirect' … CTAクリックで直接TimeRexへ遷移 */
    ctaBehaviorWithoutEmbed: 'scroll'
  };

  var A = w.ACCORD || {};
  var track = A.track || function () {};
  var trackOnce = A.trackOnce || function () {};
  var appendSource = A.appendSource || function (u) { return u; };
  var CFG = w.TIMEREX_CONFIG || {};
  var EMBED = CFG.embed || {};

  function $(sel, root) { return (root || d).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }

  /* --------------------------------------------------------------------
     1. ページ表示
     -------------------------------------------------------------------- */
  track('lp_view', { page_type: 'lp' });

  /* --------------------------------------------------------------------
     2. 予約リンクのURL（流入元パラメータを引き継ぐ）
     -------------------------------------------------------------------- */
  var bookingUrl = CFG.bookingUrl || 'https://timerex.net/s/ba.08h_1a1f/83cf8db1';
  var bookingHref = (CFG.passSourceParams === false) ? bookingUrl : appendSource(bookingUrl);
  $$('[data-booking-link]').forEach(function (a) { a.href = bookingHref; });

  /* --------------------------------------------------------------------
     3. CTAクリック
     -------------------------------------------------------------------- */
  var embedAvailable = !!(EMBED.enabled && EMBED.scriptSrc);

  $$('[data-cta]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var pos = a.getAttribute('data-cta');
      track('lp_cta_click', {
        cta_position: pos,
        cta_text: (a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)
      });

      /* 埋め込みがある場合は予約セクションへスクロールし、ウィジェットを読み込む */
      if (embedAvailable) { mountTimerex('cta'); return; }

      if (LP_CONFIG.ctaBehaviorWithoutEmbed === 'redirect') {
        ev.preventDefault();
        trackOnce('booking_start', { booking_method: 'external_redirect', cta_position: pos },
                  'accord_booking_start_sent');
        w.setTimeout(function () { w.location.href = bookingHref; }, 120);
      }
      /* 既定（'scroll'）はアンカーの標準動作で #booking へ移動します */
    });
  });

  /* 予約セクション内のボタン（外部遷移フォールバック） */
  var bookingLink = $('#bookingLink');
  if (bookingLink) {
    bookingLink.addEventListener('click', function () {
      trackOnce('booking_start', { booking_method: 'external_redirect', cta_position: 'booking' },
                'accord_booking_start_sent');
    });
  }

  /* --------------------------------------------------------------------
     4. 予約セクション到達（初回50％表示）
     -------------------------------------------------------------------- */
  var booking = $('#booking');
  if (booking && 'IntersectionObserver' in w) {
    var seen = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!seen && e.isIntersecting && e.intersectionRatio >= 0.5) {
          seen = true;
          track('booking_section_view');
          io.disconnect();
        }
      });
    }, { threshold: [0.5] });
    io.observe(booking);

    /* 予約セクションが近づいたらウィジェットを先読み（初期表示速度を落とさないため） */
    if (embedAvailable) {
      var pre = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { mountTimerex('scroll'); pre.disconnect(); }
      }, { rootMargin: '600px 0px' });
      pre.observe(booking);
    }
  }

  /* --------------------------------------------------------------------
     5. TimeRexウィジェット（遅延読み込み）
        正式な埋め込みコードが未提供のため、既定では読み込みません。
        assets/js/timerex-config.js の embed 設定で有効化されます。
     -------------------------------------------------------------------- */
  var mounted = false;

  function mountTimerex(trigger) {
    if (mounted || !embedAvailable) return;
    var mount = $('#timerexMount');
    var fallback = $('#bookingFallback');
    if (!mount) return;
    mounted = true;

    /* レイアウトシフトを防ぐため、読み込み前に高さを確保する */
    if (EMBED.height) mount.style.minHeight = EMBED.height + 'px';
    Object.keys(EMBED.mountAttrs || {}).forEach(function (k) {
      mount.setAttribute(k, EMBED.mountAttrs[k]);
    });
    if (fallback) fallback.hidden = true;

    /* 予約完了コールバックを登録 */
    var cbName = EMBED.completeCallbackName || 'onBookingComplete';
    w[cbName] = function (payload) { handleBookingComplete('widget_callback', payload); };
    w.addEventListener('message', onWidgetMessage, false);

    /* ウィジェット内の最初の操作を「日程選択開始」として扱う */
    mount.addEventListener('click', function () {
      trackOnce('booking_start', { booking_method: 'widget' }, 'accord_booking_start_sent');
    }, { once: true });

    var s = d.createElement('script');
    s.async = true;
    s.src = EMBED.scriptSrc;
    s.onload = function () { track('timerex_widget_loaded', { load_trigger: trigger || 'scroll' }); };
    s.onerror = function () {
      /* 読み込みに失敗した場合は、外部遷移フォールバックへ戻す */
      mounted = false;
      mount.style.minHeight = '';
      if (fallback) fallback.hidden = false;
      track('timerex_widget_error');
    };
    d.body.appendChild(s);
  }

  function onWidgetMessage(ev) {
    if (EMBED.messageOrigin && ev.origin !== EMBED.messageOrigin) return;
    var t = ev.data && (ev.data.type || ev.data.event);
    if (!t) return;
    if (/complete|booked|finish/i.test(String(t))) handleBookingComplete('widget_message', ev.data);
    else if (/select|start|input/i.test(String(t))) {
      trackOnce('booking_start', { booking_method: 'widget' }, 'accord_booking_start_sent');
    }
  }

  function handleBookingComplete(method, payload) {
    var extra = { booking_method: method };
    if (payload && payload.bookingId) extra.booking_id = String(payload.bookingId).slice(0, 60);
    var fired = trackOnce('booking_complete', extra, A.BOOKING_FLAG || 'accord_booking_complete_sent');
    var url = CFG.thanksUrl || 'thanks.html';
    w.setTimeout(function () { w.location.href = url + (fired ? '?bc=1' : ''); }, 250);
  }

  /* --------------------------------------------------------------------
     6. スマートフォン下部固定CTA
     -------------------------------------------------------------------- */
  var sticky = $('#sticky');
  if (sticky && 'IntersectionObserver' in w) {
    d.body.classList.add('has-sticky');

    var blockers = ['#heroCta', '#booking', '#final'].map(function (s) { return $(s); })
                     .filter(Boolean);
    var visible = new WeakMap();

    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible.set(e.target, e.isIntersecting); });
      var blocked = blockers.some(function (el) { return visible.get(el); });
      sticky.classList.toggle('is-on', !blocked);
    }, { threshold: 0 });

    blockers.forEach(function (el) { so.observe(el); });
  }

  /* --------------------------------------------------------------------
     7. 担当者写真（本人写真がある場合のみ差し込む）
     -------------------------------------------------------------------- */
  if (LP_CONFIG.advisorPhoto) {
    var top = $('#advisorTop');
    if (top) {
      var img = d.createElement('img');
      img.className = 'advisor__photo';
      img.src = LP_CONFIG.advisorPhoto;
      img.width = 96; img.height = 96;
      img.alt = LP_CONFIG.advisorAlt || '';
      img.loading = 'lazy'; img.decoding = 'async';
      top.insertBefore(img, top.firstChild);
    }
  }

  /* --------------------------------------------------------------------
     8. FAQ
     -------------------------------------------------------------------- */
  var FAQS = [
    { q: '無料個別診断だけでも大丈夫ですか？',
      a: ['はい。診断だけで終了できます。入会を前提に話を進める場ではありません。現在の婚活で止まっている可能性が高い場所と、最初に変えることを整理します。'] },
    { q: '結婚相談所への営業をされますか？',
      a: ['診断内容に応じて、継続支援をご案内する場合があります。ただし、その場で入会を決める必要はありません。現在のアプリや相談所を続ける方がよい場合は、そのままお伝えします。'] },
    { q: '事前に準備するものはありますか？',
      a: ['特にありません。プロフィール文や最近のメッセージがある場合は、個人情報を隠して見せていただくと、より具体的に整理できます。'] },
    { q: 'マッチングアプリを利用していても相談できますか？',
      a: ['はい。アプリ、ほかの結婚相談所、婚活パーティーなど、現在利用している方法にかかわらず相談できます。'] },
    { q: '恋愛経験や交際経験がほとんどなくても大丈夫ですか？',
      a: ['問題ありません。交際経験が少なく、会話や関係の深め方に悩んでいる男性を主な対象としています。'] },
    { q: '原因を必ず特定できますか？',
      a: ['お相手本人の考えを断定することはできません。これまでの活動状況や実際のやり取りをもとに、止まっている可能性が高い場所と、次に検証する改善策を整理します。'] },
    { q: '33項目の評価まで無料で受けられますか？',
      a: ['無料個別診断では、現在の活動状況と改善の優先順位を整理します。模擬お見合いと全33項目の評価は、継続支援をご利用いただく場合に実施します。'] },
    { q: '遠方からでも受けられますか？',
      a: ['はい。オンラインで全国に対応しています。所要時間は約60分です。'] }
  ];

  var faqRoot = $('#faq');
  if (faqRoot) {
    var html = '';
    FAQS.forEach(function (item, i) {
      var qid = 'faq-q-' + (i + 1), aid = 'faq-a-' + (i + 1);
      html += '<li>' +
        '<h3><button class="faq__q" type="button" id="' + qid + '" aria-expanded="false" aria-controls="' + aid + '">' +
        '<span>' + item.q + '</span><span class="ic" aria-hidden="true"></span></button></h3>' +
        '<div class="faq__a" id="' + aid + '" role="region" aria-labelledby="' + qid + '" hidden>' +
        item.a.map(function (p) { return '<p>' + p + '</p>'; }).join('') +
        '</div></li>';
    });
    faqRoot.innerHTML = html;

    faqRoot.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('.faq__q') : null;
      if (!btn) return;
      var open = btn.getAttribute('aria-expanded') === 'true';
      var panel = d.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (panel) panel.hidden = open;
      if (!open) {
        track('faq_open', { faq_question: (btn.textContent || '').trim().slice(0, 80) });
      }
    });
  }

})(window, document);
