import React, { useState } from 'react';
import { useUserContext } from '../../../UserContext';
import { Channel, ChannelRole } from '../../../models/Channel';
import { createChannel, joinChannel, leaveChannel } from '../../../api/channels';
import { toast } from 'react-hot-toast';

type ChannelItemProps = {
	channel: Channel;
	onClick: () => void;
	onDeleteClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, channel: Channel) => void;
};

const ChannelItemMemo = React.memo(ChannelItem, (prevProps, nextProps) => {
	return prevProps.channel.id === nextProps.channel.id
	 && prevProps.channel.name === nextProps.channel.name
	 && prevProps.channel.hasUnread === nextProps.channel.hasUnread;
});

function ChannelItem({channel, onClick, onDeleteClick}: ChannelItemProps) {
	return (
		<div onClick={onClick} className="truncate flex my-2 w-full items-center cursor-pointer justify-between px-2 py-1 rounded hover:bg-gray-600 group">
			<div className="flex items-center">
			<div className="relative w-10 h-10 text-white flex items-center justify-center">
					<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
						<g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M19.7225 3.20068C19.8334 2.80158 19.5997 2.38817 19.2006 2.27731C18.8015 2.16645 18.3881 2.40011 18.2773 2.79921L16.7632 8.24995H9.32006L10.7226 3.20068C10.8335 2.80158 10.5998 2.38817 10.2007 2.27731C9.80163 2.16645 9.38822 2.40011 9.27736 2.79921L7.76327 8.24995H4C3.58579 8.24995 3.25 8.58573 3.25 8.99995C3.25 9.41416 3.58579 9.74995 4 9.74995H7.3466L5.81882 15.2499H2C1.58579 15.2499 1.25 15.5857 1.25 15.9999C1.25 16.4142 1.58579 16.7499 2 16.7499H5.40216L4.27736 20.7992C4.1665 21.1983 4.40016 21.6117 4.79927 21.7226C5.19837 21.8334 5.61178 21.5998 5.72264 21.2007L6.95895 16.7499H9C9.41421 16.7499 9.75 16.4142 9.75 15.9999C9.75 15.5857 9.41421 15.2499 9 15.2499H7.37562L8.9034 9.74995H16.4872C16.5661 9.97261 16.7487 10.1546 16.9936 10.2226C17.376 10.3288 17.7715 10.1188 17.9015 9.74995H22C22.4142 9.74995 22.75 9.41416 22.75 8.99995C22.75 8.58573 22.4142 8.24995 22 8.24995H18.32L19.7225 3.20068Z"></path> <path fillRule="evenodd" clipRule="evenodd" d="M16.2132 11.2499H17.7868C18.5739 11.2499 19.2175 11.2499 19.7374 11.2994C20.2767 11.3506 20.7599 11.4603 21.1981 11.7289C21.6354 11.9969 22.0031 12.3645 22.2711 12.8018C22.5396 13.2401 22.6493 13.7233 22.7006 14.2625C22.75 14.7825 22.75 15.426 22.75 16.213V16.776C22.75 17.3363 22.75 17.7946 22.7245 18.1689C22.6981 18.5557 22.6419 18.9074 22.5026 19.2437C22.1728 20.04 21.5401 20.6727 20.7437 21.0026C20.2689 21.1993 19.7457 21.2348 19.1181 21.2456C18.8916 21.2495 18.7729 21.2523 18.6883 21.2617L18.6804 21.2626L18.6781 21.2658C18.6304 21.3312 18.5721 21.4281 18.4598 21.6179L18.1887 22.0759C17.6567 22.9746 16.3432 22.9746 15.8112 22.0759L15.5402 21.6179C15.4279 21.4281 15.3696 21.3312 15.3219 21.2658L15.3195 21.2626L15.3117 21.2617C15.2271 21.2523 15.1084 21.2495 14.8819 21.2456C14.2543 21.2348 13.7311 21.1993 13.2563 21.0026C12.4599 20.6727 11.8272 20.04 11.4974 19.2437C11.3581 18.9074 11.3019 18.5557 11.2755 18.1689C11.25 17.7946 11.25 17.3363 11.25 16.776V16.2131C11.25 15.4261 11.25 14.7825 11.2994 14.2625C11.3507 13.7233 11.4604 13.2401 11.7289 12.8018C11.9969 12.3645 12.3646 11.9969 12.8019 11.7289C13.2401 11.4603 13.7233 11.3506 14.2626 11.2994C14.7825 11.2499 15.4261 11.2499 16.2132 11.2499ZM14.4045 12.7926C13.9751 12.8335 13.7486 12.908 13.5856 13.0078C13.3502 13.1521 13.1522 13.3501 13.0079 13.5856C12.908 13.7485 12.8335 13.9751 12.7927 14.4045C12.7508 14.8451 12.75 15.4171 12.75 16.25V16.75C12.75 17.3427 12.7504 17.7496 12.772 18.0668C12.7932 18.3773 12.8322 18.5466 12.8832 18.6697C13.0608 19.0985 13.4015 19.4392 13.8303 19.6168C14.0158 19.6936 14.28 19.735 14.9077 19.7458L14.9335 19.7463C15.1236 19.7495 15.314 19.7528 15.4768 19.7708C15.6609 19.7912 15.8701 19.8354 16.0785 19.9566C16.2843 20.0763 16.4252 20.2329 16.5341 20.3823C16.6293 20.5129 16.7242 20.6734 16.8179 20.8317L17 21.1394L17.1821 20.8317C17.2758 20.6734 17.3707 20.5129 17.4659 20.3823C17.5748 20.2329 17.7156 20.0763 17.9215 19.9566C18.1298 19.8354 18.3391 19.7912 18.5232 19.7708C18.686 19.7528 18.8762 19.7495 19.0663 19.7463L19.0923 19.7458C19.72 19.735 19.9842 19.6936 20.1697 19.6168C20.5985 19.4392 20.9392 19.0985 21.1168 18.6697C21.1678 18.5466 21.2068 18.3773 21.228 18.0668C21.2496 17.7496 21.25 17.3427 21.25 16.75V16.25C21.25 15.4171 21.2492 14.8451 21.2073 14.4045C21.1665 13.9751 21.092 13.7485 20.9921 13.5856C20.8478 13.3501 20.6498 13.1521 20.4144 13.0078C20.2514 12.908 20.0249 12.8335 19.5955 12.7926C19.1549 12.7507 18.5829 12.7499 17.75 12.7499H16.25C15.4171 12.7499 14.8451 12.7507 14.4045 12.7926Z" fill="#858585"></path> </g>
					</svg>
				{channel.hasUnread &&
					<div className="absolute inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-1 -right-1 dark:border-gray-800">!</div>}
				</div>
				<span className="mx-4">{channel!.name}</span>
			</div>
			<button title="Delete" className="rounded p-1 text-gray-400 content-end opacity-0 group-hover:opacity-100 hover:text-white" onClick={(e) => onDeleteClick(e, channel)}>
					<svg aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"></path></svg>
			</button>
		</div>
	);
}

type ChannelModalProps = {
	closeModal: () => void;
};

function JoinChannelModalContent({closeModal}: ChannelModalProps) {
	const [error, setError] = useState(null);
	const [channelName, setChannelName] = useState('');
	const [requiresPassword, setRequiresPassword] = useState(false);
	const [channelPassword, setChannelPassword] = useState('');
	const {channels, setChannels, requests, setRequests} = useUserContext();
	const joinNewChannel = async () => {
		if (!channelName) {
			return;
		}
		const response = await joinChannel(channelName, channelPassword);
		if (response.message) {
			setError(response.message);
			return;
		}
		const newChannel = {
			id: response.id,
			type: response.type,
			name: response.name,
			role: ChannelRole.USER,
			hasUnread: false,
			muted_until: 0,
		};
		setChannels([...channels, newChannel]);
		const newRequests = requests.filter((r: any) => r.channel_id !== response.id);
		setRequests(newRequests);
		closeModal();
	};
	const togglePassword = () => {
		setChannelPassword('');
		setRequiresPassword(!requiresPassword);
	}
	return (
		<div className="space-y-3">
			<div>
				<label htmlFor='channel-name' className="block mb-2 text-white text-sm font-semibold">Channel Name</label>
				<input
					id="channel-name"
					type="text"
					placeholder="my_channel"
					className="p-2 w-full border text-white rounded-md w-full text-black bg-gray-600"
					value={channelName}
					onChange={(e) => setChannelName(e.target.value)}/>
			</div>
			<div className="flex items-center mb-4">
				<input type="checkbox" checked={requiresPassword} onChange={togglePassword} className='accent-blue-500'/>
				<label htmlFor="default-checkbox" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Requires password</label>
			</div>
			{requiresPassword && <div>
				<label htmlFor='channel-password' className="block mb-2 text-white text-sm font-semibold">Channel Password</label>
				<input
					id="channel-password"
					type="password"
					placeholder="********"
					className="p-2 w-full border text-white rounded-md w-full text-black bg-gray-600"
					value={channelPassword}
					onChange={(e) => setChannelPassword(e.target.value)}/>
			</div>}
			{error && <div className="text-center"> <span className="text-red-400 text-sm">{error}</span></div>}
			<button className="p-2 w-full bg-blue-500 text-white rounded-md" onClick={joinNewChannel}>
				Join Channel
			</button>
		</div>
	)
}

function CreateChannelModalContent({closeModal}: ChannelModalProps) {
	const {channels, setChannels} = useUserContext();
	const [error, setError] = useState(null);
	const [channelName, setChannelName] = useState('');
	const [channelType, setChannelType] = useState(0);
	const [channelPassword, setChannelPassword] = useState<string>('');
	const onTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setChannelType(Number(e.target.value));
	}
	const createNewChannel = async () => {
		if (!channelName || (channelType === 2 && !channelPassword)) {
			return;
		}
		const response = await createChannel(channelName, channelType, channelPassword);
		if (response.message) {
			setError(response.message);
			return;
		}
		const newChannel = {
			id: response.id,
			type: channelType,
			name: channelName,
			role: ChannelRole.OWNER,
			hasUnread: false,
			muted_until: 0,
		};
		setChannels([...channels, newChannel]);
		closeModal();
	};
	return (
		<div className="space-y-5">
			<div>
				<label htmlFor='channel-name' className="block mb-2 text-white text-sm font-semibold">Channel Name</label>
				<input
					id="channel-name"
					type="text"
					placeholder="my_channel"
					className="p-2 w-1/2 border text-white rounded-md w-full text-black bg-gray-600"
					value={channelName}
					onChange={(e) => setChannelName(e.target.value)}/>
			</div>
		<div>
		<label htmlFor='channel-type' className="block mb-2 text-white text-sm font-semibold">Channel Type</label>
		<ul id="channel-type" className="grid w-full gap-6 md:grid-cols-3">
		<li>
				<input type="radio"
					id="public-channel"
					value="0"
					className="hidden peer"
					checked={channelType === 0}
					onChange={onTypeChange}
					required/>
				<label htmlFor='public-channel' className="inline-flex items-center justify-between w-full p-4 text-gray-300 border border-gray-300 rounded-lg cursor-pointer hover:text-gray-300 peer-checked:border-blue-400 peer-checked:text-blue-400 hover:text-gray-600">
					<div className="block">
						<svg width="45" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M3 18C3 15.3945 4.66081 13.1768 6.98156 12.348C7.61232 12.1227 8.29183 12 9 12C9.70817 12 10.3877 12.1227 11.0184 12.348C11.3611 12.4703 11.6893 12.623 12 12.8027C12.3107 12.623 12.6389 12.4703 12.9816 12.348C13.6123 12.1227 14.2918 12 15 12C15.7082 12 16.3877 12.1227 17.0184 12.348C19.3392 13.1768 21 15.3945 21 18V21H15.75V19.5H19.5V18C19.5 15.5147 17.4853 13.5 15 13.5C14.4029 13.5 13.833 13.6163 13.3116 13.8275C14.3568 14.9073 15 16.3785 15 18V21H3V18ZM9 11.25C8.31104 11.25 7.66548 11.0642 7.11068 10.74C5.9977 10.0896 5.25 8.88211 5.25 7.5C5.25 5.42893 6.92893 3.75 9 3.75C10.2267 3.75 11.3158 4.33901 12 5.24963C12.6842 4.33901 13.7733 3.75 15 3.75C17.0711 3.75 18.75 5.42893 18.75 7.5C18.75 8.88211 18.0023 10.0896 16.8893 10.74C16.3345 11.0642 15.689 11.25 15 11.25C14.311 11.25 13.6655 11.0642 13.1107 10.74C12.6776 10.4869 12.2999 10.1495 12 9.75036C11.7001 10.1496 11.3224 10.4869 10.8893 10.74C10.3345 11.0642 9.68896 11.25 9 11.25ZM13.5 18V19.5H4.5V18C4.5 15.5147 6.51472 13.5 9 13.5C11.4853 13.5 13.5 15.5147 13.5 18ZM11.25 7.5C11.25 8.74264 10.2426 9.75 9 9.75C7.75736 9.75 6.75 8.74264 6.75 7.5C6.75 6.25736 7.75736 5.25 9 5.25C10.2426 5.25 11.25 6.25736 11.25 7.5ZM15 5.25C13.7574 5.25 12.75 6.25736 12.75 7.5C12.75 8.74264 13.7574 9.75 15 9.75C16.2426 9.75 17.25 8.74264 17.25 7.5C17.25 6.25736 16.2426 5.25 15 5.25Z" fill="currentColor"></path> </g>
						</svg>
						<div className="w-full text-left font-semibold">Public</div>
						<div className="w-full text-sm">Everybody can join your channel</div>
					</div>
				</label>
			</li>
			<li>
				<input type="radio"
					id="private-channel"
					value="1"
					className="hidden peer"
					checked={channelType === 1}
					onChange={onTypeChange}
					required/>
					<label htmlFor='private-channel' className="inline-flex items-center justify-between w-full p-4 text-gray-300 border border-gray-300 rounded-lg cursor-pointer hover:text-gray-300 peer-checked:border-blue-400 peer-checked:text-blue-400 hover:text-gray-600">
					<div className="block">
					<svg width="45" height="50" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12C22 15.7712 22 17.6569 20.8284 18.8284C19.6569 20 17.7712 20 14 20H10C6.22876 20 4.34315 20 3.17157 18.8284C2 17.6569 2 15.7712 2 12Z" stroke="currentColor" strokeWidth="1.5"></path> <path d="M6 8L8.1589 9.79908C9.99553 11.3296 10.9139 12.0949 12 12.0949C13.0861 12.0949 14.0045 11.3296 15.8411 9.79908L18 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path> </g>
					</svg>
						<div className="w-full text-left font-semibold">Private</div>
						<div className="w-full text-sm">On invitation</div>
					</div>
				</label>
			</li>
			<li>
				<input type="radio"
						id="protected-channel"
						value="2"
						className="hidden peer"
						checked={channelType === 2}
						onChange={onTypeChange}
						required/>
					<label htmlFor='protected-channel' className="inline-flex items-center justify-between w-full p-4 text-gray-300 border border-gray-300 rounded-lg cursor-pointer hover:text-gray-300 peer-checked:border-blue-400 peer-checked:text-blue-400 hover:text-gray-600">
					<div className="block">
					<svg width="45" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 14.5V16.5M7 10.0288C7.47142 10 8.05259 10 8.8 10H15.2C15.9474 10 16.5286 10 17 10.0288M7 10.0288C6.41168 10.0647 5.99429 10.1455 5.63803 10.327C5.07354 10.6146 4.6146 11.0735 4.32698 11.638C4 12.2798 4 13.1198 4 14.8V16.2C4 17.8802 4 18.7202 4.32698 19.362C4.6146 19.9265 5.07354 20.3854 5.63803 20.673C6.27976 21 7.11984 21 8.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V14.8C20 13.1198 20 12.2798 19.673 11.638C19.3854 11.0735 18.9265 10.6146 18.362 10.327C18.0057 10.1455 17.5883 10.0647 17 10.0288M7 10.0288V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V10.0288" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g>
					</svg>
						<div className="w-full text-left font-semibold">Protected</div>
						<div className="w-full text-sm">With a password</div>
					</div>
				</label>
			</li>
		</ul>
		</div>
		{channelType === 2 && <div>
			<label htmlFor='channel-password' className="block mb-2 text-white text-sm font-semibold">Channel Password</label>
			<input
				id="channel-password"
				type="password"
				placeholder="********"
				className="p-2 w-1/2 border text-white rounded-md w-full text-black bg-gray-600"
				value={channelPassword}
				onChange={(e) => setChannelPassword(e.target.value)}/>
		</div>}
		{error && <div className="text-center"> <span className="text-red-400 text-sm text-center">{error}</span> </div>}
		<button className="p-2 w-full bg-blue-500 text-white rounded-md" onClick={createNewChannel}>
			Create Channel
		</button>
		</div>
	)
}

function ChannelModal({closeModal}: ChannelModalProps) {
	const [action, setAction] = useState<number>(0);
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
        <div onClick={() => closeModal()} className="fixed inset-0 bg-black opacity-80"></div>
		<div className="relative bg-gray-700 p-8 rounded-md z-10" style={{ minWidth: '24rem' }}>
            {!action && <div>
				<button className="p-2 w-full bg-blue-500 text-white rounded-md" onClick={() => setAction(1)}>
				Create Channel
				</button>
				<div className="relative flex py-3 items-center w-full">
					<div className="flex-grow border-t border-gray-400 ml-5"></div>
					<span className="flex-shrink mx-2 text-gray-400">or</span>
					<div className="flex-grow border-t border-gray-400 mr-5"></div>
				</div>
				<button className="p-2 w-full bg-blue-500 text-white rounded-md" onClick={() => setAction(2)}>
				Join Existing Channel
				</button>
			</div>}
			{action === 1 && <CreateChannelModalContent closeModal={closeModal}/>}
			{action === 2 && <JoinChannelModalContent closeModal={closeModal}/>}
          </div>
      </div>
	);
}

type ChannelTabProp = {
	onItemClick: (channel: Channel) => void;
};

function ChannelTab({onItemClick}: ChannelTabProp) {
	const [modalOpen, setModalOpen] = useState(false);
	const {channels, setChannels} = useUserContext();
	const closeModal = () => setModalOpen(false);
	const handleLeaveChannel = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, channel: Channel) => {
		e.stopPropagation();
		// if (channel.role === ChannelRole.OWNER) {
		// 	toast.error('You must transfer ownership before leaving the channel');
		// 	return;
		// }
		const r = await leaveChannel(channel.id);
		if (r?.message) {
			toast.error(r.message);
		} else {
			const newChannels = channels.filter((c) => c.id !== channel.id);
			setChannels(newChannels);
		}
	}
	return (
		<div>
			{modalOpen && <ChannelModal closeModal={closeModal}/>}
			<div className="flex justify-between items-center mb-2 p-1">
				<span className="text-white text-sm font-semibold px-3">Channels</span>
				<button className="rounded-full hover:text-gray-500" onClick={() => setModalOpen(true)}>+</button>
			</div>
			<hr className="h-px bg-gray-200 border-0 dark:bg-gray-700"/>
			{channels?.map((channel: Channel) => (
				<ChannelItemMemo key={channel.id} channel={channel} onClick={() => onItemClick(channel)} onDeleteClick={handleLeaveChannel}/>
			))}
		</div>
	);
}

export default ChannelTab;
