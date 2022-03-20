import { writable } from "svelte/store";

export class Settings {
  static baseUrl = "https://amin-pro.github.io/new-year-congrats/?settings=";
  constructor(
    public text = "سال نو مبارک",
    public bg = "#555555",
    public fg = "#ffffff",
    public chars = ["🥳", "🎉", "✨"]
  ) {}
  setUsingQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has("settings")) {
      return;
    }
    let data = JSON.parse(decodeURIComponent(urlParams.get("settings")));
    if (data.text) {
      this.text = data.text;
    }
    if (data.chars) {
      this.chars = data.chars;
    }
    if (data.bg) {
      this.bg = data.bg;
    }
    if (data.fg) {
      this.fg = data.fg;
    }
    console.log(this)
  }
  encode = () => (Settings.baseUrl + encodeURIComponent(JSON.stringify(this))).replace(/\s/g, "");
}

export default writable(new Settings());