import React from 'react';
import { useUserContext } from '../../UserContext';
import { getBlockedUsers, unblockUser } from '../../api/users';
import { UserBase } from '../../models/User';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
function BlocksList() {

	const [blocked, setBlocked] = React.useState<UserBase[]>([]);
	const { blockedUsers, setBlockedUsers } = useUserContext();

	React.useEffect(() => {
		const promise = getBlockedUsers().then((users) => {
			if (users.length > 0) {
				setBlockedUsers(users.map((user) => user.id));
			}
			setBlocked(users);
		  });
		  toast.promise(promise, {
			loading: "Loading...",
			success: "Loaded blocked users",
			error: "Error while loading blocked users",
		  });
		}, []);

		const unblock = async (id: number) => {
			const response = await unblockUser(id);
			if (response) {
				toast.error(response.message);
			} else {
				toast.success("User unblocked")
				setBlockedUsers(blockedUsers.filter((blocked: any) => blocked !== id));
				setBlocked(blocked.filter((user) => user.id !== id));
			}
		}

	return (
		<div className="w-3/4">
			<div className="flex flex-col p-4 rounded gap-20">
				<div className='min-w-min border p-5 rounded'>
					<div className=" flex flex-col mb-4">
						<label className="block pb-2">Blocked Users</label>
						<div className="relative overflow-auto mt-5">
							<div className="overflow-y-auto h-23relative rounded-md flex flex-col divide-y divide-slate-600">
							{blocked.map((user) => (
								<div key={user.id} className="flex items-center justify-between p-2 bg-slate-700 p-4">
									<div className="flex lg:flex-row md:flex-col justify-between ml-2 w-full">
										<div className="flex lg:flex-row md:flex-col items-center gap-2">
											<img src={user.avatar} className="h-8 w-8 rounded-full" alt="Avatar"/>
											<Link
												to={`/profile/${user.username}`}
												className="text-s font-medium text-white">
											 {user.username}
											</Link>
										</div>
										<button className="rounded-xl p-2 text-sm bg-blue-500 hover:bg-blue-600" onClick={() => unblock(user.id)}>
											Unblock
										</button>
									</div>
								</div>
							))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default BlocksList;
