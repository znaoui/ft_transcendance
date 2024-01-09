import React, { useState } from 'react'
import { useUserContext } from '../../UserContext';
import { ChangePassModel } from '../../models/User';
import { disableTotp, generateTotpSecret, setupTotp } from '../../api/auth';
import QRCodeSVG from 'qrcode.react';
import { toast } from 'react-hot-toast';

type TwoFactorSetupModalProps = {
	secret_url: string;
	closeModal: () => void;
}

function TwoFactorSetupModal({ secret_url, closeModal }: TwoFactorSetupModalProps) {
	const [loading, setLoading] = useState(false);
	const [code, setCode] = useState('');
	const [error, setError] = useState('');

	const { user, setUser } = useUserContext();

	const verifyCode = async() => {
		setLoading(true);
		const secret = secret_url.split('=')[1];
		const result = await setupTotp(secret, code);
		if (result) {
			setError(result.message);
		} else {
			closeModal();
			setCode('');
			setUser({ ...user!, has_2fa: true });
			toast.success('Two factor authentication enabled');
		}
		setLoading(false);
	}

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
        <div onClick={() => closeModal()} className="fixed inset-0 bg-black opacity-80"></div>
		<div className="relative bg-gray-700 p-8 rounded-md z-10" style={{ minWidth: '24rem' }}>
			<div className="flex flex-col items-center space-y-3">
				<h1 className="text-3xl font-bold">Two Factor Authentication</h1>
				<p className="text-center text-m">Scan this QR code with your authenticator app</p>
				<QRCodeSVG value={secret_url} size={256} />
				<div>
					<p className="text-center text-xs">If you can't scan the QR code, use this key:</p>
					<p className="text-center text-xs font-medium">{secret_url.split('=')[1]}</p>
				</div>

				<div className="flex flex-col items-center">
					{error && <p className="text-center font-medium text-red-400">{error}</p>}
					<p className="text-center">Enter the code to verify</p>
					<input
						className="w-64 h-10 border rounded-md mb-2 text-black text-center"
						type="text"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						 />
					<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={verifyCode}>
						Verify
						{loading && <svg aria-hidden="true" role="status" className="inline w-4 h-4 ml-2 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
						<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
					</svg>}
					</button>
				</div>
			</div>
          </div>
      </div>
	);
}

function TwoFactorForm() {
	const { user, setUser } = useUserContext();
	const [loading, setLoading] = useState(false);
	const [secretUrl, setSecretUrl] = useState<string | null>(null);
	const [response, setResponse] = useState<ChangePassModel>({
		error:'',
		statusCode: 0,
		message: ''
	})

	const handleTwoFactor = async (enable: boolean) => {
		setLoading(true);
		if (enable) {
			const response = await generateTotpSecret();
			setResponse(response);
			if (response.url) {
				setSecretUrl(response.url);
			}
		} else {
			const response = await disableTotp();
			setResponse(response);
			if (!response) {
				setUser({ ...user!, has_2fa: false });
				toast.success('Two factor authentication disabled');
			}
		}
		setLoading(false);
	}

	if (secretUrl !== null) {
		return <TwoFactorSetupModal secret_url={secretUrl} closeModal={() => setSecretUrl(null)} />
	}

	return (
		<div className="w-2/4">
			<div className="flex flex-col p-4 rounded gap-20">
				<div className='min-w-min border p-5 rounded'>
					<div className=" flex flex-col mb-4">
						<label className="block pb-2">Two Factor Authentication</label>
						{user!.has_2fa ? (
							<label className="block pb-2 text-green-400">Enabled</label>
						) : (
							<label className="block pb-2 text-red-400 ">Disabled</label>
						)}
					</div>
					<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() => handleTwoFactor(!user!.has_2fa)}>
					{user!.has_2fa ? "Disable" : "Enable"}
					{loading && <svg aria-hidden="true" role="status" className="inline w-4 h-4 ml-2 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
						<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
					</svg>}
					</button>
				</div>
			</div>
		</div>
	  );
}

export default TwoFactorForm
