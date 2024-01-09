import React, { useState } from 'react';
import { useUserContext } from '../../UserContext';
import { Link, useNavigate } from 'react-router-dom';
import { unlogUser } from '../../api/auth';
function DisconnectButton() {
	const navigate = useNavigate();
	const handleDisconnect = () => {
		unlogUser();
		navigate('/login');
	};

	return (
		<li onClick={handleDisconnect} className='text-red-500 cursor-pointer'>
		  Disconnect
		</li>
	);
}

function TopBar() {
	const { user } = useUserContext();
	const [menu, setMenu] = useState(false);
	const navigate = useNavigate();

	const onBlur = () => {
		setTimeout(() => setMenu(false), 200);
	}

	if (menu === true){
		return (
			<div className="flex items-center justify-between bg-gray-700 p-1 w-full" onBlur={onBlur}>
				<div></div>
				<span className='text-xl cursor-pointer' onClick={() => navigate('/')}>{user!.username}</span>
				<div className="flex items-center space-x-4">
					<button onClick={() => setMenu(false)} className="rounded-full p-2">
						<img className="w-8 h-8 rounded-full" src={user!.avatar!} alt="Avatar" />
					</button>
					<div className='h-28 w-36 fixed top-14 right-0 bg-gray-700 rounded shadow-md shadow-neutral-600'>
						<ul className='list-none flex flex-col w-full h-full items-center pt-2 gap-2'>
							<li><Link to ={`/profil/${user?.id}`} onClick={() => setMenu(false)}>My profile</Link></li>
							<li><Link to="/setting" onClick={() => setMenu(false)}>Account settings</Link></li>
							<DisconnectButton />
						</ul>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex items-center justify-between bg-gray-700 p-1 w-full ">
			<div></div>
			<span className='text-xl cursor-pointer' onClick={() => navigate('/')}>{user!.username}</span>
			<div className="flex items-center space-x-4">
				<button onClick={() => setMenu(true)} className="rounded-full p-2">
					<img className="w-8 h-8 rounded-full" src={user!.avatar!} alt="Avatar" />
				</button>
			</div>
		</div>
	);
}

export default TopBar;
