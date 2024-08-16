"use client";
import React, {
	useState,
	useRef,
	useEffect,
	useMemo,
	useCallback,
} from "react";
import { ChatMessage, ChatSession, Mask } from "@/app/types/";

import { HashRouter } from "react-router-dom";
import { useChatStore, useUserStore } from "@/app/store";

import LoadingIcon from "@/app/icons/three-dots.svg";
import { PlusCircleOutlined } from "@ant-design/icons";
import {
	WorkflowContext,
	WorkflowProvider,
	useWorkflowContext,
} from "../workflowContext";

import { useMaskStore } from "@/app/store/mask";

import styles from "../workflow-chats.module.scss";
import styles2 from "@/app/(chat-pages)/chats/home.module.scss";
import {
	Avatar as UserAvatar,
	Button,
	Menu,
	Dropdown,
	Switch,
	Layout,
	Flex,
} from "antd";
import { DeleteIcon } from "@/app/icons";
import Locale from "@/app/locales";

import { _Chat } from "@/app/(chat-pages)/chats/chat/main";
import {
	DragDropContext,
	Droppable,
	Draggable,
	OnDragEndResponder,
	OnDragUpdateResponder,
} from "@hello-pangea/dnd";
import { workflowChatSession } from "@/app/store/workflow";

export function ChatItemShort(props: {
	onClick?: () => void;
	onDelete?: () => void;
	title: string;
	count: number;
	time: string;
	selected: boolean;
	id: string;
	index: number;
	narrow?: boolean;
	mask: Mask;
}) {
	const draggableRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (props.selected && draggableRef.current) {
			draggableRef.current?.scrollIntoView({
				block: "center",
			});
		}
	}, [props.selected]);
	return (
		<Draggable draggableId={`${props.id}`} index={props.index}>
			{(provided) => (
				<div
					className={`${styles2["chat-item"]} ${styles2["multi-chat"]} ${
						props.selected && styles2["chat-item-selected"]
					}`}
					onClick={props.onClick}
					ref={(ele) => {
						draggableRef.current = ele;
						provided.innerRef(ele);
					}}
					{...provided.draggableProps}
					{...provided.dragHandleProps}
					title={`${props.title}\n${Locale.ChatItem.ChatItemCount(
						props.count,
					)}`}
				>
					<>
						<div className={styles2["chat-item-title"]}>{props.title}</div>
					</>

					<div
						className={styles2["chat-item-delete"]}
						onClickCapture={(e) => {
							props.onDelete?.();
							e.preventDefault();
							e.stopPropagation();
						}}
					>
						<DeleteIcon />
					</div>
				</div>
			)}
		</Draggable>
	);
}

export default function AgentList(props: {
	sessions: any[];
	showModal: () => void;
}) {
	const [selectIndex, setSelectIndex] = useState(0);
	const { selectedId, workflowGroups, deleteSessionFromGroup, moveSession } =
		useWorkflowContext();

	const [orderedSessions, setOrderedSessions] = useState<any[]>(props.sessions);

	useEffect(() => {
		setOrderedSessions(props.sessions);
	}, [props.sessions]);

	console.log("agentList", orderedSessions);

	const onDragEnd: OnDragEndResponder = (result) => {
		const { destination, source } = result;
		// console.log("destination", destination, "source", source);
		if (!destination) {
			return;
		}

		if (
			destination.droppableId === source.droppableId &&
			destination.index === source.index
		) {
			return;
		}
		moveSession(selectedId, source.index, destination.index);
		setSelectIndex(destination.index);
	};

	const itemClickHandler = (item: any, i: number) => {
		// console.log("item", item);
		setSelectIndex(i);
	};

	const itemDeleteHandler = async (item: any) => {
		// console.log("item", item);
		deleteSessionFromGroup(selectedId, item.id);
	};

	return (
		<WorkflowProvider>
			<div className={styles["session-container"]}>
				{orderedSessions && (
					<DragDropContext onDragEnd={onDragEnd}>
						<Droppable droppableId="chat-list" direction="horizontal">
							{(provided) => (
								<div
									className={styles["session-list"]}
									ref={provided.innerRef}
									{...provided.droppableProps}
								>
									{orderedSessions.map((item, i) => (
										<ChatItemShort
											title={item.mask.name}
											time={new Date(item.lastUpdateTime).toLocaleString()}
											count={item.messages.length}
											key={item.id}
											id={item.id}
											index={i}
											selected={i === selectIndex}
											onClick={() => {
												itemClickHandler(item, i);
											}}
											onDelete={async () => {
												itemDeleteHandler(item);
											}}
											mask={item.mask}
										/>
									))}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</DragDropContext>
				)}

				{/* button 样式 新增session */}

				{/* 下拉菜单 */}

				<Button
					type="dashed"
					className={styles["plus"]}
					icon={<PlusCircleOutlined />}
					onClick={() => props.showModal()}
				>
					新增助手
				</Button>
			</div>
		</WorkflowProvider>
	);
}
