const loginUser = async(username: string, password: string) => {
	const result = await fetch('/api/auth/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({username, password})
	})
	return result;
}

const registerUser = async(username: string, password: string, confirm_password: string) => {
	const result = await fetch('/api/auth/register', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({username, password, confirm_password})
	})
	return result;
}

const unlogUser = async() => {
	const result = await fetch('api/auth/logout', {
		method: "POST"
	})
}

const generateTotpSecret = async() => {
	const result = await fetch('/api/auth/totp/generate', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
	})
	const data = await result.json();
	return data;
}

const setupTotp = async(secret: string, token: string) => {
	const result = await fetch('/api/auth/totp/setup', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({secret, token})
	})
	if (!result.ok) {
		const data = await result.json();
		return data;
	}
	return null;
}

const disableTotp = async() => {
	const result = await fetch('/api/auth/totp/disable', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
	})
	if (!result.ok) {
		const data = await result.json();
		return data;
	}
	return null;
}

const authVerifyTotp = async(token: string) => {
	const result = await fetch('/api/auth/totp/verify', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({token})
	})
	if (!result.ok) {
		const data = await result.json();
		return data;
	}
	return null;
}

export {
	loginUser,
	registerUser,
	unlogUser,
	generateTotpSecret,
	setupTotp,
	disableTotp,
	authVerifyTotp
}
