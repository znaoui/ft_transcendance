import React, { useState } from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { changeUsername } from '../../api/users';
import { changeProfilPicture } from '../../api/users';
import { useUserContext } from '../../UserContext';

function ModifyProfil() {
	const { user, setUser } = useUserContext();
	const [username, setUsername] = useState('');
	const [selectedImage, setSelectedImage] = useState<ChangeEvent<HTMLInputElement>>();
	const [whichButton, setWhichButton] = useState('');
	const [submited, setSubmited] = useState(false);
	const [error, setError] = useState<string>('');

	const handleUsernameChange = (e : ChangeEvent<HTMLInputElement>) => {
		setUsername(e.target.value);
	};

	const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			setSelectedImage(e);
		}
	};

	function buttonClic(target : string){
		setWhichButton(target);
	}

	async function  handleSubmit(e : FormEvent<HTMLFormElement>){
		e.preventDefault();
		let response;
		setSubmited(false);
		setError('');
		if (whichButton === "Name" && username.trim().length > 0) {
			response = await changeUsername(username);
			if (!response) {
				setUser({...user!, username: username});
			} else {
				setError(response.message);
			}
			setSubmited(true);
			setUsername('');
		} else if (whichButton === "Photo" && selectedImage) {
			response = await changeProfilPicture(selectedImage);
			if (response.path){
				setUser({...user!, avatar: response.path})
			} else {
				setError(response.message);
			}
			setSubmited(true);
			setSelectedImage(undefined);
		}
	}

	return (
		<div className="w-2/4">

			<form className="flex flex-col p-4 rounded gap-20" onSubmit={handleSubmit}>
				<div className='min-w-min border p-5 rounded'>
					<div className=" flex flex-col mb-4">
						<label className="block pb-2">Change Username:</label>
						{whichButton === "Name" && submited ? (!error ?
							<span className='pb-2 text-emerald-500'>Username changed</span> :
							<span className='pb-2 text-red-500'>{error}</span>)
						: null}
						<input
						type="text"
						className="w-full border p-2 rounded text-black"
						placeholder={user!.username}
						value={username}
						onChange={handleUsernameChange}
						/>
					</div>
					<button type="submit" onClick={() => buttonClic("Name")} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
						Submit
					</button>
				</div>
				<div className='min-w-min border p-5 rounded'>
					<div className="mb-4">
						<div className='flex flex-col'>
							<label className="block mb-2">Update Avatar:</label>
							{whichButton === "Photo" && submited ? (error ?
								<span className='pb-2 text-red-400'>{error}</span> :
								<span className='pb-2 text-emerald-500'>Avatar changed</span>)
								: null}
							<input
								type="file"
								accept="image/*"
								className="w-full border p-2 rounded"
								onChange={handleImageChange}
								/>
						</div>
					</div>
					<button type="submit" onClick={() => buttonClic("Photo")} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
						Submit
					</button>
				</div>
			</form>
		</div>
	  );
}

export default ModifyProfil;

