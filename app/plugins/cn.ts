import { BuiltinPlugin } from "./typing";

export const CN_PLUGINS: BuiltinPlugin[] = [
	{
		name: "搜索引擎",
		toolName: "all_search",
		lang: "cn",
		description: "搜索引擎的网络搜索功能工具。",
		builtin: true,
		createdAt: 1693744292000,
		enable: true,
	},
	{
		name: "计算器",
		toolName: "calculator",
		lang: "cn",
		description: "计算器是一个用于计算数学表达式的工具。",
		builtin: true,
		createdAt: 1693744292000,
		enable: true,
	},
	{
		name: "网页浏览器",
		toolName: "web-browser",
		lang: "cn",
		description:
			"一个用于与网页进行交互的工具，可以从网页中提取信息或总结其内容。",
		builtin: true,
		createdAt: 1693744292000,
		enable: true,
	},
	{
		name: "维基百科",
		toolName: "WikipediaQueryRun",
		lang: "cn",
		description: "用于与Wikipedia API交互和从Wikipedia API获取数据的工具。",
		builtin: true,
		createdAt: 1694235989000,
		enable: true,
	},
	{
		name: "DALL·E",
		toolName: "dalle_image_generator",
		lang: "cn",
		description:
			"接入最新的 DALL·E 3 可以根据自然语言的描述创建逼真的图像和艺术。",
		builtin: true,
		createdAt: 1694703673000,
		enable: true,
	},
	// {
	// 	name: "Stable Diffusion",
	// 	toolName: "stable_diffusion_image_generator",
	// 	lang: "cn",
	// 	description:
	// 		"Stable Diffusion 图像生成模型。使用本插件需要配置 Cloudflare R2 对象存储服务以及 stable-diffusion-webui 接口。",
	// 	builtin: true,
	// 	createdAt: 1688899480510,
	// 	enable: true,
	// },
	{
		name: "Arxiv",
		toolName: "arxiv",
		lang: "cn",
		description: "使用 Arxiv 接口搜索并获取文章信息。",
		builtin: true,
		createdAt: 1699265115000,
		enable: true,
	},
	{
		name: "文档搜索",
		toolName: "doc_search",
		lang: "cn",
		description:
			"文档搜索是一个工具，可以从你上传的文档或者公共文档中搜索知识。当原始模型不足以回答问题时使用。",
		builtin: true,
		createdAt: 1699265115000,
		enable: true,
	},
];
