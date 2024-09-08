// components/Card.tsx
import React, { useState } from "react";
import { TarotCardType } from "../types/TarotCard";
import { TAROT_BACK_IMAGE } from "../constants/tarotCards";
import { Tooltip } from "antd";
import styles from "../styles/Card.module.scss";
import { on } from "events";
import { oss } from "@/app/constant";

const TAROT_BRAND = "golden-dawn";

interface CardProps {
	card: TarotCardType;
	onClick?: () => void;
	classNameString?: string;
	style?: any;
	positionMeaning?: string;
	size?: "small" | "large";
	index?: number;
}

const Card: React.FC<CardProps> = ({
	card,
	onClick,
	positionMeaning,
	classNameString,
	style,
	index,
}) => {
	const [flipped, setFlipped] = useState<boolean>(false); // 默认为背面状态

	const handleFlip = () => {
		if (!flipped) {
			setFlipped(true); // 从背面翻到正面
			onClick && onClick();
		}
		// 正面状态下不允许再次翻转ssssszc
	};

	return (
		<div className={`${styles["tarot-card"]} ${classNameString}`} style={style}>
			<div
				className={`${styles["tarot-card-face"]} ${
					flipped ? styles.flipped : ""
				}`}
				onClick={handleFlip}
			>
				<img
					src={
						flipped
							? oss + `/tarots/${TAROT_BRAND}/` + card.front + "!cards-350-webp"
							: TAROT_BACK_IMAGE
					}
					alt={card.name}
					className={card.isReversed ? styles.reversed : ""}
				/>
			</div>
			<Tooltip
				title={
					<>
						<div className={styles["tarot-card-content"]}>
							<div className={styles["tarot-card-name"]}>{`${card.name}${
								card.isReversed ? "-R" : ""
							}`}</div>
							<div className={styles["tarot-card-chinese-name"]}>
								{card.chineseName}
								{card.isReversed ? "(逆位)" : ""}
							</div>
							<div className={styles["positionMeaning"]}>{positionMeaning}</div>
						</div>
					</>
				}
			>
				{flipped && <div className={styles["tarot-card-info"]}></div>}
			</Tooltip>
			<span>{index}</span>
		</div>
	);
};

const DeckCard: React.FC<CardProps> = ({
	card,
	onClick,
	classNameString,
	style,
	index,
}) => {
	const [flipped, setFlipped] = useState<boolean>(true); // 默认为背面状态

	return (
		<div
			key={index}
			className={`${styles["tarot-card"]} ${classNameString}`}
			style={style}
		>
			<div
				className={`${styles["tarot-card-face"]} ${
					flipped ? "" : styles.flipped
				}`}
				onClick={onClick}
			>
				<img
					src={TAROT_BACK_IMAGE}
					alt={card.name}
					className={card.isReversed ? styles.reversed : ""}
				/>
			</div>
		</div>
	);
};

export { Card, DeckCard };