// pages/index.tsx
"use client";
import React, { useState, useCallback, useEffect } from "react";
import { TarotCardType } from "./types/TarotCard";
import { Deck } from "./components/Deck";
import { Spread, TestSpread } from "./components/Spread";

import { TAROT_SPREADS } from "./constants/tarotSpreads";
import { TarotSpread } from "./libs/TarotSpread";
import { TarotGame } from "./libs/gameLogic";
import QuestionInputComponent from "./components/QuestionInput";
import { useTarotStore } from "./store/tarot";
import { Stages } from "./store/tarot";
import styles from "./styles/layout.module.scss";
import { useUserStore } from "@/app/store";
import { useAuthStore } from "@/app/store/auth";
import Login from "@/app/(pages)/auth/login";
import { Button } from "antd";
import DrawerMenu from "@/app/components/drawer-menu";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAppConfig } from "@/app/store";
import { SEOHeader } from "@/app/components/seo-header";
const Index: React.FC = () => {
	const TarotStore = useTarotStore();
	const { game, resetGame, stage, remainingDraws } = TarotStore;
	const [cardsDealt, setCardsDealt] = useState<TarotCardType[]>([]);

	const authStore = useAuthStore();

	const { isAuthenticated } = authStore;

	const reset = useCallback(() => {
		resetGame();
	}, []);

	// 定义 stage 变化时的回调函数
	const handleStageChange = useCallback((stage: string) => {
		console.log("Stage changed:", stage);
	}, []);

	return (
		<>
			{/* <SEOHeader /> */}
			<div
				style={{
					overflow: "hidden",
				}}
			>
				<div className={styles.stars}></div>
				<div className={styles.stars2}></div>
				<div className={styles.stars3}></div>
				<div className={`${styles.tarotcontainer}`}>
					{!isAuthenticated ? (
						<div className={styles["login"]}>
							<div>离开启塔罗世界还剩下一步</div>
							<button
								className={styles["tarotButtonPrimary"]}
								onClick={() => {
									window.location.href = "/auth?from=/tarot";
								}}
							>
								登录
							</button>
						</div>
					) : (
						<>
							<QuestionInputComponent />
							<Deck />
							{stage == Stages.Interpretation && <Spread />}
						</>
					)}
				</div>
			</div>
		</>
	);
};

export default Index;