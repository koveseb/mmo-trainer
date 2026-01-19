<script lang="ts">
	import { goto } from '$app/navigation';
	import Timer from '$lib/components/Timer.svelte';
	import EdgeTracker from '$lib/components/EdgeTracker.svelte';
	import { sessionStore, isSessionActive, sessionStats } from '$lib/stores/session';
	import { getLevelById } from '$lib/levels';
	import type { PhaseType } from '$lib/types';

	let timerRef = $state<Timer>();
	let running = $state(false);
	let currentLevel = $state(1);
	let showEndConfirm = $state(false);

	const level = $derived(getLevelById(currentLevel));

	async function loadSettings() {
		try {
			const res = await fetch('/api/settings');
			if (res.ok) {
				const settings = await res.json();
				currentLevel = settings.currentLevel;
			}
		} catch {
			// Use defaults
		}
	}

	$effect(() => {
		loadSettings();
	});

	function handleStart() {
		sessionStore.start(currentLevel);
		running = true;
	}

	function handlePause() {
		running = false;
		sessionStore.addPhase('rest');
	}

	function handleResume() {
		running = true;
		sessionStore.addPhase('stroke');
	}

	function handleEndRequest() {
		showEndConfirm = true;
	}

	async function handleEndConfirm() {
		running = false;
		const session = sessionStore.end();
		if (session) {
			try {
				await fetch('/api/sessions', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(session)
				});
			} catch (e) {
				console.error('Failed to save session:', e);
			}
		}
		sessionStore.clear();
		timerRef?.reset();
		showEndConfirm = false;
		goto('/history');
	}

	function handleEndCancel() {
		showEndConfirm = false;
	}

	function handleClimaxEnd() {
		handleEndRequest();
	}

	function handlePhaseChange(phase: PhaseType) {
		sessionStore.addPhase(phase);
	}
</script>

<svelte:head>
	<title>Train - MMO Trainer</title>
</svelte:head>

<div class="p-4 max-w-lg mx-auto">
	{#if !$isSessionActive}
		<div class="text-center space-y-8 pt-8">
			<h1 class="text-3xl font-bold text-white">Ready to Train</h1>
			<p class="text-slate-400">Level {level.id}: {level.name}</p>
			<p class="text-slate-500 text-sm">{level.description}</p>

		<button
			onclick={handleStart}
			class="w-full py-6 px-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 active:from-purple-700 active:to-violet-700 text-white font-bold text-2xl rounded-2xl transition-all shadow-lg shadow-purple-500/20"
		>
			START SESSION
		</button>

			<a href="/settings" class="block text-slate-400 hover:text-white transition-colors">
				Change level in settings
			</a>
		</div>
	{:else}
		<div class="space-y-6">
			<div class="flex justify-between items-center">
				<span class="text-slate-400">Level {level.id}</span>
				<span class="text-slate-400">{level.name}</span>
			</div>

			<Timer
				bind:this={timerRef}
				{running}
				strokeSeconds={level.strokeSeconds}
				restSeconds={level.restSeconds}
				onPhaseChange={handlePhaseChange}
			/>

		{#if $sessionStats}
			<div class="flex justify-center gap-4 text-center text-sm">
				<div class="flex items-center gap-1">
					<span class="text-slate-400">Edges:</span>
					<span class="font-bold text-white">{$sessionStats.totalEdges}</span>
				</div>
				<div class="flex items-center gap-1">
					<span class="text-slate-400">Climax:</span>
					<span class="font-bold text-green-500">{$sessionStats.successfulEdges}</span>
				</div>
				<div class="flex items-center gap-1">
					<span class="text-slate-400">Ejac:</span>
					<span class="font-bold text-red-500">{$sessionStats.ejaculatedEdges}</span>
				</div>
			</div>
		{/if}

			<EdgeTracker onClimaxEnd={handleClimaxEnd} />

		<div class="flex gap-3 pt-4">
			{#if running}
				<button
					onclick={handlePause}
					class="flex-1 py-6 px-4 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-bold text-2xl rounded-2xl transition-colors"
				>
					PAUSE
				</button>
			{:else}
				<button
					onclick={handleResume}
					class="flex-1 py-6 px-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 active:from-purple-700 active:to-violet-700 text-white font-bold text-2xl rounded-2xl transition-all"
				>
					RESUME
				</button>
			{/if}
			<button
				onclick={handleEndRequest}
				class="flex-1 py-6 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 font-bold text-2xl rounded-2xl transition-colors border border-slate-600"
			>
				END
			</button>
		</div>
		</div>
	{/if}
</div>

{#if showEndConfirm}
	<div class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
		<div class="bg-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
			<h2 class="text-xl font-bold text-white text-center">End Session?</h2>
			{#if $sessionStats}
				<div class="text-center text-slate-400">
					<p>{$sessionStats.totalEdges} edges ({$sessionStats.successfulEdges} climaxes)</p>
				</div>
			{/if}
			<div class="flex gap-3">
				<button
					onclick={handleEndCancel}
					class="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={handleEndConfirm}
					class="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
				>
					End
				</button>
			</div>
		</div>
	</div>
{/if}
