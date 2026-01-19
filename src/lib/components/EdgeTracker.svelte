<script lang="ts">
	import { sessionStore, currentEdge } from '$lib/stores/session';

	interface Props {
		onClimaxEnd?: () => void;
	}

	let { onClimaxEnd }: Props = $props();

	let edgeStartTime = $state<Date | null>(null);
	let edgeDuration = $state(0);
	let edgeInterval: ReturnType<typeof setInterval> | null = null;

	$effect(() => {
		const edge = $currentEdge;
		if (edge && !edgeInterval) {
			edgeStartTime = new Date(edge.startTime);
			edgeInterval = setInterval(() => {
				if (edgeStartTime) {
					edgeDuration = Math.floor((Date.now() - edgeStartTime.getTime()) / 1000);
				}
			}, 100);
		} else if (!edge && edgeInterval) {
			clearInterval(edgeInterval);
			edgeInterval = null;
			edgeDuration = 0;
			edgeStartTime = null;
		}
	});

	function handleAtNine() {
		sessionStore.startEdge();
	}

	function handleClimax() {
		const edge = $currentEdge;
		if (edge) {
			sessionStore.endEdge(edge.id, 'climax');
		}
	}

	function handleEjaculated() {
		const edge = $currentEdge;
		if (edge) {
			sessionStore.endEdge(edge.id, 'ejaculated');
		}
		onClimaxEnd?.();
	}

	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div class="space-y-4">
	{#if !$currentEdge}
		<button
			onclick={handleAtNine}
			class="w-full py-6 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:from-amber-600 active:to-orange-600 text-black font-bold rounded-2xl transition-all shadow-lg"
		>
			<div class="text-3xl">AT 9</div>
			<div class="text-sm font-medium opacity-80">Tap when you reach the edge</div>
		</button>
	{:else}
		<div class="bg-amber-500/20 border-2 border-amber-500 rounded-2xl p-4 text-center">
			<div class="text-amber-500 font-bold text-lg mb-1">EDGING</div>
			<div class="text-4xl font-mono font-bold text-white tabular-nums">
				{formatDuration(edgeDuration)}
			</div>
			<div class="text-sm text-amber-400/80 mt-1">Hold steady...</div>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<button
				onclick={handleClimax}
				class="py-6 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 active:from-green-700 active:to-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg"
			>
				<div class="text-2xl">CLIMAX</div>
				<div class="text-xs font-medium opacity-80">Controlled release</div>
			</button>
			<button
				onclick={handleEjaculated}
				class="py-6 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:from-red-700 active:to-rose-700 text-white font-bold rounded-2xl transition-all shadow-lg"
			>
				<div class="text-2xl">EJACULATED</div>
				<div class="text-xs font-medium opacity-80">Lost control</div>
			</button>
		</div>
	{/if}
</div>
