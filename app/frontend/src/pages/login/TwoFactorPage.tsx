import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authVerifyTotp } from '../../api/auth';
import { useUserContext } from '../../UserContext';

function TwoFactorPage() {
    const { user } = useUserContext();

    useEffect(() => {
        document.title = 'Two Factor Authentication';
        if (user) {
            navigate('/');
        }
      }, []);

      const navigate = useNavigate();
      const [code, setCode] = useState('');
      const [error, setError] = useState(false);
      const [loading, setLoading] = useState(false);

      const verifyCode = async () => {
        setLoading(true);
        const codeWithoutSpaces = code.replace(/\s/g, '');
        const result = await authVerifyTotp(codeWithoutSpaces);
        if (result) {
            setError(result.message);
        } else {
            navigate('/');
        }
        setLoading(false);
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
                        Please input the 2FA code:
                    </label>
                    <div className="mt-1">
                        <input id="username" name="username" type="username" required
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="123456" value={code} onChange={e => setCode(e.target.value)}/>
                    </div>
                </div>
                <div>
                    <button type="submit"
                        disabled={loading}
                        onClick={verifyCode}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-br from-blue-800 to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">

                        {loading ?
                        (<svg className="mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>)
                        :
                        "Verify"
                        }
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
  )
}

export default TwoFactorPage;
