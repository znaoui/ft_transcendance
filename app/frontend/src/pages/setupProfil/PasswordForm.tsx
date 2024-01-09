import React from "react";
import { useUserContext } from "../../UserContext"
import { useState, ChangeEvent, FormEvent  } from "react";
import { changePassword } from "../../api/users";
import { ChangePassModel } from "../../models/User";


function PasswordForm(){

	const [password, setPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [response, setResponse] = useState<ChangePassModel>({
		error:'',
		statusCode: 0,
		message: ''
	})
	const username: string = useUserContext().user?.username ?? "";
	async function getResponse () {
		const locresponse = await changePassword(username, password, newPassword, confirmPassword)
		setResponse(locresponse)
	}

	const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
		setPassword(e.target.value);
	};
  
	const handleNewPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
		setNewPassword(e.target.value);
	};
  
	const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
		setConfirmPassword(e.target.value);
	};
  
	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		getResponse();
		setPassword('');
		setConfirmPassword('');
		setNewPassword('');
	};

	return(
		<div className="mt-8 w-2/4 ">
			<form className=" min-w-min p-5 rounded border" onSubmit={handleSubmit}>
				<div className="mb-4 ">
					<label className="block pb-4">Change password:</label>
					{response === null ?
					<span className="text-emerald-400">Password changed</span> : (response.statusCode !== 0 ?
					<span className="text-red-500">{response.message}</span>  : null) }
					<div className="pt-2 rounded">
						<label className="block mb-2">Password:</label>
						<input
							type="password"
							className="w-full border p-2 rounded text-black"
							placeholder="Actual password"
							value={password}
							onChange={handlePasswordChange}/>
						<label className="block mb-2 mt-4">New Password:</label>
						<input
							type="password"
							className="w-full border p-2 rounded text-black"
							placeholder="New password"
							value={newPassword}
							onChange={handleNewPasswordChange}/>
						<label className="block mb-2 mt-4">Confirme Password:</label>
						<input
							type="password"
							className="w-full border p-2 rounded text-black"
							placeholder="Confirmer password"
							value={confirmPassword}
							onChange={handleConfirmPasswordChange}/>
					</div>
					<button
						type="submit"
						className="mt-2 px-4 py-2 ml-2 bg-blue-500 rounded hover:bg-blue-600">
						Valider
					</button>
				</div>
			</form>
		</div>
	)
}

export default PasswordForm