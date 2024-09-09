import {
	AliwangwangOutlined,
	UsergroupAddOutlined,
	HighlightOutlined,
	ContainerOutlined,
	BookOutlined,
} from "@ant-design/icons";
import { ReactNode } from "react";

import { createFromIconfontCN } from "@ant-design/icons";
export const IconFont = createFromIconfontCN({
	scriptUrl: "//at.alicdn.com/t/c/font_4149808_awi8njsz19j.js",
});

export interface MenuItem {
	label: string;
	title?: string;
	key: string;
	icon?: ReactNode;
	url: string;
	children?: MenuItem[];
	disabled?: boolean;
}

export const TopMenuItems: MenuItem[] = [
	{
		label: "首页",
		key: "home",
		icon: <IconFont type="iconfont-home" />,
		url: "/about",
	},
	{
		label: "对话",
		title: "对话",
		key: "chat",
		icon: <IconFont type="iconfont-chat" />,
		url: "/chats/",
	},
	{
		label: "塔罗",
		title: "塔罗",
		key: "tarot",
		icon: <IconFont type="iconfont-033-tarot" />,
		url: "/tarot/",
	},
	{
		label: "双AI对话",
		key: "double-agents",
		disabled: false,
		url: "/double-agents",
	},
	{
		label: "工作流",
		key: "workflow-chats",
		disabled: false,
		url: "/workflow-chats",
	},
	{
		label: "商城",
		key: "products",
		url: "/products",
	},
	{
		label: "绘图",
		key: "draw",
		disabled: true,
		url: "/draw",
	},
	{
		label: "音乐",
		key: "music",
		disabled: true,
		url: "/music",
	},
	{
		label: "社区(开发中)",
		key: "community",
		disabled: true,
		url: "/community",
	},
];

export const BottomMenuItems = [
	{
		label: "版本日志",
		key: "updates",
		icon: <IconFont type="iconfont-Timeline" />,
		url: "/updates",
	},
];
