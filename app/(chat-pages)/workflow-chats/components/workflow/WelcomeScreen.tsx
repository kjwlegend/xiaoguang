import { Button } from "antd";
import { PlusCircleOutlined } from "@ant-design/icons";
import { PresetMarket } from "../PresetMarket";
import WelcomeContainer from "./WelcomeContainer";
import styles from "../../workflow-chats.module.scss";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface WelcomeScreenProps {
	isAuth: boolean;
	router: any;
	openAgentList: () => void;
	onPresetSelect?: (agent: any, selectedId: string) => Promise<void>;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
	isAuth,
	router,
	openAgentList,
	onPresetSelect,
}) => {
	return (
		<WelcomeContainer isAuth={isAuth} router={router}>
			{isAuth && (
				<div className="relative top-14 flex flex-col items-center gap-8">
					<div className="animate-fade-in text-3xl font-bold text-gray-800">
						开启您的智能工作流
					</div>
					{/* ... 其余欢迎界面代码 ... */}
					<div className="flex flex-col items-center gap-6">
						<div className="text-center text-lg font-medium text-gray-600">
							您可以通过以下方式开始:
						</div>
						<div className="flex gap-6">
							<Button
								type="primary"
								size="large"
								className={`${styles["plus"]} bg-blue-500 shadow-md transition-colors hover:bg-blue-600`}
								icon={<PlusCircleOutlined />}
								onClick={openAgentList}
							>
								新增助手
							</Button>
							<Dialog>
								<DialogTrigger asChild>
									<Button
										type="default"
										size="large"
										className="shadow-md transition-colors hover:bg-gray-100"
									>
										查看教程
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[800px]">
									<DialogHeader>
										<DialogTitle className="text-lg font-bold text-blue-400">
											使用介绍
										</DialogTitle>
									</DialogHeader>
									<div className="h-[500px]">
										<iframe
											src="//player.bilibili.com/player.html?isOutside=true&aid=834306026&bvid=BV1qg4y1f7NW&cid=1356984682&p=1"
											allowFullScreen={true}
											className="h-full w-full"
										></iframe>
									</div>
								</DialogContent>
							</Dialog>
						</div>
					</div>
					<div className="w-full">
						<div className="text-center text-lg font-medium text-gray-600">
							或者从下方预设市场中选择合适的工作流模板:
						</div>
						<PresetMarket onPresetSelect={onPresetSelect} />
					</div>
				</div>
			)}
		</WelcomeContainer>
	);
};
