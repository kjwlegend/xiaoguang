"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import React from "react";

import styles from "@/app/(chat-pages)/chats/home.module.scss";

import { IconButton } from "../../components/button";

import MainNav from "../../components/header";
import Locale from "../../locales";

import {
	SettingsIcon,
	GithubIcon,
	ChatGptIcon,
	AddIcon,
	CloseIcon,
	DeleteIcon,
	MaskIcon,
	PluginIcon,
	DragIcon,
} from "@/app/icons";
import Image from "next/image";
import { useAppConfig, useChatStore } from "../../store";

import {
	DEFAULT_SIDEBAR_WIDTH,
	MAX_SIDEBAR_WIDTH,
	MIN_SIDEBAR_WIDTH,
	NARROW_SIDEBAR_WIDTH,
	Path,
	REPO_URL,
} from "../../constant";

import { Link, useNavigate } from "react-router-dom";
import { isIOS, useMobileScreen } from "../../utils";
import dynamic from "next/dynamic";
import { showConfirm, showToast } from "../../components/ui-lib";
import { useAuthStore } from "../../store/auth";

import AuthPage from "../../(pages)/auth/page";
import DrawerMenu from "../../components/drawer-menu";

import { getChatSession } from "../../api/backend/chat";
import { ChatSessionData } from "../../api/backend/chat";
import { updateChatSessions } from "../../services/chatService";
import { useUserStore } from "../../store/user";
import usemultiAgentStore from "@/app/store/multiagents";

import { useWorkflowStore } from "../../store/workflow";

import { message } from "antd";
import { WorkflowGroup } from "../../store/workflow";

import { WorkflowContext, useWorkflowContext } from "./workflowContext";
import { useSimpleWorkflowService } from "@/app/hooks/useSimpleWorkflowHook";
import { SideBar } from "@/app/(chat-pages)/chats/sidebar/sidebar";
import { ChatList } from "@/app/(chat-pages)/chats/sidebar/chatList";
import { WorkflowModalConfig } from "./modal";
export function WorkflowSidebar(props: { className?: string }) {
	const {
		selectedId,
		WorkflowGroupData,
		loadMoreSessions,
		handleAddClick,
		handleChatItemClick,
		handleChatItemDelete,
	} = useSimpleWorkflowService();

	const { workflowSessions, workflowSessionsIndex } = useWorkflowContext();

	//  change chatsessions from object type to array type
	const [editWrokflow, setEditWorkflow] = useState<WorkflowGroup | null>(null);
	const [showWorkflowModal, setShowWorkflowModal] = useState(false);
	const [agentList, setagentList] = useState<any[]>([]);
	const handleItemEditClick = (workflowgroupId: string) => {
		console.log("workflow group id", workflowgroupId);
		const currentWorkflowGroup = WorkflowGroupData.find(
			(item) => item.id === workflowgroupId,
		);
		// 过滤出当前工作流组的所有会话
		const currentWorkflowGroupSessions = workflowSessions.filter(
			(session) => session.workflow_group_id === workflowgroupId,
		);

		setEditWorkflow(currentWorkflowGroup);
		setagentList(currentWorkflowGroupSessions);
		console.log("currentworkflowGroupSessions", currentWorkflowGroupSessions);
		setShowWorkflowModal(true);
	};

	return (
		<>
			<SideBar
				className={styles["sidebar-show"]}
				chatSessions={WorkflowGroupData}
				loadMoreSessions={loadMoreSessions}
				onAddClick={handleAddClick}
				onChatItemClick={handleChatItemClick}
				onChatItemDelete={handleChatItemDelete}
				onChatItemEdit={handleItemEditClick}
				ChatListComponent={ChatList}
			/>
			{showWorkflowModal && (
				<WorkflowModalConfig
					workflow={editWrokflow!}
					workflowSessions={agentList}
					onClose={() => setShowWorkflowModal(false)}
				/>
			)}
		</>
	);
}
