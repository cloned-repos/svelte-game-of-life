<script context="module" lang="ts">
    let pk = 0;
</script>

<script lang="ts">
    let id = "" + ++pk;
    export let value = "radio-btn" + pk;
    export let checked = false;
    export let selected = "radio-btn" + pk;
    export let outerColor = "#C1FBC9";
    export let innerColor = "#C1FBC9";
    const name = "n" + selected; // <form name , no used here field use in groups for radiobuttons manditory
</script>

<input type="radio" {id} {name} {value} {checked} bind:group={selected} on:change />
<label
    for={"" + id}
    style="--inner-color:{innerColor};--outer-color:{outerColor}"
>
    <div class="radio-outer">
        <div class="radio-inner" />
    </div>
    <span>
        <slot>
            {"radio-btn" + pk}
        </slot>
    </span>
</label>

<style>
    input[type="radio"] {
        display: none;
    }

    input[type="radio"]:checked + label .radio-inner {
        opacity: 1;
    }

    input[type="radio"]:not(:checked) + label .radio-inner {
        opacity: 0;
    }

    input[type="radio"] + label .radio-inner {
        transition: opacity 0.2s linear;
    }

    label {
        /**/
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 100%;
        min-width: max-content;
    }
    .radio-outer {
        display: inline-block;
        border: 2px solid var(--outer-color, purple);
        border-radius: 50%;
        width: var(--radio-button-size, 30px);
        height: var(--radio-button-size, 30px);
        position: relative;
    }
    .radio-inner {
        position: absolute;
        background: var(--inner-color, cyan);
        left: 20%;
        right: 20%;
        bottom: 20%;
        top: 20%;
        border-radius: 50%;
    }
    span {
        margin: 0 10px;
    }
</style>
