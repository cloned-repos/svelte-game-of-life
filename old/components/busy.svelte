<script>
	import Eliza from 'elizabot';
	import { beforeUpdate, afterUpdate } from 'svelte';
	import Flapout from './Flapout';

	let div;
	let autoscroll;

	beforeUpdate(() => {
		autoscroll = div && div.offsetHeight + div.scrollTop > div.scrollHeight - 20;
	});

	afterUpdate(() => {
		if (autoscroll) div.scrollTo(0, div.scrollHeight);
	});

	const eliza = new Eliza();

	let comments = [{ author: 'eliza', text: eliza.getInitial() }];

	function handleKeydown(event) {
		if (event.key !== 'Enter') {
			return;
		}
		const text = event.target.value;
		if (!text) return;

		comments = comments.concat({
			author: 'user',
			text
		});

		// clear for next user input
		event.target.value = '';

		const reply = eliza.transform(text);

		setTimeout(() => {
			// fake thinking of machine
			comments = comments.concat({
				author: 'eliza',
				text: '...'
			});
			const lastIdx = comments.length - 1;
			setTimeout(() => {
				comments.splice(lastIdx, 1, {
					author: 'eliza',
					text: reply
				});
			}, 0);
		}, 200 + Math.random() * 200);
	}
</script>

<div class="chat">
	<h1>Eliza</h1>

	<div class="scrollable" bind:this={div}>
		{#each comments as comment}
			<article class={comment.author}>
				<span>{comment.text}</span>
			</article>
		{/each}
	</div>

	<input on:keydown={handleKeydown} />
</div>

<style>
	.chat {
		display: flex;
		flex-direction: column;
		height: 100%;
		max-width: 320px;
	}

	.scrollable {
		flex: 1 1 auto;
		border-top: 1px solid #eee;
		margin: 0 0 0.5em 0;
		overflow-y: auto;
	}

	article {
		margin: 0.5em 0;
	}

	.user {
		text-align: right;
	}

	span {
		padding: 0.5em 1em;
		display: inline-block;
	}

	.eliza span {
		background-color: #eee;
		border-radius: 1em 1em 1em 0;
	}

	.user span {
		background-color: #0074d9;
		color: white;
		border-radius: 1em 1em 0 1em;
		word-break: break-all;
	}
</style>
