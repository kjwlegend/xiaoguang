"use client";
import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import React from "react";

import styles from "@/app/(chat-pages)/chats/home.module.scss";

import { SideBar } from "@/app/(chat-pages)/chats/sidebar/sidebar";
import ChatList from "@/app/(chat-pages)/chats/sidebar/chatList";
import { useMultipleAgentsChatHook } from "@/app/(chat-pages)/double-agents/hooks/useMultipleAgentsHook";

export function MultiAgentSideBar(props: { className?: string }) {
	const {
		chatSessions,
		loadMoreSessions,
		handleAddClick,
		handleChatItemClick,
		handleChatItemDelete,
	} = useMultipleAgentsChatHook();

	return (
		<SideBar
			className={styles["sidebar-show"]}
			chatSessions={chatSessions}
			loadMoreSessions={loadMoreSessions}
			onAddClick={handleAddClick}
			onChatItemClick={handleChatItemClick}
			onChatItemDelete={handleChatItemDelete}
			ChatListComponent={ChatList}
		/>
	);
}
