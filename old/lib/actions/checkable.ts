export function checkable(node: HTMLElement): SvelteActionReturnType {

	function handleChange(e: Event & { target: { checked: boolean } }) {
		
		if (e.target?.checked) {
			node.dispatchEvent(new CustomEvent('checked'))
		}
		else {
			node.dispatchEvent(new CustomEvent('unchecked'));
		}
	}

	node.addEventListener('change', handleChange as (e: Event) => void);

	return {
		destroy() {
			node.removeEventListener('change', handleChange as (e: Event) => void);
		}
	};
}


