import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../../api/auth';

function LoginPage() {
    useEffect(() => {
        document.title = 'Login';
      }, []);

      const navigate = useNavigate();
      const [login, setLogin] = useState(true);
      const [linkTxt, setLinkTxt] = useState('Not registered yet ?');
      const [btnText, setBtnText] = useState('Sign in');
      const [error, setError] = useState(false);
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const [confirm_password, setPasswordConfirm] = useState('');
      const [loading, setLoading] = useState(false);

    const toggleRegister = () => {
        const confirmPasswordBox = document.getElementById('confirm-password-box');
        if (confirmPasswordBox) {
            if (confirmPasswordBox.classList.contains('hidden')) {
                confirmPasswordBox.classList.remove('hidden');
                setLogin(false);
                setLinkTxt('Already registered ?');
                setBtnText('Register');
            } else {
                setLogin(true);
                setLinkTxt('Not registered yet ?');
                confirmPasswordBox.classList.add('hidden');
                setBtnText('Sign in');
            }
        }
    }

    const loginRegister = async () => {
        try {
            setLoading(true);
            const result = login ? await loginUser(username, password) : await registerUser(username, password, confirm_password);
            const res = await result.json();
            if (!result.ok) {
                setError(res.message);
            } else if (login && res.totp_required) {
                navigate('/login/2fa');
            } else if (login) {
                navigate('/')
            } else {
                navigate('/setting');
            }
        } finally {
            setLoading(false);
        }
    }

  return (
<div className="min-h-screen min-h-screen flex flex-col items-center justify-center">
    <div className="rounded-md mt-8 sm:mx-auto sm:w-full sm:max-w-md bg-gradient-to-br from-blue-500 to-blue-800 p-0.5">
        <div className="py-8 px-4 shadow rounded-md sm:px-10 bg-slate-900">
            <div id="error-box" className="text-center text-sm mb-5" hidden={!error}>
                <label className="font-medium text-red-600">
                    {error}
                </label>
            </div>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium">
                        Username
                    </label>
                    <div className="mt-1">
                        <input id="username" name="username" type="username" required
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="john.doe" value={username} onChange={e => setUsername(e.target.value)}/>
                    </div>
                </div>
                <div id='password-box'>
                    <label className="block text-sm font-medium">
                        Password
                    </label>
                    <div className="mt-1">
                        <input id="password" name="password" type="password" required
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="*********" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                </div>
                <div id='confirm-password-box' className='hidden'>
                    <label className="block text-sm font-medium">
                        Confirm password
                    </label>
                    <div className="mt-1">
                        <input id="password-confirm" name="password-confirm" type="password" required={login}
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="*********" value={confirm_password} onChange={e => setPasswordConfirm(e.target.value)} />
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-sm">
                        <button onClick={toggleRegister} className="font-medium text-blue-600 hover:text-blue-500">
                            {linkTxt}
                        </button>
                    </div>
                </div>
                <div>
                    <button type="submit"
                        disabled={loading}
                        onClick={loginRegister}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-br from-blue-800 to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">

                        {loading ?
                        (<svg className="mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>)
                        :
                        btnText
                        }
                    </button>
                </div>
            </div>
            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-slate-900 text-white">
                            Or
                        </span>
                    </div>
                </div>
                <div className="mt-5">
                    <a href='/api/auth/42'>
                        <button type="button" className="text-black bg-white font-medium rounded-lg text-sm group relative w-full flex justify-center py-2 px-4 border border-transparent">
                        <svg className="w-5 h-5 mr-2 -ml-1" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="apple" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 57 40"><path d="M31.627.205H21.084L0 21.097v8.457h21.084V40h10.543V21.097H10.542L31.627.205M35.349 10.233 45.58 0H35.35v10.233M56.744 10.542V0H46.512v10.542L36.279 21.085v10.543h10.233V21.085l10.232-10.543M56.744 21.395 46.512 31.628h10.232V21.395"></path></svg>
                        Sign in with 42
                        </button>
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
  )
}

export default LoginPage;
