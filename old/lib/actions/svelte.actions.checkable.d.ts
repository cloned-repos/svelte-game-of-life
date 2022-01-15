declare namespace svelte.JSX {
    interface HTMLAttributes<T> {
        onchecked?: (e: Event) => void;
        onunchecked?: (e: Event) => void;
    }
}