export function checkable(node) {
	
	function handleChange(e){
		 if (e.target.checked){
			 node.dispatchEvent( new CustomEvent('checked'))
		 }
		 else {
			 node.dispatchEvent( new CustomEvent('unchecked'));
		 };
	}
	
	node.addEventListener('change', handleChange);
	
	return {
		destroy() {
			node.removeEventListener('change', handleChange);
		}
	};
}