<script lang="ts">
  import settings, { Settings } from "./settings";

  export let bg;
  export let dismiss;
  $: $settings = $settings;
  $: url = $settings.encode();
  function changeChars(e: Event) {
    $settings.chars = (e.target as HTMLTextAreaElement).value.split("");
  }
</script>

<div id="container" style="background-color:{bg};" dir="rtl">
  <label>متن:</label>
  <input type="text" bind:value={$settings.text} />
  <label>رنگ پس زمینه:</label>
  <input type="color" bind:value={$settings.bg} />
  <label>رنگ کادر متن:</label>
  <input type="color" bind:value={$settings.fg} />
  <label>کاراکتر های باران(ایموجی ها):</label>
  <input
    type="text"
    value={$settings.chars.join("")}
    on:input={changeChars}
  />
  <br>
  <textarea>{url}</textarea>
  <button on:click={()=>navigator.clipboard.writeText(url)}>کپی لینک ساخته شده</button>
  <button on:click={dismiss}>بازگشت</button>
  <div>
    ساخته شده توسط <a href="https://github.com/amin-pro">amin-pro</a>
    <br>
    منبع عکس ببر: all-free-download.com
  </div>
</div>

<style>
  #container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 70%;
    padding: 20px;
    overflow: hidden;
    font-size: 1.3em;

    border-radius: 50px;
  }
  button{
    display: block;
  }
  textarea {
    font-size: smaller;
    direction: ltr;
  }
  input,textarea{
    width: 100%;
    margin: 10px;
  }
  input[type="color"]{
    padding: 0;
  }
</style>
