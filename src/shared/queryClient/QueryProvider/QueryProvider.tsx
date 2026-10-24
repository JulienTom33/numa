import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { createQueryClient } from "../createQueryClient/createQueryClient";

interface Props {
  children: ReactNode;
}

export function QueryProvider({ children }: Props) {
  const [client] = useState(createQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export default QueryProvider;
