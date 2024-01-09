import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { blockUser, getUserById, unblockUser } from "../../api/users";
import { useState } from "react";
import { useEffect } from "react";
import { Achievement, History } from "../../models/ProfileModel";
import { toast } from "react-hot-toast"
import { useUserContext } from "../../UserContext";
import { addFriendById } from "../../api/friends";
import { PresenceStatus } from "../../models/Friend";

function Profile(){
	const {id} = useParams();
	const [userData, setUser] = useState<any>(null);
	const navigate = useNavigate();
	const { user, friends, requests, blockedUsers, setBlockedUsers, setRequests } = useUserContext();

	useEffect(() => {
	  const fetchData = async () => {
		try {
		  setUser(null);
		  const userData = await getUserById(id);
		  if (userData) {
			const isFriend = friends.find((friend: any) => friend.user_id === userData.id) || requests.find((request: any) => request.user_id === userData.id);
		  	const isBlocked = blockedUsers.find((blocked: any) => blocked === userData.id);
			setUser({...userData, isFriend, isBlocked});
		  } else {
			throw new Error("User not found");
		  }
		} catch (error) {
		  toast.error("User not found");
		  navigate("/");
		}
	  };
	  fetchData();
	}, [id]);

	const addFriend = async () => {
		const response = await addFriendById(userData.id);
		if (response.message) {
			toast.error(response.message);
		} else {
			toast.success("Friend request sent")
			setRequests([...requests!, {
				id: response.id,
				user_id: response.user_id,
				username: response.username,
				avatar: response.avatar,
				sender_id: response.sender_id,
				sent: new Date(response.sent),
				hasUnread: false,
				presence: PresenceStatus.OFFLINE,
			}]);
			userData.isFriend = true;
		}
	}

	const blockUnBlock = async () => {
		if (userData.isBlocked) {
			const response = await unblockUser(userData.id);
			if (response) {
				toast.error(response.message);
			} else {
				toast.success("User unblocked")
				setBlockedUsers(blockedUsers.filter((blocked: any) => blocked !== userData.id));
				userData.isBlocked = false;
			}
		} else {
			const response = await blockUser(userData.id);
			if (response) {
				toast.error(response.message);
			} else {
				toast.success("User blocked")
				setBlockedUsers([...blockedUsers, userData.id]);
				setRequests(requests.filter((request: any) => request.user_id !== userData.id));
				userData.isBlocked = true;
			}
		}
	}

	const nbId = Number(id)

	return (!userData ?
		<div className="flex flex-col items-center justify-center h-screen">
			<div
			className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
			role="status">
			<span
			className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
			</div>
		</div>
		:
		<div className="flex h-full w-full flex-col justify-start gap-20 md:gap-14 overflow-hidden">
			<div className="flex flex-col md:flex-row items-center h-36 w-full justify-between gap-10 md:gap-0 pt-12 pr-16 pl-16">
				<div className="flex flex-row items-center gap-10 h-full  justify-start">
					<img src={userData.avatar} className="md:w-24 md:h-24 w-10 h-10 rounded-full" alt="Avatar"/>
					<div className="flex items-center space-y-1">
						<span className="md:text-xl text-md font-medium">{userData.username}</span>
					</div>
					{nbId !== user?.id && <div className="sm:block hidden flex flex-row items-center gap-2">
					{!userData.isFriend && !userData.isBlocked &&
						<button className="md:text-sm text-xs bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded-full"
							onClick={addFriend}>
							Friend request
						</button>}
						<button className={`md:text-sm text-xs ${userData.isBlocked ? 'bg-blue-400 hover:bg-blue-500' : 'bg-red-400 hover:bg-red-500'} text-white py-1 px-2 rounded-full`}
							onClick={blockUnBlock}>
							{userData.isBlocked ? "Unblock" : "Block"}
						</button>
				</div>}
				</div>
				{nbId !== user?.id && <div className="sm:hidden flex flex-row items-center gap-2">
					{!userData.isFriend && !userData.isBlocked &&
						<button className="md:text-sm text-xs bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded-full"
							onClick={addFriend}>
							Friend request
						</button>}
						<button className={`md:text-sm text-xs ${userData.isBlocked ? 'bg-blue-400 hover:bg-blue-500' : 'bg-red-400 hover:bg-red-500'} text-white py-1 px-2 rounded-full`}
							onClick={blockUnBlock}>
							{userData.isBlocked ? "Unblock" : "Block"}
						</button>
				</div>}
				<pre>
					Rank         : {userData.stats.rank}<br/>
					Game played  : {userData.stats.games_played}<br/>
					Win/Loose    : {userData.stats.games_won}/{userData.stats.games_lost}<br/>
					Win streak   : {userData.stats.win_streak}
				</pre>
			</div>
			<div className="w-full pl-10 pr-10 flex flex-col lg:flex-row gap-5 justify-around h-3/5">
				<div className="w-full lg:w-3/5 overflow-y-auto border bg-gray-700 min-w-96 overflow-x-auto">
					<table className="w-full divide-y divide-gray-200 rounded-full shadow-lg bg-gray-700">
						<thead className="sticky top-0 bg-gray-500 border-b">
							<tr className="flex flex-row justify-center">
								<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
									Match history
								</th>
							</tr>
						</thead>
						<tbody className="w-full bg-gray-700">
						{(userData.history as Array<History>).map((player, index) => {
							const isAborted = player.winner_id === null;
							const user = nbId === player.player1.id ? player.player1 : player.player2;
							const opponent = nbId === player.player1.id ? player.player2 : player.player1;
							if (isAborted){
								return (
									<tr key={index}className="flex flex-row justify-between h-14 border-b items-center pl-1  pr-2 bg-slate-600">
									<td className="flex flex-row items-center gap-1 w-1/3">
										<img src={opponent.avatar} className="hidden md:block h-10 w-10 rounded-full" alt="Avatar"/>
										<span>{opponent.username}</span>
									</td>
									<td className="text-center w-1/3">{opponent.score} - {user.score}</td>
									<td className="w-1/3 flex justify-end">Aborted</td>
								</tr>
								)
							} else {
								const winner = user.id === player.winner_id ? user : opponent;
								return (
									<tr key={index}
										className={`flex flex-row justify-between h-14 border-b items-center pl-1 pr-2 ${user.id === winner.id ? "bg-emerald-800" : "bg-red-800"}`}>
									<td className="flex flex-row items-center gap-1 w-1/3">
										<img src={opponent.avatar} className="hidden md:block h-10 w-10 rounded-full" alt="Avatar"/>
										<span>{opponent.username}</span>
									</td>
									<td className="text-center w-1/3">{opponent.score} - {user.score}</td>
									<td className="w-1/3 flex justify-end">{user.id === winner.id ? "Victory" : "Defeat"}</td>
								</tr>
								)
							}
						})}
						</tbody>
					</table>
				</div>
				<div className="w-full lg:w-2/6 overflow-y-auto border bg-gray-700">
				<table className="w-full divide-y divide-gray-200 rounded-full shadow-lg bg-gray-700">
						<thead className="sticky top-0 bg-gray-500 border-b">
							<tr className="flex flex-row justify-center">
							<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
								achievements
							</th>
							</tr>
						</thead>
						<tbody className="w-full bg-gray-700">
							{(userData.achievements as Array<Achievement>).map((achiev, index) =>(
								<tr key={index} className="flex flex-row justify-around h-16 border-b items-center pl-1 pr-2">
									<td>
										<img src={achiev.icon} className="h-8 w-8" alt="Avatar"/>
									</td>
									<td className="flex flex-col w-3/5 items-center text-center">
										<span className="text-sm">{achiev.name}</span>
										<span className="text-xs">{achiev.description}</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

		</div>
	)
}

export default Profile;

			// {historyArray.length === 0}?

			// 			{historyArray.map((player, index) =>(
			// 				<tr key={index} className="w-full">
			// 					<td className="flex px-6 py-4 whitespace-nowrap text-white">
			// 						{player.player1.username}
			// 					</td>
			// 				</tr>
			// 			))}
