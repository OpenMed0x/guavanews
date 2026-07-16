"use client";
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, hardhat, base } from 'wagmi/chains';
import { RainbowKitProvider, connectorsForWallets, lightTheme } from '@rainbow-me/rainbowkit';
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
import '@rainbow-me/rainbowkit/styles.css';

// 1. 配置钱包列表
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet],
    },
  ],
  { 
    appName: 'Guava News', 
    projectId: '00000000000000000000000000000000' // 本地开发暂用假 ID
  }
);

// 2. 配置 Wagmi 传输
const config = createConfig({
  connectors,
  chains: [hardhat, base, mainnet],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
    // 线上真实的 Base 和 Mainnet，使用公开、支持跨域且不收费的公共 RPC 节点
    // 这样不仅解决了报错，还为以后线上用户真正连接钱包做好了准备！
    [base.id]: http('https://mainnet.base.org'),
    [mainnet.id]: http('https://cloudflare-eth.com'),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          // 自定义主题，配合番石榴新闻的米色底
          theme={lightTheme({
            accentColor: '#990000',
            borderRadius: 'none',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}