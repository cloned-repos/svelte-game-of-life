<script lang="ts">
    import { checkable } from "../actions/checkable"; // esm module have explicit extention
    
    /// <reference path="../actions/svelte.actions.checkable.d.ts"
   
</script>

<span class:a={true}>
    <label>
        <input use:checkable on:checked on:unchecked type="checkbox" />
        <svg
            class="face1"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 58 58"
        >
            <circle class="shaded" cx="29" cy="29" r="29" />
            <rect class="empress" x="32.66" y="16" width="8" height="26" />
            <rect class="empress" x="19.33" y="16" width="8" height="26" />
        </svg>
        <svg
            class="face2"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 58 58"
        >
            <circle class="shaded" cx="29" cy="29" r="29" />
            <g>
                <polygon class="empress" points="44,29 22,44 22,29.273 22,14" />
                <path
                    class="empress"
                    d="M22,45c-0.16,0-0.321-0.038-0.467-0.116C21.205,44.711,21,44.371,21,44V14
c0-0.371,0.205-0.711,0.533-0.884c0.328-0.174,0.724-0.15,1.031,0.058l22,15C44.836,28.36,45,28.669,45,29s-0.164,0.64-0.437,0.826
l-22,15C22.394,44.941,22.197,45,22,45z M23,15.893v26.215L42.225,29L23,15.893z"
                />
            </g>
        </svg>
    </label>
</span>

<style>
    * {
        box-sizing: border-box;
    }

    input[type="checkbox"] {
        display: none;
    }

    .a {
        user-select: none;
        display: inline-block;
        width: var(--btn-size, 100%);
        height: var(--btn-size, 100%);
        font-size: 0;
        color: inherit;
        text-decoration: none;
        overflow: hidden;
    }

    .a > label {
        display: inline-block;
        width: 100%;
        height: 100%;
        position: relative;
    }

    /* checked display face1 , hide face2 */

    .a svg {
        transition: all 0.2s linear;
    }

    .a input[type="checkbox"]:checked ~ svg.face1 {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    }

    .a input[type="checkbox"]:checked ~ svg.face2 {
        position: absolute;
        width: 0;
        height: 0;
        top: 50%;
        left: 50%;
    }

    /* un-checked hide face1 , display face2 */

    .a input[type="checkbox"]:not(:checked) ~ svg.face1 {
        position: absolute;
        width: 0;
        height: 0;
        top: 50%;
        left: 50%;
    }

    .a input[type="checkbox"]:not(:checked) ~ svg.face2 {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    }

    /* face 1 and face 2 generic */

    .a input[type="checkbox"] ~ svg .shaded {
        fill: rgb(79, 91, 193);
        fill-opacity: 0.3;
    }

    .a input[type="checkbox"] ~ svg .empress {
        fill: rgb(79, 91, 193);
        fill-opacity: 0.7;
    }

    /* face 1 and face 2 selected */

    .a:active input[type="checkbox"] ~ svg .shaded {
        fill: rgb(79, 91, 193);
        fill-opacity: 0.9;
    }

    .a:active input[type="checkbox"] ~ svg .empress {
        fill: rgb(40, 17, 46);
        fill-opacity: 0.5;
    }
</style>
