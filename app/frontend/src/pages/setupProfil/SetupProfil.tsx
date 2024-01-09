import React from "react"
import { useState } from "react";
import PasswordForm from "./PasswordForm";
import ModifyProfil from "./ModifyProfil";
import { useUserContext } from "../../UserContext";
import TwoFactorForm from "./TwoFactorForm";
import BlocksList from "./BlocksList";
import GameMode from "./GameMode";

function SetupProfil(){
	const [content, setContent] = useState("Profil")
	const { user } = useUserContext();

	return (
		<div className="flex h-full w-full bg-gray-600 items-center justify-start gap-20">
			<div className="w-64 h-3/4 flex justify-end border-r border-gray-400">
				<ul>
					<li onClick={ () => setContent("Profil")} className="pr-2 h-10 cursor-pointer">Edit Profile</li>
					{!user!.oauth && <li onClick={ () => setContent("Password")} className="pr-2 h-10 cursor-pointer">Edit Password</li>}
					<li onClick={ () => setContent("Mode")} className="pr-2 h-10 cursor-pointer">Game Mode</li>
					<li onClick={ () => setContent("Blocks")} className="pr-2 h-10 cursor-pointer">Blocked Users</li>
					<li onClick={ () => setContent("2FA")} className="pr-2 h-10 cursor-pointer">Two-Factor Authentication</li>
				</ul>
			</div>
			<div className="h-3/4 w-4/6 flex flex-col items-start">
				{content === "Profil" && <ModifyProfil/>}
				{content === "Password" && <PasswordForm/>}
				{content === "Blocks" && <BlocksList/>}
				{content === "Mode" && <GameMode/>}
				{content === "2FA" && <TwoFactorForm/>}
			</div>
		</div>
	);
}

export default SetupProfil
