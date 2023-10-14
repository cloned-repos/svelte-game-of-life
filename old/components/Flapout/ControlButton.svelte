<script context="module" lang="ts">
	let pk = 0;
</script>

<script lang="ts">
	const id = `checkbtn:${++pk}`;
	export let value: string | number = 'check-btn' + id;
	export let initialChecked = false;
	export let group: string;
</script>

<input type="checkbox" {id} />
<label for={id}>
	<div>
		<!-- svelte-ignore a11y-missing-attribute -->
		<a class="pause">
			<div>
				<svg version="1.1" viewBox="0 0 58 58">
					<circle class="shaded" cx="29" cy="29" r="29" />
					<rect class="empress" x="32.66" y="16" width="8" height="26" /><rect
						class="empress"
						x="19.33"
						y="16"
						width="8"
						height="26"
					/>
				</svg>
			</div>
		</a>
	</div>
</label>

<style>
</style>
