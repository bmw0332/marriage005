/* ============================================================================
   アコード結婚相談所 ｜ サンクスページの計測
   assets/js/thanks.js
   ---------------------------------------------------------------------------
   ・thank_you_view … 表示のたびに送信
   ・booking_complete … 1セッション1回だけ送信
       TimeRexの埋め込みウィジェットから遷移した場合は、LP側で
       booking_complete を送信済みのため、ここでは重複送信しません。
       TimeRexの外部ページから戻った場合は、ここが唯一の送信箇所になります。
   ============================================================================ */
(function (w) {
  'use strict';
  var A = w.ACCORD || {};
  var track = A.track || function () {};
  var trackOnce = A.trackOnce || function () {};

  trackOnce('booking_complete', { booking_method: 'thanks_page' },
            A.BOOKING_FLAG || 'accord_booking_complete_sent');

  track('thank_you_view', { page_type: 'thanks' });
})(window);
