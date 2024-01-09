import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
	Navigate,
  } from "react-router-dom";
import LoginPage from './pages/login/Login';
import DashboardPage from './pages/dashboard/Dashboard';
import { UserProvider } from './UserContext';
import GamePage from './pages/game/Game';
import { GameSummaryPage } from './pages/game/GameSummary';
import Profil from './pages/profile/Profile';
import SetupProfil from './pages/setupProfil/SetupProfil';
import MainContent from './pages/dashboard/maincontent/MainContent';
import './App.css'
import TwoFactorPage from './pages/login/TwoFactorPage';
import { Toaster } from 'react-hot-toast';

function App() {
	return (
		<UserProvider>
			<Toaster
				position="top-center"
				reverseOrder={false}
				/>
			<Router>
				<Routes>
					<Route path="/" element={<DashboardPage/>}>
						<Route path="/" element={<MainContent />} />
						<Route path="/profil/:id" element={<Profil/>}/>
						<Route path="/setting" element={<SetupProfil/>}/>
					</Route>
					<Route path="/login" element={<LoginPage/>}/>
					<Route path="/login/2fa" element={<TwoFactorPage/>}/>
					<Route path="/game" element={<GamePage/>}/>
					<Route path="/game/summary" element={<GameSummaryPage/>}/>
					<Route path="*" element={<Navigate to="/" />}/>
				</Routes>
			</Router>
		</UserProvider>
	);
}

export default App;
