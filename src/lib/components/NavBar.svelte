<script>
    import PlayPauseButton from "./PlayPauseButton.svelte";
    import StopButton from "./StopButton.svelte";
</script>

<div class:navbar={true}>
    <PlayPauseButton on:checked on:unchecked /><StopButton on:click />
</div>

<style>
    .navbar {
        height: max-content;
        display: flex;
        flex-direction: row;
        align-content: start; /* cross-axis */
        justify-content: start; /* main-axis */
    }
</style>
