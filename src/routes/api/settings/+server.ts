import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSettings, saveSettings } from '$lib/server/storage';
import type { Settings } from '$lib/types';

export const GET: RequestHandler = async () => {
	const settings = await getSettings();
	return json(settings);
};

export const PUT: RequestHandler = async ({ request }) => {
	const settings: Settings = await request.json();
	await saveSettings(settings);
	return json(settings);
};
