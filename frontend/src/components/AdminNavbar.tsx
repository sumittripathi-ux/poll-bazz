"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, Menu, Space, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";

import { useGetCurrentUserQuery, apiSlice } from "@/lib/apiSlice";
import { logout } from "@/lib/authSlice";
import type { RootState } from "@/lib/store";

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const token = useSelector((state: RootState) => state.auth.token);

  const { data: user } = useGetCurrentUserQuery(undefined, {
    skip: !token,
  });

  const selectedKey = pathname.startsWith("/admin/questions")
    ? "/admin/questions"
    : "/admin/users";

  const menuItems = [
    {
      key: "/admin/users",
      label: <Link href="/admin/users">Users</Link>,
    },
    {
      key: "/admin/questions",
      label: <Link href="/admin/questions">Questions</Link>,
    },
  ];

  const handleLogout = () => {
    dispatch(logout());
    dispatch(apiSlice.util.resetApiState());
    router.replace("/login");
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "#172554",
        color: "#fff",
        borderBottom: "1px solid #334155",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          minHeight: 72,
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/admin/users"
          style={{ color: "#fff", textDecoration: "none" }}
        >
          <Typography.Title
            level={4}
            style={{ color: "#fff", margin: 0, whiteSpace: "nowrap" }}
          >
            Poll Bazz
          </Typography.Title>
        </Link>

        <div style={{ flex: "1 1 280px", minWidth: 220 }}>
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{
              background: "transparent",
              color: "#fff",
              borderBottom: 0,
            }}
          />
        </div>

        <Space wrap>
          <Typography.Text style={{ color: "#e2e8f0" }}>
            {user?.username ?? "Admin"}
          </Typography.Text>

          <Button onClick={handleLogout}>Logout</Button>
        </Space>
      </div>
    </header>
  );
}
