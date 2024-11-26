import React from "react";
import { Path } from "@/app/constant";
import styles from "./styles/NewChat.module.scss";
import { Button, Card, Flex, Skeleton } from "antd";
import { useNavigate } from "react-router-dom";
import { useMaskStore } from "@/app/store/mask/index";
import { Mask } from "@/app/types/mask";
import { useUserStore } from "@/app/store";
import { useChatStore } from "@/app/store/chat/index";
import { useCommand } from "@/app/hooks/command";
import { BUILTIN_MASK_STORE } from "@/app/masks";
import { useNewChat } from "./hooks/useNewChat";
import FeatureMaskItem from "./components/FeatureMaskItem";
import OtherMaskItem from "./components/OtherMaskItem";
import SearchBar from "./components/SearchBar";
import { PlusCircleOutlined, RobotOutlined } from "@ant-design/icons";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import Avatar from "@/app/components/avatar";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { PlayCircle } from "lucide-react";

export function NewChat() {
	const navigate = useNavigate();
	const { featureGroup, otherMasks, isAuthenticated } = useNewChat();
	const chatStore = useChatStore();
	const maskStore = useMaskStore();
	const userStore = useUserStore();

	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		if (featureGroup.length > 0) {
			setLoading(false);
		}
	}, [featureGroup]);

	const startChat = (mask?: Mask) => {
		setTimeout(() => {
			chatStore.create(mask, userStore);
			navigate(Path.Chat);
		}, 10);
	};

	const handleSearch = (value: string) => {
		navigate(Path.Masks, { state: { searchTerm: value } });
	};

	const handleTagClick = (tag: string) => {
		navigate(Path.Masks, { state: { selectedTag: tag } });
	};

	const tags = Object.values(maskStore.tags).map((tag) => tag.tag_name);

	const totalMasks = React.useMemo(() => {
		return Object.keys(maskStore.masks).length;
	}, [maskStore.masks]);

	useCommand({
		mask: (id) => {
			try {
				const mask = maskStore.selectMaskById(id) ?? BUILTIN_MASK_STORE.get(id);
				startChat(mask ?? undefined);
			} catch {
				console.error("[New Chat] failed to create chat from mask id=", id);
			}
		},
	});

	return (
		<div className={styles["new-chat"]}>
			<h1 className={styles.title}>选择一个助手</h1>
			<div className={styles["main-content"]}>
				<Card className={styles["quick-actions"]}>
					<h2 className={styles["section-title"]}>快速操作</h2>
					<div className={styles["button-group"]}>
						<Button
							className={`${styles["full-width-button"]} ${styles["start-chat-button"]} bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600`}
							onClick={() => startChat()}
							// variant="solid"
						>
							<PlayCircle className="mr-2 h-5 w-5" />
							直接开始
						</Button>
						<Button
							className={`${styles["full-width-button"]} ${styles["create-agent-button"]}`}
							onClick={() => navigate("/create-agent")}
							icon={<RobotOutlined />}
							disabled={true}
						>
							创建自定义智能体
						</Button>
					</div>
				</Card>

				<Card className={styles["recommended-agents"]}>
					<Flex justify="space-between">
						<h2 className={styles["section-title"]}>推荐智能体</h2>
						<Button onClick={() => navigate(Path.Masks)}>查看全部</Button>
					</Flex>
					{loading ? (
						<Skeleton active paragraph={{ rows: 3 }} />
					) : (
						<Swiper
							className={styles["feature-carousel"]}
							modules={[Navigation, Pagination]}
							spaceBetween={10}
							slidesPerView={3.5}
							pagination={{ clickable: true }}
							breakpoints={{
								320: {
									slidesPerView: 1.5,
									spaceBetween: 20,
								},
								480: {
									slidesPerView: 2,
									spaceBetween: 20,
								},
								640: {
									slidesPerView: 2.5,
									spaceBetween: 30,
								},
								768: {
									slidesPerView: 3,
									spaceBetween: 30,
								},
							}}
						>
							{featureGroup.map((mask) => (
								<SwiperSlide key={mask.id} className={styles["carousel-item"]}>
									<Skeleton loading={loading} active avatar>
										<FeatureMaskItem mask={mask} startChat={startChat} />
									</Skeleton>
								</SwiperSlide>
							))}
						</Swiper>
					)}
				</Card>
			</div>

			<Card className={styles["search-filter"]}>
				<SearchBar
					onSearch={handleSearch}
					tags={tags}
					onTagClick={handleTagClick}
				/>
			</Card>

			<Card className={styles["all-agents"]}>
				<div className={styles.header}>
					<h2 className={styles["section-title"]}>
						还有{totalMasks * 2}+智能体等你发现
					</h2>
					<Button onClick={() => navigate(Path.Masks)}>查看全部</Button>
				</div>
				<div className={styles["agents-grid"]}>
					{otherMasks.slice(0, 5).map((mask) => (
						<div key={mask.id} className={styles["agent-item"]}>
							<Avatar avatar={mask.avatar} className={"mb-2 h-12 w-12"} />
							<h3>{mask.name}</h3>
							<p>{mask.description}</p>
							<Button onClick={() => startChat(mask)}>开始聊天</Button>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
}

export default NewChat;
