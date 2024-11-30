// MessageList.tsx
import React, {
	memo,
	useCallback,
	useRef,
	useMemo,
	useEffect,
	useState,
} from "react";
import { useVirtual, VirtualItem } from "react-virtual";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/app/types/chat";
import MessageItem from "./MessageItem";
import styles from "../chats.module.scss";
import { useChatScroll } from "@/app/(chat-pages)/chats/chat/hooks/useChatScroll";
import ChatIntro from "./ChatIntro";
import { RequestMessage } from "@/app/client/api";

interface ChatMessageListProps {
	messages: ChatMessage[];
	isLoading: boolean;
	hasNextPage: boolean;
	onLoadMore: () => void;
	height: number;
	width: number;
}

interface VirtualRowProps {
	virtualRow: VirtualItem;
	message: ChatMessage;
	measureRef: (el: HTMLElement | null) => void;
}

const MessageContent = memo(
	({ message, index }: { message: ChatMessage; index: number }) => {
		return <MessageItem message={message} i={index} />;
	},
	(prev, next) => {
		if (next.message.streaming) {
			return false;
		}
		return prev.message.content === next.message.content;
	},
);

const VirtualRow = memo(
	({ virtualRow, message, measureRef }: VirtualRowProps) => {
		return (
			<div
				ref={measureRef}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					transform: `translateY(${virtualRow.start}px)`,
				}}
			>
				<div className={styles["chat-message-wrapper"]}>
					<MessageContent message={message} index={virtualRow.index} />
				</div>
			</div>
		);
	},
	(prev, next) => {
		return prev.virtualRow.start === next.virtualRow.start;
	},
);

VirtualRow.displayName = "VirtualRow";

export const MessageList: React.FC<ChatMessageListProps> = ({
	messages,
	isLoading,
	hasNextPage,
	onLoadMore,
	height,
	width,
}) => {
	const parentRef = useRef<HTMLDivElement>(null);
	const { autoScroll, setAutoScroll, scrollToBottom } = useChatScroll();

	// 增加对最后一条消息的特殊处理
	const lastMessageRef = useRef<RequestMessage["content"]>("");
	const lastMessageIndex = messages.length - 1;
	const isStreaming = messages[lastMessageIndex]?.streaming;

	// 初始化和新消息到达时滚动到底部
	useEffect(() => {
		if (parentRef.current && messages.length > 0 && autoScroll) {
			scrollToBottom(parentRef.current);
		}
	}, [messages, autoScroll]);

	// console.log("messages: ", messages);

	const handleScroll = useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			const target = e.target as HTMLDivElement;
			if (target.scrollTop < 100 && !isLoading && hasNextPage) {
				onLoadMore();
			}
		},
		[isLoading, hasNextPage, onLoadMore],
	);

	return (
		<div
			ref={parentRef}
			className={styles["message-list-container"]}
			style={{
				height,
				width,
				overflow: "auto",
				position: "relative",
			}}
			onScroll={handleScroll}
		>
			<ChatIntro />

			{isLoading && (
				<div className={styles["loading-indicator"]}>
					<span>加载历史消息...</span>
				</div>
			)}

			<div className={styles["messages-container"]}>
				{messages.map((message, index) => (
					<motion.div
						key={message.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.3,
							delay: message.streaming ? 0 : index * 0.02,
							ease: [0.4, 0, 0.2, 1],
						}}
					>
						<MessageItem key={message.id} message={message} i={index} />
					</motion.div>
				))}
			</div>
		</div>
	);
};
