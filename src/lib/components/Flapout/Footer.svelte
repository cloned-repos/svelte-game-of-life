<script lang="ts">
    import RadioButton from "../RadioButton.svelte";
</script>

<div class="footer">
    <p class="section-heading">[select seeding]</p>
    <RadioButton group={"seeding"} initialChecked={true} value={20}>
        Random Seeding 20%
    </RadioButton>
    <RadioButton group={"seeding"} initialChecked={false} value={60}>
        Random Seeding 60%
    </RadioButton>
</div>

<style>
    .footer {
        font-size: 12px;
        min-width: calc (var(--flapout-item-height, 44px) + 150px);
        font-family: 'Open Sans';
        font-weight: 300;
        color: white;
        font-size: 12px;
        
        --outer-color: '#C1FBC9';
        --inner-color: '#C1FBC9';
        --radio-button-size: 30px;

        display: flex;
        flex-direction: column;
        flex-basis: auto;
        align-items: stretch;
        justify-content: flex-start;
    }
    .section-heading {
        background: rgba(128, 128, 128, 0.2);
    }
</style>
