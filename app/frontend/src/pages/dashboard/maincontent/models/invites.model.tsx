export type InvitationReceived = {
	id: string;
	inviter: {
		id: string;
		username: string;
		avatar: string;
	};
	expiresAt: number;
	mode: number;
}
