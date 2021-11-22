<script context="module" lang="ts">
    let pk = 0;
</script>

<script lang="ts">
    const id = `${++pk}`;
    export let value: string|number = "radio-btn" + id;
    export let initialChecked = false;
    export let group: string;
</script>

<input
    {id}
    type="radio" 
    name={group} 
    value={value} 
    checked={initialChecked} 
    bind:group={group} 
    on:change />
<label
    for={id}
>
    <div class="radio-outer">
        <div class="radio-inner" />
    </div>
    <span class="radio-text">
        <slot>
            {"radio-btn" + pk}
        </slot>
    </span>
</label>

<style>
    input[type="radio"] {
        display: none;
    }

    /* radio text */
    input[type="radio"] + label .radio-text
    {
        color: #AAAAAA;
    }


    input[type="radio"]:checked + label .radio-text
    {
        color: var(--inner-color);
    }

    .radio-text {
        margin: 0 calc( var(--radio-button-size, 30px) / 3 );
    }

    /* radio button, radio outer */

    .radio-outer {
        display: inline-block;
        border-radius: 50%;
        border-width: 1px;
        border-style: solid;
        width: var(--radio-button-size, 30px);
        height: var(--radio-button-size, 30px);
        position: relative;
    }

    input[type="radio"] + label .radio-outer
    {
        border-color: rgb(170,170,170);
    }

    
    input[type="radio"]:checked + label .radio-outer {
        border-color: var(--outer-color);
    }

    /* radio button, radio inner */

    .radio-inner {
        position: absolute;
        left: 20%;
        right: 20%;
        bottom: 20%;
        top: 20%;
        border-radius: 50%;
        border: none;
        background: var(--inner-color);
    }

    input[type="radio"] + label .radio-inner {
        opacity: 0;
    }

    input[type="radio"]:checked + label .radio-inner {
        opacity: 1;
    }

    /* transitions */

    input[type="radio"] + label .radio-inner,
    input[type="radio"] + label .radio-outer,
    input[type="radio"] + label .radio-text
    {
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
    
</style>
