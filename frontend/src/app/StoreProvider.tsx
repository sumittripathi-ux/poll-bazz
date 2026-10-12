// "use client";

// import { Provider } from "react-redux";
// import { store } from "../lib/store";

// export default function StoreProvider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return <Provider store={store}>{children}</Provider>;
// }

"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "../lib/store";
import type { AppStore } from "../lib/store";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store] = useState<AppStore>(() => makeStore());

  return <Provider store={store}>{children}</Provider>;
}
