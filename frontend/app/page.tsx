"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X, Clock, TrendingUp, Lock, Unlock, Zap, Search } from "lucide-react";
import { ArticleImage } from "@/components/ArticleImage";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { GuavaLogo } from "@/components/GuavaLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { useSubscribe } from "@/hooks/useSubscribe";
import { registerFreeArticleAccess, getFreeArticleIds, FREE_ARTICLE_LIMIT } from "@/lib/article-access";
import { apiRequest, getApiBase } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

interface Article {
  id: number;
  title: string;
  content: string;
  category: string;
  author?: string;
  created_at?: string;
  image_url?: string;
}

interface AuthUser {
  id: number;
  email: string;
  is_premium: boolean;
}

const API_BASE = getApiBase();
const AUTH_TOKEN_KEY = "guava_auth_token";
const FALLBACK_ARTICLE_IMAGE =
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80";
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const TRENDS = [
  { rank: 1, topic: "ActivityPub 2.0 协议标准提案", change: "+124%" },
  { rank: 2, topic: "ZK-EVM 主网开发者智库", change: "+89%" },
  { rank: 3, topic: "去中心化科学 (DeSci) 融资报告", change: "+56%" },
  { rank: 4, topic: "RWA 资产链上化法律框架", change: "+32%" },
];

const CATEGORY_MAP: { [key: string]: string } = {
  Medicine: "医学研究",
  Technology: "Technology",
  Finance: "金融投资",
  Literature: "文学艺术",
  Tennis: "职业网球",
  "Network Noise": "网络噪音",
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Technology");
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [freeArticleIds, setFreeArticleIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", imageUrl: "", content: "" });
  const [newPostImageFile, setNewPostImageFile] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState("");
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authToken, setAuthToken] = useState("");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const [stripePending, setStripePending] = useState(false);
  const [billingNotice, setBillingNotice] = useState("");
  const [walletIsSubscribed, setWalletIsSubscribed] = useState(false);
  const [imageUploadPending, setImageUploadPending] = useState(false);
  const { address, isConnected } = useAccount();
  const { handleSubscribe, txHash, isPending: walletSubscribePending, isSuccess: walletSubscribeSuccess } = useSubscribe();
  const subscriptionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const categories = ["Technology", "Finance", "Literature", "Medicine", "Tennis", "Network Noise"];
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const freeArticlesRemaining = Math.max(0, FREE_ARTICLE_LIMIT - freeArticleIds.length);

  const getExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  const refreshFreeArticleState = useCallback(() => {
    setFreeArticleIds(getFreeArticleIds());
  }, []);

  const fetchCurrentUser = async (token: string) => {
    const result = await apiRequest<{ user: AuthUser }>("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = result.user as AuthUser;
    setAuthUser(user);
    return user;
  };

  const syncWalletSubscription = useCallback(async (walletAddress?: string) => {
    if (!walletAddress || !isConnected) {
      setWalletIsSubscribed(false);
      return false;
    }

    try {
      const result = await apiRequest<{ is_active: boolean }>(`/api/wallet-subscriptions/${walletAddress.toLowerCase()}`);
      const nextState = Boolean(result.is_active);
      setWalletIsSubscribed(nextState);
      return nextState;
    } catch (error) {
      console.error("获取钱包订阅状态失败:", error);
      setWalletIsSubscribed(false);
      return false;
    }
  }, [isConnected]);

  const storeAuthSession = async (token: string, user?: AuthUser) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setAuthToken(token);
    if (user) {
      setAuthUser(user);
      return;
    }
    await fetchCurrentUser(token);
  };

  const handleArticleClick = (article: Article) => {
    const normalizedAuthor = (article.author || "").trim().toLowerCase();
    const normalizedEmail = (authUser?.email || "").trim().toLowerCase();
    const canManageArticle = Boolean(
      normalizedEmail && (normalizedAuthor === normalizedEmail || ADMIN_EMAILS.includes(normalizedEmail)),
    );

    if (isSubscribed || canManageArticle) {
      router.push(`/article/${article.id}`);
      return;
    }

    const accessResult = registerFreeArticleAccess(article.id);
    setFreeArticleIds(accessResult.ids);

    if (accessResult.allowed) {
      if (accessResult.consumed) {
        setBillingNotice(`Free article unlocked. ${accessResult.remaining} free read${accessResult.remaining === 1 ? "" : "s"} remaining.`);
      }
      router.push(`/article/${article.id}`);
      return;
    }

    setBillingNotice("You have used your 5 free articles. Subscribe to continue reading full reports.");
    if (subscriptionRef.current) {
      subscriptionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      subscriptionRef.current.classList.add("ring-2", "ring-[#FF8E9E]", "ring-offset-4", "duration-500");
      setTimeout(() => {
        subscriptionRef.current?.classList.remove("ring-2", "ring-[#FF8E9E]", "ring-offset-4");
      }, 2000);
    }
  };

  const handlePublish = async () => {
    if (!newPost.title || !newPost.content) {
      alert("请填写完整内容");
      return;
    }

    try {
      let imageUrl = newPost.imageUrl;

      if (newPostImageFile) {
        setImageUploadPending(true);
        const formData = new FormData();
        formData.append("file", newPostImageFile);
        const uploadResult = await apiRequest<{ image_url: string }>("/api/uploads/image", {
          method: "POST",
          body: formData,
        });
        imageUrl = uploadResult.image_url || "";
      }

      await apiRequest(`/api/articles${editingArticleId ? `/${editingArticleId}` : ""}`, {
        method: editingArticleId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          image_url: imageUrl,
          author: authUser?.email || "UserAddressOrID",
          protocol: "activity-pub",
          category: activeCategory,
        }),
      });
      alert(editingArticleId ? "文章修改成功" : `成功发布到 [${activeCategory}] 分类`);
      setIsModalOpen(false);
      setNewPost({ title: "", imageUrl: "", content: "" });
      setNewPostImageFile(null);
      setNewPostImagePreview("");
      setEditingArticleId(null);
      window.location.reload();
    } catch (error) {
      console.error("发布失败:", error);
      alert(error instanceof Error ? error.message : "发布失败");
    } finally {
      setImageUploadPending(false);
    }
  };

  const openEditModal = (article: Article) => {
    setEditingArticleId(article.id);
    setNewPost({
      title: article.title,
      imageUrl: article.image_url || "",
      content: article.content,
    });
    setActiveCategory(article.category);
    setNewPostImageFile(null);
    setNewPostImagePreview(article.image_url || "");
    setIsModalOpen(true);
  };

  const handleAuthSubmit = async () => {
    if (!authForm.email || !authForm.password) {
      setAuthError("Please enter both email and password.");
      return;
    }

    setAuthPending(true);
    setAuthError("");
    try {
      const result = await apiRequest<{ token: string; user: AuthUser }>(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      await storeAuthSession(result.token, result.user);
      setIsAuthModalOpen(false);
      setAuthForm({ email: "", password: "" });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setAuthPending(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuthToken("");
    setAuthUser(null);
    setIsSubscribed(walletIsSubscribed);
    refreshFreeArticleState();
  };

  const handleStripeSubscribe = async () => {
    if (!authToken) {
      setAuthMode("register");
      setAuthError("Please sign in with email before starting a Stripe subscription.");
      setIsAuthModalOpen(true);
      return;
    }

    setStripePending(true);
    try {
      const result = await apiRequest<{ checkout_url?: string }>("/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          success_url: `${window.location.origin}?billing=success`,
          cancel_url: `${window.location.origin}?billing=cancel`,
        }),
      });
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Stripe checkout failed");
    } finally {
      setStripePending(false);
    }
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      const savedToken = localStorage.getItem(AUTH_TOKEN_KEY) || "";
      const billingState = new URLSearchParams(window.location.search).get("billing");
      if (billingState === "success") {
        setBillingNotice("Stripe checkout completed. Refreshing your subscription status...");
      } else if (billingState === "cancel") {
        setBillingNotice("Stripe checkout was canceled.");
      }

      if (savedToken) {
        try {
          localStorage.setItem(AUTH_TOKEN_KEY, savedToken);
          setAuthToken(savedToken);
          const result = await apiRequest<{ user: AuthUser }>("/api/auth/me", {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          const user = result.user as AuthUser;
          setAuthUser(user);
        } catch {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setAuthToken("");
          setAuthUser(null);
        }
      }
    };

    bootstrapAuth();
    refreshFreeArticleState();
  }, [refreshFreeArticleState]);

  useEffect(() => {
    setIsSubscribed(Boolean(authUser?.is_premium) || walletIsSubscribed);
  }, [authUser, walletIsSubscribed]);

  useEffect(() => {
    if (!isConnected || !address) {
      setWalletIsSubscribed(false);
      return;
    }
    void syncWalletSubscription(address);
  }, [isConnected, address, syncWalletSubscription]);

  useEffect(() => {
    const confirmWalletSubscription = async () => {
      if (!walletSubscribeSuccess || !isConnected || !address) {
        return;
      }

      try {
        await apiRequest("/api/wallet-subscriptions/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet_address: address,
            tx_hash: txHash ?? null,
          }),
        });
        await syncWalletSubscription(address);
        setBillingNotice("Wallet subscription confirmed for the connected address.");
      } catch (error) {
        console.error("确认钱包订阅失败:", error);
        setBillingNotice("Wallet payment succeeded, but subscription sync needs a retry.");
      }
    };

    void confirmWalletSubscription();
  }, [walletSubscribeSuccess, isConnected, address, txHash, syncWalletSubscription]);

  const getArticlePreview = (content: string) => {
    const normalized = content.replace(/\s+/g, " ").trim();
    if (normalized.length <= 120) {
      return normalized;
    }
    return `${normalized.slice(0, 120)}...`;
  };

  const getSearchScore = useCallback((article: Article, query: string) => {
    if (!query) {
      return 0;
    }

    const normalizedTitle = article.title.toLowerCase();
    const normalizedContent = article.content.toLowerCase();
    const normalizedAuthor = (article.author || "").toLowerCase();
    const normalizedCategory = article.category.toLowerCase();

    let score = 0;
    if (normalizedTitle.includes(query)) {
      score += 10;
    }
    if (normalizedCategory.includes(query)) {
      score += 6;
    }
    if (normalizedAuthor.includes(query)) {
      score += 4;
    }
    if (normalizedContent.includes(query)) {
      score += 2;
    }
    return score;
  }, []);

  const getHighlightedText = useCallback((text: string, query: string) => {
    if (!query) {
      return text;
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(${escapedQuery})`, "ig");
    const parts = text.split(pattern);

    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <mark key={`${part}-${index}`} className="bg-[#FFDF8C] px-0.5 text-black">
            {part}
          </mark>
        );
      }
      return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    });
  }, []);

  const getHighlightedPreview = useCallback((content: string, query: string) => {
    const normalized = content.replace(/\s+/g, " ").trim();
    if (!query) {
      return getArticlePreview(content);
    }

    const matchIndex = normalized.toLowerCase().indexOf(query.toLowerCase());
    if (matchIndex === -1) {
      return getArticlePreview(content);
    }

    const start = Math.max(0, matchIndex - 36);
    const end = Math.min(normalized.length, matchIndex + query.length + 72);
    const snippet = normalized.slice(start, end);
    const prefix = start > 0 ? "..." : "";
    const suffix = end < normalized.length ? "..." : "";
    return `${prefix}${snippet}${suffix}`;
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const result = await apiRequest<Article[]>("/api/articles");
        const rawData = Array.isArray(result) ? result : [];
        const targetCategory = CATEGORY_MAP[activeCategory] || activeCategory;

        const filtered = rawData
          .filter((a: Article) => {
            if (normalizedSearchQuery) {
              return true;
            }
            return a.category === activeCategory || a.category === targetCategory;
          })
          .filter((a: Article) => {
            if (!normalizedSearchQuery) {
              return true;
            }

            const haystack = [a.title, a.content, a.author, a.category]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return haystack.includes(normalizedSearchQuery);
          })
          .sort((a: Article, b: Article) => {
            if (normalizedSearchQuery) {
              const scoreDifference =
                getSearchScore(b, normalizedSearchQuery) - getSearchScore(a, normalizedSearchQuery);
              if (scoreDifference !== 0) {
                return scoreDifference;
              }
            }
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          });

        setArticles(filtered);

        const editArticleId = Number(new URLSearchParams(window.location.search).get("edit"));
        if (editArticleId) {
          const targetArticle = filtered.find((article: Article) => article.id === editArticleId);
          if (targetArticle) {
            openEditModal(targetArticle);
            window.history.replaceState({}, "", window.location.pathname);
          }
        }
      } catch (error) {
        console.error("获取新闻失败:", error);
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (mounted) {
      void fetchArticles();
    }
  }, [activeCategory, mounted, normalizedSearchQuery, getSearchScore]);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#FFF1E5]" />;
  }

  return (
    <div className="min-h-screen bg-[#FFF1E5] text-[#333333] font-serif transition-all duration-700 selection:bg-[#FF8F00] selection:text-white">
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
        <aside
          className={`absolute top-0 left-0 h-full w-[280px] bg-white shadow-2xl transition-transform duration-500 transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="p-6 flex justify-between items-center border-b border-black/5">
            <span className="font-sans font-black text-[10px] uppercase tracking-[0.3em]">Quick Access</span>
            <X size={20} className="cursor-pointer" onClick={() => setIsMenuOpen(false)} />
          </div>
          <nav className="p-6 space-y-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left font-sans font-black uppercase text-sm hover:text-[#990000]"
              >
                {cat}
              </button>
            ))}
          </nav>
        </aside>
      </div>

      <nav className="border-b border-black/10 px-6 py-1.5 flex justify-between items-center text-[9px] font-sans font-black uppercase tracking-[0.2em] bg-[#FFF1E5]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex gap-6 items-center">
          <Menu size={16} className="cursor-pointer" onClick={() => setIsMenuOpen(true)} />
          <span className="hidden md:inline font-serif font-bold italic">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {authUser ? (
            <div className="hidden md:flex items-center gap-2 border border-black px-2.5 py-1 bg-white text-[9px] font-sans font-black uppercase tracking-[0.2em]">
              <span className="max-w-[160px] truncate">{authUser.email}</span>
              <button onClick={handleLogout} className="text-[#990000] hover:text-black transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 border border-black px-2.5 py-1 hover:bg-black hover:text-white transition-all"
            >
              <span>Email Login</span>
            </button>
          )}
          <button
            onClick={async () => {
              if (confirm("确定清理所有测试数据和重复文章吗？")) {
                try {
                  await fetch(`${API_BASE}/api/articles/clear-test-data`, { method: "DELETE" });
                  setArticles([]);
                  window.location.reload();
                } catch (err) {
                  console.error("Cleanup failed:", err);
                  alert("清理失败，请检查后端服务是否运行");
                }
              }
            }}
            className="hidden md:flex items-center gap-1.5 border border-red-500/30 px-2.5 py-1 text-red-600 hover:bg-red-500 hover:text-white transition-all text-[9px] tracking-tighter"
          >
            <span>WIPE TEST DATA</span>
          </button>
          <button
            onClick={() => {
              setEditingArticleId(null);
              setNewPost({ title: "", imageUrl: "", content: "" });
              setNewPostImageFile(null);
              setNewPostImagePreview("");
              setIsModalOpen(true);
            }}
            className="hidden md:flex items-center gap-1.5 border border-black px-2.5 py-1 hover:bg-black hover:text-white transition-all"
          >
            <Zap size={10} fill="currentColor" />
            <span>Submit</span>
          </button>
          <CustomConnectButton />
        </div>
      </nav>

      <header className="py-12 text-center border-b border-black/10 mx-6">
        <div className="inline-flex items-center gap-6">
          <GuavaLogo size={58} />
          <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight uppercase leading-none opacity-95 select-none text-center">
            GUAVA
          </h1>
        </div>
        <p className="mt-4 font-sans text-[10px] font-black uppercase tracking-[0.6em] opacity-40 italic">
          Global Consensus & Intelligence Network
        </p>
      </header>

      <div className="mx-6 border-b-2 border-black py-4 sticky top-[49px] bg-[#FFF1E5] z-40">
        <div className="max-w-[1300px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <ul className="flex justify-center gap-10 font-sans text-xl font-black uppercase tracking-widest overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => setActiveCategory(cat)}
                  className={`transition-all duration-300 relative pb-1 whitespace-nowrap ${activeCategory === cat ? "text-[#990000]" : "text-black/80 hover:text-black"}`}
                >
                  {cat}
                  {activeCategory === cat && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#990000]" />}
                </button>
              </li>
            ))}
          </ul>

          <div className="relative group w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60 group-focus-within:text-[#990000] transition-colors" />
            <input
              type="text"
              placeholder="SEARCH INTELLIGENCE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/5 border-none py-2 pl-9 pr-4 font-sans text-[10px] font-bold tracking-widest focus:outline-none focus:bg-black/10 transition-all rounded-sm uppercase"
            />
          </div>
        </div>
      </div>

      <main className="max-w-[1300px] mx-auto px-6 py-12 grid grid-cols-12 gap-12 min-h-[60vh]">
        <div className="col-span-12 lg:col-span-8 space-y-12">
          {isLoading ? (
            <div className="py-20 text-center font-sans animate-pulse">Syncing with Protocol...</div>
          ) : articles.length > 0 ? (
            articles.map((article) => {
              const normalizedAuthor = (article.author || "").trim().toLowerCase();
              const normalizedEmail = (authUser?.email || "").trim().toLowerCase();
              const canManageArticle = Boolean(
                normalizedEmail && (normalizedAuthor === normalizedEmail || ADMIN_EMAILS.includes(normalizedEmail)),
              );
              const articleIsUnlocked = isSubscribed || canManageArticle || freeArticleIds.includes(article.id);
              const articleCanBeOpened = articleIsUnlocked || freeArticlesRemaining > 0;
              const accessLabel = isSubscribed
                ? "Full Access"
                : articleIsUnlocked
                  ? "Unlocked"
                  : articleCanBeOpened
                    ? `${freeArticlesRemaining} Free Read${freeArticlesRemaining === 1 ? "" : "s"} Left`
                    : "Premium Required";

              return (
              <article
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="group cursor-pointer border-b border-black/5 pb-10 flex flex-col md:flex-row gap-8 items-start transition-opacity hover:opacity-80 rounded-sm"
              >
                <div className="w-full md:w-44 shrink-0">
                  <div className="aspect-[4/3] overflow-hidden rounded-sm border border-black/10 bg-black/5">
                    <ArticleImage
                      src={article.image_url || FALLBACK_ARTICLE_IMAGE}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      fallbackSrc={FALLBACK_ARTICLE_IMAGE}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#990000] flex items-center gap-2">
                      <Zap size={10} fill="currentColor" /> {article.category} / Intelligence
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight mb-4 flex items-center gap-2 group-hover:underline decoration-1 decoration-[#990000]">
                    <span>{getHighlightedText(article.title, normalizedSearchQuery)}</span>
                    {articleCanBeOpened ? (
                      <Unlock
                        size={18}
                        className={`${articleIsUnlocked ? "text-green-600" : "text-[#990000]"} shrink-0 transform translate-y-1`}
                      />
                    ) : (
                      <Lock size={18} className="text-gray-300 shrink-0 transform translate-y-1" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 font-serif opacity-80 italic">
                    {getHighlightedText(getHighlightedPreview(article.content, normalizedSearchQuery), normalizedSearchQuery)}
                  </p>
                  <div className="mt-6 flex items-center gap-4 text-[10px] font-sans font-bold uppercase opacity-40">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {article.created_at ? new Date(article.created_at).toLocaleDateString() : "RECENT"}
                    </span>
                    <span className="flex items-center gap-1">BY: {article.author || "AGENT_NEON"}</span>
                    <span className={articleCanBeOpened ? "text-black" : "text-[#990000] italic"}>
                      {accessLabel}
                    </span>
                  </div>
                </div>
              </article>
              );
            })
          ) : (
            <div className="py-20 text-center font-serif italic opacity-40">
              {searchQuery.trim()
                ? `No matching articles found for "${searchQuery}" across the network.`
                : `No intelligence recorded in [${activeCategory}] segment yet.`}
            </div>
          )}
        </div>

        <aside className="col-span-12 lg:col-span-4 space-y-10">
          <section
            id="subscription"
            ref={subscriptionRef}
            className={`p-8 border-t-2 transition-all duration-700 rounded-sm sticky top-[120px] ${isSubscribed ? "bg-white border-green-600 text-black shadow-lg" : "bg-black border-[#990000] text-[#FFF1E5]"}`}
          >
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h4 className="font-sans font-bold text-[9px] uppercase tracking-[0.2em] opacity-50 mb-1">
                  Guava Premium Access
                </h4>
                <div className="text-2xl font-bold italic leading-none tracking-tighter">
                  {isSubscribed ? "Welcome back, Subscriber." : "Subscribe with email and Stripe."}
                </div>
              </div>
              <Zap size={14} className={isSubscribed ? "text-green-600" : "text-[#990000]"} fill="currentColor" />
            </div>

            {isSubscribed ? (
              <div className="space-y-6">
                <p className="text-[11px] leading-relaxed text-gray-700 font-serif italic border-l-2 border-green-500 pl-3">
                  Your premium access is active. Full reports are now unlocked across the site.
                </p>
                <div className="pt-4 border-t border-black/5 space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-sans font-black uppercase opacity-40 tracking-widest">Total Duration</span>
                      <span className="text-xl font-black font-sans text-black italic leading-none">30 DAYS</span>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <span className="text-[9px] font-sans font-black uppercase opacity-40 tracking-widest text-[#990000]">
                        Terminates On
                      </span>
                      <span className="text-sm font-bold font-sans text-[#990000] tracking-tight underline decoration-red-200 underline-offset-4">
                        {getExpiryDate()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-[11px] opacity-70 leading-relaxed font-serif">
                  New readers can unlock {FREE_ARTICLE_LIMIT} articles for free. After that, use your email account and Stripe checkout to continue with full premium access.
                </p>
                <div className="rounded-sm border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-white/70">
                  Free Reads Remaining <span className="ml-2 text-white">{freeArticlesRemaining}</span>
                </div>
                <div className="py-4 border-y border-white/10 flex justify-between items-center text-[10px] font-sans font-black uppercase tracking-widest text-white/50">
                  Monthly Pass
                  <span className="text-3xl font-black text-white">$20</span>
                </div>
                <button
                  disabled={stripePending}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStripeSubscribe();
                  }}
                  className="w-full bg-[#990000] text-white py-4 font-sans text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all disabled:opacity-50"
                >
                  {stripePending ? "Starting Stripe..." : "Subscribe With Stripe"}
                </button>
                <button
                  disabled={!isConnected || walletSubscribePending}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe();
                  }}
                  className="w-full border border-white/30 text-white py-4 font-sans text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all disabled:opacity-40"
                >
                  {walletSubscribePending ? "Waiting For Wallet..." : "Use Wallet Prototype"}
                </button>
                {billingNotice && <p className="text-[10px] font-sans opacity-60">{billingNotice}</p>}
                {!isConnected && (
                  <p className="text-[10px] font-sans opacity-60">
                    Wallet subscription status only appears when the paying wallet is connected.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="pt-6 border-t border-black">
            <h4 className="font-sans font-black text-[10px] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <TrendingUp size={14} /> Breaking News
            </h4>
            <div className="space-y-6">
              {TRENDS.map((item) => (
                <div key={item.rank} className="flex gap-4 group cursor-pointer border-b border-black/5 pb-3">
                  <span className="text-xl font-serif font-black opacity-10 group-hover:opacity-100 italic transition-opacity">
                    0{item.rank}
                  </span>
                  <div>
                    <h5 className="text-[13px] font-bold leading-tight mb-1 group-hover:underline">{item.topic}</h5>
                    <div className="text-[8px] font-sans font-bold text-green-700 uppercase tracking-tighter">
                      {item.change} Momentum
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>

      <section className="mx-6 mt-4 border-t border-black/10 pt-6">
        <div className="max-w-[1300px] mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-sans text-[10px] font-black uppercase tracking-[0.3em] text-[#990000]">Language & Documentation</div>
            <p className="mt-2 max-w-2xl text-sm text-black/60">Browse bilingual policy pages and developer-facing API documentation for agents, mobile apps, and enterprise integrations.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-[10px] font-sans font-black uppercase tracking-[0.18em]">
            <Link href="/zh/info/help-centre" className="border border-black/15 px-3 py-2 hover:bg-black hover:text-white transition-colors">中文帮助中心</Link>
            <Link href="/en/info/help-centre" className="border border-black/15 px-3 py-2 hover:bg-black hover:text-white transition-colors">English Help Centre</Link>
            <Link href="/en/info/guava-api-access" className="border border-[#990000]/20 px-3 py-2 text-[#990000] hover:bg-[#990000] hover:text-white transition-colors">API Access</Link>
          </div>
        </div>
      </section>

      <SiteFooter />

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#FFF1E5] border-2 border-black w-full max-w-2xl p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
              <h2 className="text-2xl font-black italic uppercase tracking-tight">
                {editingArticleId ? "Edit Network Story" : "Broadcast to Network"}
              </h2>
              <X size={24} className="cursor-pointer hover:rotate-90 transition-transform" onClick={() => setIsModalOpen(false)} />
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-black">Headline</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-black/20 focus:border-black outline-none py-2 font-serif text-xl italic text-black"
                  placeholder="Enter article title..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-black">Cover Image</label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setNewPostImageFile(file);
                      if (file) {
                        setNewPostImagePreview(URL.createObjectURL(file));
                        setNewPost({ ...newPost, imageUrl: "" });
                      } else {
                        setNewPostImagePreview("");
                      }
                    }}
                    className="block w-full text-[11px] font-sans"
                  />
                  <div className="text-center text-[10px] font-sans uppercase opacity-40">or</div>
                  <input
                    type="url"
                    value={newPost.imageUrl}
                    onChange={(e) => {
                      setNewPost({ ...newPost, imageUrl: e.target.value });
                      setNewPostImageFile(null);
                      setNewPostImagePreview(e.target.value);
                    }}
                    className="w-full bg-transparent border-b-2 border-black/20 focus:border-black outline-none py-2 font-sans text-sm text-black"
                    placeholder="https://example.com/article-cover.jpg"
                  />
                </div>
                {(newPostImagePreview || newPost.imageUrl) && (
                  <div className="mt-4 overflow-hidden rounded-sm border border-black/10 bg-black/5">
                    <ArticleImage
                      src={newPostImagePreview || newPost.imageUrl}
                      alt="Article preview"
                      className="h-40 w-full object-cover"
                      fallbackSrc={FALLBACK_ARTICLE_IMAGE}
                    />
                  </div>
                )}
                <p className="mt-2 text-[10px] font-sans opacity-50">
                  Upload from your computer, or paste a public image link. New uploads can be stored locally or sent to Cloudinary.
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-black">Intelligence Content</label>
                <textarea
                  rows={6}
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full bg-white/50 border-2 border-black/10 focus:border-black outline-none p-4 font-serif text-sm leading-relaxed text-black"
                  placeholder="What's happening in the Fediverse?"
                />
              </div>
              <button
                onClick={handlePublish}
                disabled={imageUploadPending}
                className="w-full bg-[#990000] text-white py-4 font-sans text-xs font-black uppercase tracking-[0.4em] hover:bg-black transition-all"
              >
                {imageUploadPending ? "Uploading Image..." : editingArticleId ? "Save Changes" : "Publish to Protocol"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAuthModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#FFF1E5] border-2 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tight">Email Access</h2>
                <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] opacity-50 mt-2">
                  Register or sign in before Stripe checkout
                </p>
              </div>
              <X size={24} className="cursor-pointer hover:rotate-90 transition-transform" onClick={() => setIsAuthModalOpen(false)} />
            </div>
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAuthMode("register")}
                className={`flex-1 border px-3 py-2 text-[10px] font-sans font-black uppercase tracking-[0.2em] ${authMode === "register" ? "bg-black text-white border-black" : "border-black/20"}`}
              >
                Register
              </button>
              <button
                onClick={() => setAuthMode("login")}
                className={`flex-1 border px-3 py-2 text-[10px] font-sans font-black uppercase tracking-[0.2em] ${authMode === "login" ? "bg-black text-white border-black" : "border-black/20"}`}
              >
                Login
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-black">Email</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full bg-white/70 border border-black/10 focus:border-black outline-none px-4 py-3 font-sans text-sm"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-black">Password</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full bg-white/70 border border-black/10 focus:border-black outline-none px-4 py-3 font-sans text-sm"
                  placeholder="At least 8 characters"
                />
              </div>
              {authError && <p className="text-[11px] font-sans text-[#990000]">{authError}</p>}
              <button
                onClick={handleAuthSubmit}
                disabled={authPending}
                className="w-full bg-[#990000] text-white py-4 font-sans text-xs font-black uppercase tracking-[0.4em] hover:bg-black transition-all disabled:opacity-50"
              >
                {authPending ? "Please Wait" : authMode === "register" ? "Create Account" : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
