import React from 'react';
import { acceptFriendRequest, deleteFriendship, rejectFriendRequest } from '../../../api/friends';
import { FriendshipRequest } from '../../../models/Friend';
import { useUserContext } from '../../../UserContext';
import { Channel, ChannelRequest, ChannelRole } from '../../../models/Channel';
import { joinChannelById } from '../../../api/channels';
import { deleteUserInvitation } from '../../../api/users';
import { toast } from 'react-hot-toast';

type RequestItemProps = {
	request: FriendshipRequest;
	onClick: (request: FriendshipRequest, accept: boolean) => void;
};

function RequestItem({request, onClick}: RequestItemProps) {
	return (
<div className="flex my-2 w-full cursor-pointer items-center justify-between px-2 py-1 rounded hover:bg-gray-600 group">
	<div className="flex items-center">
		<div className="relative w-10 h-10 flex items-center justify-center">
		  <img className="w-9 h-9 rounded-full" src={request.avatar} alt="Avatar" />
		</div>
		<span className="mx-4">{request.username}</span>
	</div>
	<div className="flex space-x-2">
		{request.sender_id === request.user_id && <button className="rounded p-1 text-green-400 hover:bg-green-400 hover:text-white" onClick={() => onClick(request, true)}>
		<svg width="14" height="14" viewBox="0 0 48.00 48.00" version="1" xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 48 48">
			<g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"></polygon> </g>
		</svg>
		</button>}
		<button className="rounded p-1 text-red-400 hover:bg-red-400 hover:text-white" onClick={() => onClick(request, false)}>
			<svg aria-hidden="true" role="img" width="14" height="14" viewBox="0 0 24 24">
				<path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"></path>
			</svg>
		</button>
	</div>
</div>
	);
}

type ChannelRequestItemProps = {
	request: ChannelRequest;
	onClick: (request: ChannelRequest, accept: boolean) => void;
};

function ChannelRequestItem({request, onClick}: ChannelRequestItemProps) {
	return (
		<div className="flex my-2 w-full cursor-pointer items-center justify-between px-2 py-1 rounded hover:bg-gray-600 group">
			<div className="flex items-center">
				<div className="relative w-10 h-10 flex items-center justify-center">
					<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
						<g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M19.7225 3.20068C19.8334 2.80158 19.5997 2.38817 19.2006 2.27731C18.8015 2.16645 18.3881 2.40011 18.2773 2.79921L16.7632 8.24995H9.32006L10.7226 3.20068C10.8335 2.80158 10.5998 2.38817 10.2007 2.27731C9.80163 2.16645 9.38822 2.40011 9.27736 2.79921L7.76327 8.24995H4C3.58579 8.24995 3.25 8.58573 3.25 8.99995C3.25 9.41416 3.58579 9.74995 4 9.74995H7.3466L5.81882 15.2499H2C1.58579 15.2499 1.25 15.5857 1.25 15.9999C1.25 16.4142 1.58579 16.7499 2 16.7499H5.40216L4.27736 20.7992C4.1665 21.1983 4.40016 21.6117 4.79927 21.7226C5.19837 21.8334 5.61178 21.5998 5.72264 21.2007L6.95895 16.7499H9C9.41421 16.7499 9.75 16.4142 9.75 15.9999C9.75 15.5857 9.41421 15.2499 9 15.2499H7.37562L8.9034 9.74995H16.4872C16.5661 9.97261 16.7487 10.1546 16.9936 10.2226C17.376 10.3288 17.7715 10.1188 17.9015 9.74995H22C22.4142 9.74995 22.75 9.41416 22.75 8.99995C22.75 8.58573 22.4142 8.24995 22 8.24995H18.32L19.7225 3.20068Z"></path> <path fillRule="evenodd" clipRule="evenodd" d="M16.2132 11.2499H17.7868C18.5739 11.2499 19.2175 11.2499 19.7374 11.2994C20.2767 11.3506 20.7599 11.4603 21.1981 11.7289C21.6354 11.9969 22.0031 12.3645 22.2711 12.8018C22.5396 13.2401 22.6493 13.7233 22.7006 14.2625C22.75 14.7825 22.75 15.426 22.75 16.213V16.776C22.75 17.3363 22.75 17.7946 22.7245 18.1689C22.6981 18.5557 22.6419 18.9074 22.5026 19.2437C22.1728 20.04 21.5401 20.6727 20.7437 21.0026C20.2689 21.1993 19.7457 21.2348 19.1181 21.2456C18.8916 21.2495 18.7729 21.2523 18.6883 21.2617L18.6804 21.2626L18.6781 21.2658C18.6304 21.3312 18.5721 21.4281 18.4598 21.6179L18.1887 22.0759C17.6567 22.9746 16.3432 22.9746 15.8112 22.0759L15.5402 21.6179C15.4279 21.4281 15.3696 21.3312 15.3219 21.2658L15.3195 21.2626L15.3117 21.2617C15.2271 21.2523 15.1084 21.2495 14.8819 21.2456C14.2543 21.2348 13.7311 21.1993 13.2563 21.0026C12.4599 20.6727 11.8272 20.04 11.4974 19.2437C11.3581 18.9074 11.3019 18.5557 11.2755 18.1689C11.25 17.7946 11.25 17.3363 11.25 16.776V16.2131C11.25 15.4261 11.25 14.7825 11.2994 14.2625C11.3507 13.7233 11.4604 13.2401 11.7289 12.8018C11.9969 12.3645 12.3646 11.9969 12.8019 11.7289C13.2401 11.4603 13.7233 11.3506 14.2626 11.2994C14.7825 11.2499 15.4261 11.2499 16.2132 11.2499ZM14.4045 12.7926C13.9751 12.8335 13.7486 12.908 13.5856 13.0078C13.3502 13.1521 13.1522 13.3501 13.0079 13.5856C12.908 13.7485 12.8335 13.9751 12.7927 14.4045C12.7508 14.8451 12.75 15.4171 12.75 16.25V16.75C12.75 17.3427 12.7504 17.7496 12.772 18.0668C12.7932 18.3773 12.8322 18.5466 12.8832 18.6697C13.0608 19.0985 13.4015 19.4392 13.8303 19.6168C14.0158 19.6936 14.28 19.735 14.9077 19.7458L14.9335 19.7463C15.1236 19.7495 15.314 19.7528 15.4768 19.7708C15.6609 19.7912 15.8701 19.8354 16.0785 19.9566C16.2843 20.0763 16.4252 20.2329 16.5341 20.3823C16.6293 20.5129 16.7242 20.6734 16.8179 20.8317L17 21.1394L17.1821 20.8317C17.2758 20.6734 17.3707 20.5129 17.4659 20.3823C17.5748 20.2329 17.7156 20.0763 17.9215 19.9566C18.1298 19.8354 18.3391 19.7912 18.5232 19.7708C18.686 19.7528 18.8762 19.7495 19.0663 19.7463L19.0923 19.7458C19.72 19.735 19.9842 19.6936 20.1697 19.6168C20.5985 19.4392 20.9392 19.0985 21.1168 18.6697C21.1678 18.5466 21.2068 18.3773 21.228 18.0668C21.2496 17.7496 21.25 17.3427 21.25 16.75V16.25C21.25 15.4171 21.2492 14.8451 21.2073 14.4045C21.1665 13.9751 21.092 13.7485 20.9921 13.5856C20.8478 13.3501 20.6498 13.1521 20.4144 13.0078C20.2514 12.908 20.0249 12.8335 19.5955 12.7926C19.1549 12.7507 18.5829 12.7499 17.75 12.7499H16.25C15.4171 12.7499 14.8451 12.7507 14.4045 12.7926Z" fill="#858585"></path> </g>
					</svg>
				</div>
				<span className="mx-4">{request.channel_name}</span>
			</div>
			<div className="flex space-x-2">
			<button className="rounded p-1 text-green-400 hover:bg-green-400 hover:text-white" onClick={() => onClick(request, true)}>
				<svg width="14" height="14" viewBox="0 0 48.00 48.00" version="1" xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 48 48">
					<g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"></polygon> </g>
				</svg>
			</button>
				<button className="rounded p-1 text-red-400 hover:bg-red-400 hover:text-white" onClick={() => onClick(request, false)}>
					<svg aria-hidden="true" role="img" width="14" height="14" viewBox="0 0 24 24">
						<path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"></path>
					</svg>
				</button>
			</div>
		</div>
	);
}

function RequestsTab() {
	const {requests, setRequests} = useUserContext();
	const {friends , setFriends} = useUserContext();
	const {channels, setChannels} = useUserContext();

	const processRequest = async (request: FriendshipRequest, accept: boolean) => {
		let response: any;
		if (accept) {
			response = await acceptFriendRequest(request);
			request.presence = response.presence;
		} else {
			if (request.sender_id === request.user_id) {
				response = await rejectFriendRequest(request);
			} else {
				response = await deleteFriendship(request);
			}
		}
		if (response?.message) {
			toast.error(response.message)
			return;
		}
		if (accept) {
			setFriends([...friends!, request]);
		}
		setRequests(requests!.filter((r: any) => {
			if (r.user_id && r.id === request.id) {
				return false;
			}
			return true;
		}));
	}
	const processChannelRequest = async (request: ChannelRequest, accept: boolean) => {
		let response: any;
		if (accept) {
			response = await joinChannelById(request.channel_id, null);
		} else {
			response = await deleteUserInvitation(request.id);
		}
		if (response?.message) {
			toast.error(response.message);
			return;
		}
		if (accept) {
			const channel: Channel = {
				id: request.channel_id,
				name: request.channel_name,
				type: request.channel_type,
				hasUnread: true,
				role: ChannelRole.USER,
				muted_until: 0
			};
			setChannels([...channels!, channel]);
		}
		setRequests(requests!.filter((r: any) => {
			if (r.channel_id && r.id === request.id) {
				return false;
			}
			return true;
		}));
	}
	return (
		<div>
			<div className="flex justify-between items-center mb-2 p-1 h-8">
				<span className="text-white text-sm font-semibold px-3">Requests</span>
			</div>
			<hr className="h-px bg-gray-200 border-0 dark:bg-gray-700"/>
			{requests?.map((request: any) => (
				request.sender_id ? <RequestItem key={request.id} request={request} onClick={processRequest}/>
				: request.channel_id ? <ChannelRequestItem key={request.id} request={request} onClick={processChannelRequest}/> : null
			))}
		</div>
	);
}

export default RequestsTab;
