/* ============================================================================
   アコード結婚相談所 ｜ 無料個別診断 広告専用LP
   assets/js/timerex-config.js
   ---------------------------------------------------------------------------
   TimeRexに関する設定は、このファイル1か所にまとめています。
   HTML・CSS・main.js は変更せず、ここだけ書き換えれば切り替わります。

   【現状】
   TimeRex管理画面が発行する正式な埋め込みコードが未提供のため、
   embed.enabled は false（外部遷移フォールバック）で公開できる状態です。
   埋め込みコードを取得したら、下記【手順】のとおり設定してください。

   【手順】
   1. TimeRex管理画面 → 対象のカレンダー → 「埋め込み」「ウィジェット」等のメニューを開く
   2. 発行されたコードのうち
      ・<script src="..."> の src → embed.scriptSrc へ
      ・マウント用要素に付いている data-* 属性 → embed.mountAttrs へ
      をコピーする
   3. embed.enabled を true にする
   4. 予約完了コールバック名が公式ドキュメントと異なる場合は
      embed.completeCallbackName を実際の名称に合わせる
   5. index.html の <div id="timerexMount"> の位置にウィジェットが描画されます
      （HTMLの編集は不要です）
   ============================================================================ */
window.TIMEREX_CONFIG = {

  /* 予約URL（フォールバック時の遷移先／埋め込み未設定でも予約は成立します） */
  bookingUrl: 'https://timerex.net/s/ba.08h_1a1f/83cf8db1',

  /* 予約完了後に表示するページ */
  thanksUrl: 'thanks.html',

  /* 流入元パラメータ（utm_source等）を予約URLへ引き継ぐ */
  passSourceParams: true,

  /* 埋め込みウィジェット設定 ------------------------------------------- */
  embed: {
    /* true にすると、予約セクション接近時／CTAクリック時に遅延読み込みします */
    enabled: false,

    /* TimeRex管理画面が発行するウィジェット用スクリプトのURL */
    scriptSrc: '',

    /* マウント要素へ付与する属性（管理画面のコードをそのまま転記）
       例： { 'data-url': 'https://timerex.net/s/ba.08h_1a1f/83cf8db1' } */
    mountAttrs: {},

    /* 予約完了時に呼ばれるコールバックのグローバル関数名
       （TimeRexの仕様に合わせて変更してください） */
    completeCallbackName: 'onBookingComplete',

    /* 予約完了イベントを postMessage で受け取る場合の送信元オリジン */
    messageOrigin: 'https://timerex.net',

    /* ウィジェットの高さ（px）。管理画面の指定に合わせて調整してください */
    height: 760
  }
};
