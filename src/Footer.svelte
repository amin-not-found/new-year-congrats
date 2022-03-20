<script lang="ts">
    export let bg;
    export let action;
</script>

<div style="background-color:{bg};">
    <p on:click={action}>شخصی سازی / درباره</p>
</div>

<style>
    p{
        font: xx-small;
    }
    div{
        position: absolute;
        bottom:0;
        width: 100%;
        text-align: center;
    }
</style>