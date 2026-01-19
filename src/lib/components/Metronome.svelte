<script lang="ts">
	import { onDestroy } from 'svelte';

	interface Props {
		running?: boolean;
		tempoStepInterval?: number;
		breakDurationMin?: number;
		breakDurationMax?: number;
	}

	let { 
		running = false, 
		tempoStepInterval = 20,
		breakDurationMin = 30,
		breakDurationMax = 45
	}: Props = $props();

	const tempos = [
		{ bpm: 0, label: 'Stop', color: 'bg-slate-500' },
		{ bpm: 40, label: 'Very Slow', color: 'bg-blue-500' },
		{ bpm: 60, label: 'Slow', color: 'bg-cyan-500' },
		{ bpm: 90, label: 'Medium', color: 'bg-green-500' },
		{ bpm: 120, label: 'Fast', color: 'bg-orange-500' },
		{ bpm: 160, label: 'Very Fast', color: 'bg-red-500' }
	];

	const progressionOrder = [1, 2, 3, 4, 5, 0];

	let currentTempoIndex = $state(1);
	let progressionStep = $state(0);
	let muted = $state(false);
	let beatActive = $state(false);
	let autoChange = $state(true);
	let interval: ReturnType<typeof setInterval> | null = null;
	let tempoChangeTimeout: ReturnType<typeof setTimeout> | null = null;
	let audioContext: AudioContext | null = null;

	const currentTempo = $derived(tempos[currentTempoIndex]);
	const intervalMs = $derived(currentTempo.bpm > 0 ? 60000 / currentTempo.bpm : 0);
	const isStopped = $derived(currentTempo.bpm === 0);

	function playClick() {
		if (muted || !audioContext) return;

		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.frequency.value = 880;
		oscillator.type = 'sine';

		gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

		oscillator.start(audioContext.currentTime);
		oscillator.stop(audioContext.currentTime + 0.1);
	}

	function beat() {
		beatActive = true;
		playClick();
		setTimeout(() => {
			beatActive = false;
		}, 100);
	}

	function getNextInterval(): number {
		const nextIndex = progressionOrder[progressionStep];
		if (nextIndex === 0) {
			return (breakDurationMin + Math.random() * (breakDurationMax - breakDurationMin)) * 1000;
		}
		return tempoStepInterval * 1000;
	}

	function scheduleTempoChange() {
		if (tempoChangeTimeout) {
			clearTimeout(tempoChangeTimeout);
			tempoChangeTimeout = null;
		}
		if (!autoChange || !running) return;

		const nextInterval = getNextInterval();
		
		tempoChangeTimeout = setTimeout(() => {
			progressionStep = (progressionStep + 1) % progressionOrder.length;
			currentTempoIndex = progressionOrder[progressionStep];
			scheduleTempoChange();
		}, nextInterval);
	}

	function startMetronome() {
		if (!audioContext) {
			audioContext = new AudioContext();
		}
		if (audioContext.state === 'suspended') {
			audioContext.resume();
		}
		if (!isStopped) {
			beat();
			interval = setInterval(beat, intervalMs);
		}
		scheduleTempoChange();
	}

	function stopMetronome() {
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
		if (tempoChangeTimeout) {
			clearTimeout(tempoChangeTimeout);
			tempoChangeTimeout = null;
		}
		beatActive = false;
	}

	$effect(() => {
		if (running) {
			stopMetronome();
			startMetronome();
		} else {
			stopMetronome();
		}
	});

	$effect(() => {
		if (running && interval) {
			stopMetronome();
			startMetronome();
		}
	});

	onDestroy(() => {
		stopMetronome();
		if (audioContext) {
			audioContext.close();
		}
	});

	function setTempo(index: number) {
		currentTempoIndex = index;
		const stepIndex = progressionOrder.indexOf(index);
		if (stepIndex !== -1) {
			progressionStep = stepIndex;
		}
		scheduleTempoChange();
	}

	function toggleMute() {
		muted = !muted;
	}

	function toggleAutoChange() {
		autoChange = !autoChange;
		if (autoChange && running) {
			scheduleTempoChange();
		} else if (!autoChange && tempoChangeTimeout) {
			clearTimeout(tempoChangeTimeout);
			tempoChangeTimeout = null;
		}
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<span class="text-sm text-slate-400 uppercase tracking-wider">Tempo</span>
		<div class="flex items-center gap-2">
			<button
				onclick={toggleAutoChange}
				class="p-2 rounded-lg transition-colors {autoChange ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-400'}"
				aria-label={autoChange ? 'Disable auto tempo change' : 'Enable auto tempo change'}
				title={autoChange ? 'Auto-change ON' : 'Auto-change OFF'}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
					<path d="M21 3v5h-5"></path>
				</svg>
			</button>
			<button
				onclick={toggleMute}
				class="p-2 rounded-lg transition-colors {muted ? 'bg-slate-700 text-slate-400' : 'bg-slate-700 text-white'}"
				aria-label={muted ? 'Unmute' : 'Mute'}
			>
			{#if muted}
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
					<line x1="23" y1="9" x2="17" y2="15"></line>
					<line x1="17" y1="9" x2="23" y2="15"></line>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
					<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
				</svg>
			{/if}
			</button>
		</div>
	</div>

	<div class="flex justify-center items-end h-24 pb-2">
		{#if isStopped}
			<div class="w-12 h-12 rounded-full bg-slate-500/20 border-2 border-slate-500 border-dashed flex items-center justify-center">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
					<rect x="6" y="6" width="12" height="12" rx="2"></rect>
				</svg>
			</div>
		{:else}
			<div
				class="w-12 h-12 rounded-full {currentTempo.color} shadow-lg"
				style="transform: translateY({beatActive ? '0px' : '-48px'}); transition: transform {beatActive ? '50ms' : `${Math.max(intervalMs - 100, 100)}ms`} {beatActive ? 'ease-in' : 'cubic-bezier(0.33, 1, 0.68, 1)'};"
			></div>
		{/if}
	</div>

	<div class="text-center">
		{#if isStopped}
			<div class="text-lg font-bold text-slate-400">Break</div>
			<div class="text-sm text-slate-500">Rest your hands ({breakDurationMin}-{breakDurationMax}s)</div>
		{:else}
			<span class="text-lg font-bold text-white">{currentTempo.bpm} BPM</span>
			<span class="text-slate-400 ml-2">({currentTempo.label})</span>
		{/if}
	</div>

	{#if autoChange}
		<div class="flex justify-center gap-1 pt-1">
			{#each progressionOrder as stepIndex, i}
				<div 
					class="w-2 h-2 rounded-full transition-all {i === progressionStep 
						? 'bg-purple-500 scale-125' 
						: i < progressionStep 
							? 'bg-purple-500/50' 
							: 'bg-slate-600'}"
				></div>
			{/each}
		</div>
	{/if}

	<div class="grid grid-cols-6 gap-2">
		{#each tempos as tempo, index}
			<button
				onclick={() => setTempo(index)}
				class="py-4 px-2 rounded-xl font-bold text-sm transition-all {currentTempoIndex === index
					? `${tempo.color} text-white scale-105`
					: 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
			>
				{#if tempo.bpm === 0}
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mx-auto" viewBox="0 0 24 24" fill="currentColor">
						<rect x="6" y="6" width="12" height="12" rx="2"></rect>
					</svg>
				{:else}
					{tempo.bpm}
				{/if}
			</button>
		{/each}
	</div>
</div>
