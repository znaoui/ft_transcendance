export class ChatResponse {
	success: boolean;
	error_message?: string;

	constructor(success: boolean, error_message?: string) {
		this.success = success;
		this.error_message = error_message;
	}
}
