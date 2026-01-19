<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { PhaseType } from '$lib/types';
	import Metronome from './Metronome.svelte';

	interface Props {
		running?: boolean;
		strokeSeconds?: number;
		restSeconds?: number;
		onPhaseChange?: (phase: PhaseType) => void;
		onTick?: (elapsed: number) => void;
	}

	let {
		running = false,
		strokeSeconds = 120,
		restSeconds = 60,
		onPhaseChange,
		onTick
	}: Props = $props();

	let elapsed = $state(0);
	let currentPhase = $state<PhaseType>('stroke');
	let phaseTimeRemaining = $state(120);
	let interval: ReturnType<typeof setInterval> | null = null;
	let initialized = false;

	$effect(() => {
		if (!initialized) {
			phaseTimeRemaining = strokeSeconds;
			initialized = true;
		}
	});

	const phaseConfig: Record<PhaseType, { label: string; bgClass: string; textClass: string; hint: string }> = {
		stroke: {
			label: 'STROKE',
			bgClass: 'bg-purple-500/20 border-purple-500',
			textClass: 'text-purple-400',
			hint: 'Keep the rhythm'
		},
		rest: {
			label: 'REST',
			bgClass: 'bg-red-500/20 border-red-500',
			textClass: 'text-red-500',
			hint: 'Cool down, no touching'
		},
		edge: {
			label: 'EDGE',
			bgClass: 'bg-amber-500/20 border-amber-500',
			textClass: 'text-amber-500',
			hint: 'Hold it right there'
		}
	};

	$effect(() => {
		if (running && !interval) {
			interval = setInterval(() => {
				elapsed++;
				phaseTimeRemaining--;
				onTick?.(elapsed);

				if (phaseTimeRemaining <= 0) {
					transitionPhase();
				}
			}, 1000);
		} else if (!running && interval) {
			clearInterval(interval);
			interval = null;
		}
	});

	function transitionPhase() {
		if (currentPhase === 'stroke') {
			currentPhase = 'rest';
			phaseTimeRemaining = restSeconds;
		} else {
			currentPhase = 'stroke';
			phaseTimeRemaining = strokeSeconds;
		}
		onPhaseChange?.(currentPhase);
	}

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	function formatTime(seconds: number): string {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		if (hrs > 0) {
			return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function formatCountdown(seconds: number): string {
		const mins = Math.floor(Math.abs(seconds) / 60);
		const secs = Math.abs(seconds) % 60;
		const sign = seconds < 0 ? '+' : '';
		return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
	}

	export function reset() {
		elapsed = 0;
		currentPhase = 'stroke';
		phaseTimeRemaining = strokeSeconds;
	}

	export function getElapsed() {
		return elapsed;
	}

	export function getCurrentPhase() {
		return currentPhase;
	}

	export function setPhase(phase: PhaseType) {
		currentPhase = phase;
		if (phase === 'stroke') {
			phaseTimeRemaining = strokeSeconds;
		} else if (phase === 'rest') {
			phaseTimeRemaining = restSeconds;
		}
		onPhaseChange?.(phase);
	}

	export function skipPhase() {
		transitionPhase();
	}

	const config = $derived(phaseConfig[currentPhase]);
	const progressPercent = $derived(() => {
		const total = currentPhase === 'stroke' ? strokeSeconds : restSeconds;
		return Math.max(0, Math.min(100, ((total - phaseTimeRemaining) / total) * 100));
	});
</script>

<div class="space-y-3">
	<div
		class="relative rounded-xl border-2 p-4 transition-colors duration-300 {config.bgClass}"
	>
		<div
			class="absolute inset-0 rounded-xl opacity-30 transition-all duration-1000"
			style="background: linear-gradient(to right, currentColor {progressPercent()}%, transparent {progressPercent()}%)"
		></div>

		<div class="relative">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<span class="text-sm font-bold uppercase tracking-wider {config.textClass}">
						{config.label}
					</span>
					<span class="text-4xl font-mono font-bold text-white tabular-nums">
						{formatCountdown(phaseTimeRemaining)}
					</span>
					{#if phaseTimeRemaining <= 0}
						<span class="text-xs text-slate-400">overtime</span>
					{/if}
				</div>
				<span class="text-sm text-slate-400 tabular-nums">
					{formatTime(elapsed)}
				</span>
			</div>
			<div class="text-xs {config.textClass} opacity-80 mt-1">{config.hint}</div>
		</div>
	</div>

	<div class="flex justify-center gap-2">
		<button
			onclick={() => setPhase('stroke')}
			class="px-4 py-2 rounded-lg text-sm font-bold transition-colors
				{currentPhase === 'stroke'
				? 'bg-purple-500 text-white'
				: 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
		>
			Stroke
		</button>
		<button
			onclick={() => setPhase('rest')}
			class="px-4 py-2 rounded-lg text-sm font-bold transition-colors
				{currentPhase === 'rest'
				? 'bg-red-500 text-white'
				: 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
		>
			Rest
		</button>
		<button
			onclick={skipPhase}
			class="px-4 py-2 rounded-lg text-sm font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
		>
			Skip →
		</button>
	</div>

	<Metronome {running} />
</div>
