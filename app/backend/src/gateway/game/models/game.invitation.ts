import { GameType } from "./game.payloads";

export type GameInviter = {
	id: number;
	username: string;
	avatar: string;
}

export type GameInvitation = {
	id: string;
	inviter: GameInviter;
	invitee_id: number;
	expiration: Date;
	mode: GameType;
}

export type GameInviteSent = {
	expiration?: number;
	success: boolean;
	error?: string;
}

export type InvitationResponsePayload = {
	invitation_id: string;
	accepted: boolean;
}
