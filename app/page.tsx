"use client";
import About from "./about/page";
import { getServerSideConfig } from "./config/server";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useInviteCodeStore } from "./store/auth";

const serverConfig = getServerSideConfig();

export default function App() {
	const query = useSearchParams();

	const inviteCode = query.get("i");
	const inviteCodeStore = useInviteCodeStore();

	useEffect(() => {
		// 在这里可以使用inviteCode进行相应的处理
		console.log("inviteCode", inviteCode);

		inviteCodeStore.setInviteCode(inviteCode);
	}, [inviteCode]);

	return (
		<>
			<About />
		</>
	);
}
