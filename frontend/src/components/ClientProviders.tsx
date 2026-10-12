// "use client";

// import dynamic from "next/dynamic";

// const StoreProvider = dynamic(() => import("./StoreProvider"), { ssr: false });

// export default function ClientProviders({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return <StoreProvider>{children}</StoreProvider>;
// }

"use client";

import StoreProvider from "@/app/StoreProvider";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StoreProvider>{children}</StoreProvider>;
}
