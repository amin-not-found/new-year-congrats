<script lang="ts">
  export let text;
  export let bg;
</script>

<div id="container" style="background-color:{bg};">
  <div id="msg">
    <h1>{text}</h1>
  </div>
  <div id="img-container">
    <img src="./assets/tiger.svg" alt="tiger" />
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

    border-radius: 50px;
  }
  #msg {
    text-align: center;
  }
  #img-container {
    display: flex;
    justify-content: center;
  }
  img {
    max-width: 30vh;
    max-height: auto;
    display: block;
  }
  @media (min-width: 320px) {
    div {
      font-size: 4vw;
    }
}
  @media (min-width: 801px) {
    div {
      font-size: 2vw;
    }
  }
</style>
