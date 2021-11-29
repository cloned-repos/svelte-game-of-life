

<script>

</script>

<a  href on:click|stopPropagation class:stop={true}>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 58 58">
            <circle class="shaded" cx="29" cy="29" r="29" />
            <g>
                <rect class="empress" x="16" y="16" width="26" height="26" />
                <path class="empress" d="M43,43H15V15h28V43z M17,41h24V17H17V41z" />
            </g>
        </svg>
</a>

<style>
    * {
        box-sizing: border-box;
    }

    a {
        user-select: none;
        display: inline-block;
        width: 100%;
        height: 100%;
        font-size: 0;
        color: inherit;
        text-decoration: none;
        overflow: hidden;
    }

    a svg {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    }

    a.stop:active {
            .shaded {
                fill: rgb(79, 91, 193);
                fill-opacity: 0.9;
            }

            .empress {
                fill: rgb(40, 17, 46);
                fill-opacity: 0.5;
            }
        }

        a.stop div {
            display: inline-block;
        }

        a.stop div {
            width: 30px;
            height: 30px;
            left: 0;
            right: 0;

            svg {
                width: 100%;
                height: 100%;

                .shaded {
                    fill: rgb(79, 91, 193);
                    fill-opacity: 0.3;
                }

                .empress {
                    fill: rgb(79, 91, 193);
                    fill-opacity: 0.7;
                }
            }
        }
        
        a.stop:active {
            .shaded {
                fill: rgb(79, 91, 193);
                fill-opacity: 0.9;
            }

            .empress {
                fill: rgb(40, 17, 46);
                fill-opacity: 0.5;
            }
        }
</style>