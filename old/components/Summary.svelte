<script>
    export let generations = 15029;
    export let gridWidth = 115;
    export let gridHeight = 122;
    export let cellsProcessed = 412;
    export let cellsDrawn = 492;
</script>

<table>
    <tr>
        <td>generations:</td><td>{generations}</td>
    </tr>
    <tr>
        <td>grid width:</td><td>{gridWidth}</td>
    </tr>
    <tr>
        <td>grid height:</td><td>{gridHeight}</td>
    </tr>
    <tr>
        <td>cells processed:</td><td>{cellsProcessed}</td>
    </tr>
    <tr>
        <td>cells drawn:</td><td>{cellsDrawn}</td>
    </tr>
</table>

<style>
    * {
        box-sizing: border-box;
        font-family: var(--summary-font-family, inherit);
        font-size: var(--summary-font-size, inherit);
        font-variant-numeric: var(
            --summary-font-variant-numeric,
            oldstyle-nums tabular-nums
        );
        font-weight: var(--summary-font-weight, regular);
    }

    td {
        padding: 0.25em;
    }

    td:last-child {
        text-align: right;
        min-width: 8ch;
    }
    table {
        min-width: min-content;
        border-collapse: collapse;
        padding: 0;
        width: 100%;
    }
</style>
