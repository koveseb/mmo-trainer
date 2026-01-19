import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllSessions, saveSession, clearAllSessions } from '$lib/server/storage';
import type { Session } from '$lib/types';

export const GET: RequestHandler = async () => {
	const sessions = await getAllSessions();
	return json(sessions);
};

export const POST: RequestHandler = async ({ request }) => {
	const session: Session = await request.json();
	await saveSession(session);
	return json(session, { status: 201 });
};

export const DELETE: RequestHandler = async () => {
	await clearAllSessions();
	return json({ success: true });
};
