// src/components/ChatArea/ConversationWindow.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Card } from "antd";
import dynamic from "next/dynamic";
import { useCurrentConversation } from "../multiAgentContext";
import MultiAgentWindowHeader from "./components/MultiAgentWindowHeader";
import styles from "../multi-agents.module.scss";
const Chatbody = dynamic(
	async () => (await import("./components/Chatbody")).MultiAgentChatbody,
	{ ssr: false },
);

import { Inputpanel } from "../../chats/chat/inputpanel/Inputpanel";
const ConversationWindow: React.FC = () => {
	const { conversation } = useCurrentConversation();
	const [shouldRender, setShouldRender] = useState(false);

	useEffect(() => {
		if (conversation) {
			setShouldRender(true);
		}
	}, [conversation]);

	if (!shouldRender || !conversation) {
		return null;
	}

	return (
		<Card className={styles.conversationCard}>
			<MultiAgentWindowHeader session={conversation} />
			<div className={styles.chatbodyContainer}>
				<Chatbody />
			</div>
			<div className={styles.inputContainer}>
				<Inputpanel isworkflow={false} submitType="multi-agent" />
			</div>
		</Card>
	);
};

export default ConversationWindow;
