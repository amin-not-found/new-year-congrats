<script lang="ts">
  import { onMount } from "svelte";
  import Footer from "./Footer.svelte";
  import Message from "./Message.svelte";
  import settings from "./settings";
  import SettingsInfo from "./SettingsInfo.svelte";
  let showSettings = false;
  $settings.setUsingQuery();

  let characters = ["🥳", "🎉", "✨"];

  let confetti = new Array(100)
    .fill(null)
    .map((_, i) => {
      return {
        character: characters[i % characters.length],
        x: Math.random() * 100,
        y: -20 - Math.random() * 100,
        r: 0.1 + Math.random() * 1,
      };
    })
    .sort((a, b) => a.r - b.r);

  onMount(() => {
    let frame;

    function loop() {
      frame = requestAnimationFrame(loop);

      confetti = confetti.map((emoji) => {
        emoji.y += 0.7 * emoji.r;
        if (emoji.y > 120) emoji.y = -20;
        return emoji;
      });
    }

    loop();

    return () => cancelAnimationFrame(frame);
  });
</script>

<div style="background-color:{$settings.bg};">
  {#if !showSettings}
    <Message text={$settings.text} bg={$settings.fg} />
    <Footer bg={$settings.fg} action={() => (showSettings = true)} />
  {:else}
    <SettingsInfo
      bg={$settings.fg}
      dismiss={function () {
        showSettings = false;
        console.log(1);
      }}
    />
  {/if}
</div>

{#each confetti as c}
  <span style="left: {c.x}%; top: {c.y}%; transform: scale({c.r})"
    >{c.character}</span
  >
{/each}

<style>
  span {
    position: absolute;
    font-size: 5vw;
    user-select: none;
  }
  div {
    height: 100%;
    width: 100%;
  }
</style>
