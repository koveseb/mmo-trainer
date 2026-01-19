<script lang="ts">
	import type { Session } from '$lib/types';
	import { getLevelById } from '$lib/levels';

	let sessions = $state<Session[]>([]);
	let loading = $state(true);
	let selectedSession = $state<Session | null>(null);

	async function loadSessions() {
		try {
			const res = await fetch('/api/sessions');
			if (res.ok) {
				sessions = await res.json();
			}
		} catch {
			// Handle error
		} finally {
			loading = false;
		}
	}

	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		if (mins === 0) return `${secs}s`;
		return `${mins}m ${secs}s`;
	}

	function formatDateTime(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function formatTime(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	$effect(() => {
		loadSessions();
	});
</script>

<svelte:head>
	<title>History - MMO Trainer</title>
</svelte:head>

<div class="p-4 max-w-lg mx-auto">
	<h1 class="text-2xl font-bold text-white mb-4">Session History</h1>

	{#if loading}
		<div class="text-center text-slate-400 py-8">Loading...</div>
	{:else if sessions.length === 0}
		<div class="text-center text-slate-400 py-8">
			<p>No sessions yet.</p>
			<a href="/train" class="text-green-500 hover:text-green-400 mt-2 inline-block">
				Start your first training
			</a>
		</div>
	{:else}
		<div class="space-y-3">
			{#each sessions as session}
				<button
					onclick={() => (selectedSession = session)}
					class="w-full text-left bg-slate-800 rounded-xl p-4 hover:bg-slate-700 transition-colors"
				>
					<div class="flex justify-between items-start">
						<div>
							<div class="text-white font-medium">{formatDateTime(session.startTime)}</div>
							<div class="text-sm text-slate-400 mt-1">
								Level {session.level} - {getLevelById(session.level).name}
							</div>
						</div>
						<div class="text-right">
							<div class="text-slate-300">
								{session.durationSeconds ? formatDuration(session.durationSeconds) : '-'}
							</div>
						</div>
					</div>
					<div class="flex gap-4 mt-2 text-sm">
						<span class="text-amber-500">{session.edgeEvents.length} edges</span>
						<span class="text-green-500">
							{session.edgeEvents.filter((e) => e.outcome === 'climax').length} climax
						</span>
						<span class="text-red-500">
							{session.edgeEvents.filter((e) => e.outcome === 'ejaculated').length} ejaculated
						</span>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if selectedSession}
	<div class="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 z-50">
		<div class="bg-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
			<div class="flex justify-between items-start mb-4">
				<h2 class="text-xl font-bold text-white">Session Details</h2>
				<button
					onclick={() => (selectedSession = null)}
					class="text-slate-400 hover:text-white p-1"
					aria-label="Close"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="space-y-4">
				<div class="bg-slate-700 rounded-xl p-3">
					<div class="text-sm text-slate-400">Date & Time</div>
					<div class="text-white">{formatDateTime(selectedSession.startTime)}</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="bg-slate-700 rounded-xl p-3">
						<div class="text-sm text-slate-400">Duration</div>
						<div class="text-white font-bold">
							{selectedSession.durationSeconds
								? formatDuration(selectedSession.durationSeconds)
								: '-'}
						</div>
					</div>
					<div class="bg-slate-700 rounded-xl p-3">
						<div class="text-sm text-slate-400">Level</div>
						<div class="text-white font-bold">
							{selectedSession.level} - {getLevelById(selectedSession.level).name}
						</div>
					</div>
				</div>

				<div class="grid grid-cols-3 gap-2">
					<div class="bg-slate-700 rounded-xl p-3 text-center">
						<div class="text-xl font-bold text-amber-500">{selectedSession.edgeEvents.length}</div>
						<div class="text-xs text-slate-400">Edges</div>
					</div>
					<div class="bg-slate-700 rounded-xl p-3 text-center">
						<div class="text-xl font-bold text-green-500">
							{selectedSession.edgeEvents.filter((e) => e.outcome === 'climax').length}
						</div>
						<div class="text-xs text-slate-400">Climax</div>
					</div>
					<div class="bg-slate-700 rounded-xl p-3 text-center">
						<div class="text-xl font-bold text-red-500">
							{selectedSession.edgeEvents.filter((e) => e.outcome === 'ejaculated').length}
						</div>
						<div class="text-xs text-slate-400">Ejaculated</div>
					</div>
				</div>

				{#if selectedSession.edgeEvents.length > 0}
					<div>
						<h3 class="text-sm font-bold text-slate-400 mb-2">Edge Events</h3>
						<div class="space-y-2">
							{#each selectedSession.edgeEvents as edge, i}
								<div class="bg-slate-700 rounded-lg p-3 flex justify-between items-center">
									<div>
										<span class="text-white">Edge #{i + 1}</span>
										<span class="text-slate-400 text-sm ml-2">
											{formatTime(edge.startTime)}
										</span>
									</div>
									<div class="flex items-center gap-2">
										{#if edge.durationSeconds}
											<span class="text-slate-300 text-sm">
												{formatDuration(edge.durationSeconds)}
											</span>
										{/if}
										{#if edge.outcome === 'climax'}
											<span
												class="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-bold"
											>
												CLIMAX
											</span>
										{:else if edge.outcome === 'ejaculated'}
											<span class="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold">
												EJACULATED
											</span>
										{:else}
											<span
												class="bg-slate-600 text-slate-300 text-xs px-2 py-1 rounded-full font-bold"
											>
												INCOMPLETE
											</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
