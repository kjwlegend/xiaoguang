import styles from "../home.module.scss";

import { useRef, useEffect, useState, useCallback } from "react";

import { ChatItem, ChatItemShort } from "./chatItem";

interface ChatListProps {
	narrow?: boolean;
	chatSessions: any[];
	onChatItemClick: (id: string) => void;
	onChatItemDelete: (id: number) => void;
}

export function ChatList({
	narrow,
	chatSessions,
	onChatItemClick,
	onChatItemDelete,
}: ChatListProps) {
	const [chatlist, setChatlist] = useState(chatSessions);

	useEffect(() => {
		setChatlist(chatSessions);
	}, [chatSessions]); // 依赖于

	const [selectedChatId, setSelectedChatId] = useState<string | null>(null); // 管理选中的聊天项

	const handleChatItemClick = (id: string) => {
		setSelectedChatId(id); // 更新选中的聊天项
		onChatItemClick(id); // 调用外部的点击处理函数
	};

	return (
		<div className={styles["chat-list"]}>
			{chatlist.length === 0 ? (
				<div className={styles["no-conversations"]}>暂无对话</div>
			) : (
				chatlist.map((item, i) => (
					<ChatItem
						title={item.topic}
						time={
							new Date(item.lastUpdateTime).toLocaleDateString(undefined, {
								month: "2-digit",
								day: "2-digit",
							}) +
							" " +
							new Date(item.lastUpdateTime).toLocaleTimeString(undefined, {
								hour: "2-digit",
								minute: "2-digit",
							})
						}
						count={item.chat_count ?? item.messages.length}
						key={item.id}
						id={item.id}
						index={i}
						selected={item.id === selectedChatId}
						onClick={() => handleChatItemClick(item.id)} // 处理点击事件
						onDelete={() => onChatItemDelete(item.id)}
						narrow={narrow}
						mask={item.mask}
					/>
				))
			)}
		</div>
	);
}
