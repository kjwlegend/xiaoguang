"use client";

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";

import React, { useState, useEffect } from "react";
import {
  AliwangwangOutlined,
  UsergroupAddOutlined,
  HighlightOutlined,
  ContainerOutlined,
} from "@ant-design/icons";

import type { MenuProps } from "antd";
import LoadingIcon from "../icons/three-dots.svg";
import { useAppConfig } from "../store/config";
import { useMobileScreen } from "../utils";

const items = [
  {
    label: "对话",
    title: "对话",
    key: "chat",
    icon: <AliwangwangOutlined />,
    url: "/chat",
  },
  {
    label: "介绍",
    key: "intro",
    icon: <ContainerOutlined />,
    url: "/intro",
  },
  {
    label: "助手(开发中)",
    key: "assistant",
    icon: <UsergroupAddOutlined />,
    disabled: true,
    url: "/assistant",
  },
  {
    label: "绘画(开发中)",
    key: "draw",
    icon: <HighlightOutlined />,
    disabled: true,
    url: "/draw",
  },
  {
    label: "商城(开发中)",
    key: "mall",
    disabled: true,
    url: "/mall",
  },
];

import { Layout, Menu, Button } from "antd";

import styles from "./header.module.scss";

const { Header } = Layout;

export function MainNav() {
  const location = useLocation();
  const [current, setCurrent] = useState(() => {
    const current = location.pathname.slice(1);
    return current || "chat";
  });

  // 等待样式表加载完后, 再显示
  const [show, setShow] = useState(false);
  setTimeout(() => {
    setShow(true);
  }, 200);

  const onClick: MenuProps["onClick"] = (e) => {
    setCurrent(e.key);
  };

  if (!show) {
    return <LoadingIcon />;
  }

  return (
    <Header className={styles.header}>
      <div className={styles.logo}>
        <img className={styles["logo-image"]} src="/logo-2.png" alt="Logo" />
        <div className={styles["logo-text"]}>
          <p className={styles["headline"]}>小光AI</p>
          <p className={styles["subline"]}>XIAOGUANG.AI</p>
        </div>
      </div>
      <div className={styles["ant-menu"]}>
        <Menu
          onClick={onClick}
          selectedKeys={[current]}
          mode="horizontal"
          style={{ backgroundColor: "transparent", height: "50px" }}
          className={styles["ant-menu"]}
        >
          {items.map((item) => {
            if (item.disabled) {
              return (
                <Menu.Item key={item.key} disabled>
                  {item.icon}
                  {item.label}
                </Menu.Item>
              );
            }
            return (
              <Menu.Item key={item.key}>
                <Link to={item.url}>
                  {item.icon}
                  {item.label}
                </Link>
              </Menu.Item>
            );
          })}
        </Menu>
      </div>

      {/* <div className={styles["login-register"]}>
          <Button type="primary">Login / Register</Button>
        </div> */}
    </Header>
  );
}
