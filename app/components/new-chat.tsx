import { useEffect, useRef, useState } from "react";
import { Path, SlotID } from "../constant";
import styles from "./new-chat.module.scss";

import {
  EditOutlined,
  EllipsisOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Avatar, Card, Skeleton, Switch, Button, Row } from "antd";
const { Meta } = Card;
import { IconButton } from "./button";
import { EmojiAvatar } from "./emoji";
import LeftIcon from "../icons/left.svg";
import LightningIcon from "../icons/lightning.svg";
import EyeIcon from "../icons/eye.svg";

import { useLocation, useNavigate } from "react-router-dom";
import {
  Mask,
  useMaskStore,
  createEmptyMask,
  DEFAULT_MASK_ID,
} from "../store/mask";
import Locale from "../locales";
import { useAppConfig, useChatStore } from "../store";
import { MaskAvatar } from "./mask";
import { useCommand } from "../command";
import { showConfirm } from "./ui-lib";
import { BUILTIN_MASK_STORE } from "../masks";
import Image from "next/image";

function getIntersectionArea(aRect: DOMRect, bRect: DOMRect) {
  const xmin = Math.max(aRect.x, bRect.x);
  const xmax = Math.min(aRect.x + aRect.width, bRect.x + bRect.width);
  const ymin = Math.max(aRect.y, bRect.y);
  const ymax = Math.min(aRect.y + aRect.height, bRect.y + bRect.height);
  const width = xmax - xmin;
  const height = ymax - ymin;
  const intersectionArea = width < 0 || height < 0 ? 0 : width * height;
  return intersectionArea;
}

function MaskItem(props: { mask: Mask; onClick?: () => void }) {
  return (
    <div className={styles["mask"]} onClick={props.onClick}>
      <MaskAvatar mask={props.mask} />
      <div className={styles["mask-name"] + " one-line"}>{props.mask.name}</div>
    </div>
  );
}

function useMaskGroup(masks: Mask[]) {
  const [groups, setGroups] = useState<Mask[][]>([]);

  useEffect(() => {
    const computeGroup = () => {
      const appBody = document.getElementById(SlotID.AppBody);
      if (!appBody || masks.length === 0) return;

      const rect = appBody.getBoundingClientRect();
      const maxWidth = rect.width;
      const maxHeight = rect.height * 0.6;
      const maskItemWidth = 120;
      const maskItemHeight = 50;

      const randomMask = () => masks[Math.floor(Math.random() * masks.length)];
      let maskIndex = 0;
      const nextMask = () => masks[maskIndex++ % masks.length];

      const rows = Math.ceil(maxHeight / maskItemHeight);
      const cols = Math.ceil(maxWidth / maskItemWidth);

      const newGroups = new Array(rows)
        .fill(0)
        .map((_, _i) =>
          new Array(cols)
            .fill(0)
            .map((_, j) => (j < 1 || j > cols - 2 ? randomMask() : nextMask())),
        );

      setGroups(newGroups);
    };

    computeGroup();

    window.addEventListener("resize", computeGroup);
    return () => window.removeEventListener("resize", computeGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return groups;
}

function featureMaskGroup(masks: Mask[]) {
  const featureMasks = masks.filter((mask) => mask.featureMask);
  return [...featureMasks];
}

function FeatureMaskItem(mask: Mask, startChat: (mask?: Mask) => void) {
  return (
    <>
      <Card
        style={{ maxWidth: 400 }}
        title={mask.name}
        extra={<span className={"label"}>{mask.category}</span>}
        hoverable
        actions={[
          <Button key={mask.id} type="primary" onClick={() => startChat(mask)}>
            开始聊天
          </Button>,
          <span key={mask.id}>角色等级: {mask.version} </span>,
        ]}
        key={mask.id}
      >
        <div className={styles["mask-item"]}>
          <img src={mask.img} alt={mask.name} />

          <div className={styles.description}>
            <p>{mask.constellation}</p>
            <p style={{ whiteSpace: "pre-line" }}>{mask.description}</p>
          </div>
        </div>
      </Card>
    </>
  );
}

export function NewChat() {
  const chatStore = useChatStore();
  const maskStore = useMaskStore();

  const masks = maskStore.getAll();
  const groups = useMaskGroup(masks);
  const featureGroup = featureMaskGroup(masks);

  const navigate = useNavigate();
  const config = useAppConfig();

  const maskRef = useRef<HTMLDivElement>(null);

  const { state } = useLocation();

  const startChat = (mask?: Mask) => {
    setTimeout(() => {
      chatStore.newSession(mask);
      navigate(Path.Chat);
    }, 10);
  };

  useCommand({
    mask: (id) => {
      try {
        const intId = parseInt(id);
        const mask = maskStore.get(intId) ?? BUILTIN_MASK_STORE.get(intId);
        startChat(mask ?? undefined);
      } catch {
        console.error("[New Chat] failed to create chat from mask id=", id);
      }
    },
  });

  useEffect(() => {
    if (maskRef.current) {
      maskRef.current.scrollLeft =
        (maskRef.current.scrollWidth - maskRef.current.clientWidth) / 2;
    }
  }, [groups]);

  return (
    <div className={styles["new-chat"]}>
      <div className={styles["mask-intro"]}>
        <div className={styles["title"]}>{Locale.NewChat.Title}</div>
        <div className={styles["sub-title"]}>{Locale.NewChat.SubTitle}</div>
        <div className={styles["actions"]}>
          <IconButton
            icon={<LeftIcon />}
            text={Locale.NewChat.Return}
            onClick={() => navigate(Path.Home)}
            bordered
            shadow
          ></IconButton>
          <IconButton
            text={Locale.NewChat.Skip}
            onClick={() => startChat()}
            icon={<LightningIcon />}
            type="primary"
            shadow
            className={"primary"}
          />
          <IconButton
            text={Locale.NewChat.More}
            onClick={() => navigate(Path.Masks)}
            icon={<EyeIcon />}
            bordered
            shadow
          />

          {!state?.fromHome && (
            <IconButton
              text={Locale.NewChat.NotShow}
              onClick={async () => {
                if (await showConfirm(Locale.NewChat.ConfirmNoShow)) {
                  startChat();
                  config.update(
                    (config) => (config.dontShowMaskSplashScreen = true),
                  );
                }
              }}
              icon={<EyeIcon />}
              shadow
            ></IconButton>
          )}
        </div>
      </div>
      <Row
        gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}
        justify="center"
        className={styles["feature-masks"]}
      >
        <Card
          style={{ maxWidth: 400 }}
          title="小光(通用)"
          extra={<span className={"label"}>通用</span>}
          hoverable
          actions={[
            <Button
              key={DEFAULT_MASK_ID}
              type="primary"
              onClick={() => startChat()}
            >
              开始聊天
            </Button>,
            <span key={DEFAULT_MASK_ID}>角色等级: Lv2 </span>,
          ]}
          key={DEFAULT_MASK_ID}
        >
          <div className={styles["mask-item"]}>
            <Image src="/ai-full.png" alt="小光同学" width={100} height={200} />

            <div className={styles.description}>
              <p>天蝎座 (11-07)</p>
              <p style={{ whiteSpace: "pre-line" }}>
                一个乐观向上的朋友,善于倾听并提供支持和鼓励,具有多才多艺的能力,无论你需要什么帮助，小光都会陪伴在你身边。
                <br />
                <br />
                座右铭: &quot;你要相信光&quot;
              </p>
            </div>
          </div>
        </Card>
        {featureGroup.map((mask) => FeatureMaskItem(mask, startChat))}
      </Row>
    </div>
  );
}
