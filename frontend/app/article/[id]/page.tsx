"use client";
import React, { useEffect, useState } from 'react';
import { ArticleImage } from '@/components/ArticleImage';
import { apiRequest } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, ShieldCheck, Zap, Pencil, Trash2 } from 'lucide-react';

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

const FALLBACK_ARTICLE_IMAGE =
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80";
const AUTH_TOKEN_KEY = "guava_auth_token";
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export default function ArticleDetail() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const canManageArticle = Boolean(
    article &&
      authUser &&
      ((article.author || "").trim().toLowerCase() === authUser.email.toLowerCase() ||
        ADMIN_EMAILS.includes(authUser.email.toLowerCase())),
  );

  const handleDelete = async () => {
    if (!article || !canManageArticle || !confirm("确定删除这篇文章吗？")) {
      return;
    }

    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY) || "";
      await apiRequest(`/api/articles/${article.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      router.push("/");
    } catch (error) {
      console.error("删除文章失败:", error);
      alert(error instanceof Error ? error.message : "删除失败，请检查后端服务");
    }
  };

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY) || "";
        if (token) {
          const meResult = await apiRequest<{ user: AuthUser }>("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null);
          setAuthUser(meResult?.user || null);
        } else {
          setAuthUser(null);
        }

        const data = await apiRequest<Article[]>("/api/articles");
        const found = data.find(a => a.id === Number(params.id));
        setArticle(found || null);
      } catch (error) {
        console.error("获取文章详情失败:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticle();
  }, [params.id]);

  if (isLoading) return <div className="min-h-screen bg-[#FFF1E5] flex items-center justify-center font-serif italic">Syncing with Protocol...</div>;
  if (!article) return <div className="min-h-screen bg-[#FFF1E5] flex items-center justify-center font-serif">Article Not Found.</div>;

  return (
    <div className="min-h-screen bg-[#FFF1E5] text-[#333333] font-serif selection:bg-[#FF8F00] selection:text-white pb-20">
      {/* 顶部导航 */}
      <nav className="border-b border-black/10 px-6 py-4 bg-[#FFF1E5]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 font-sans font-black text-[10px] uppercase tracking-widest hover:text-[#990000] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Network
          </button>
          {canManageArticle && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/?edit=${article?.id ?? ""}`)}
                className="inline-flex items-center gap-1 rounded-sm border border-black/10 px-3 py-2 text-[10px] font-sans font-black uppercase hover:bg-black hover:text-white transition-colors"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1 rounded-sm border border-red-500/20 px-3 py-2 text-[10px] font-sans font-black uppercase text-red-700 hover:bg-red-600 hover:text-white transition-colors"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-20">
        {/* 元数据 */}
        <div className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-[#990000] mb-6 flex items-center gap-2">
          <Zap size={10} fill="currentColor" /> {article.category} / Intelligence Node
        </div>

        {/* 标题 */}
        <h1 className="text-4xl md:text-5xl font-black leading-[1.1] mb-8 italic">
          {article.title}
        </h1>

        <div className="mb-10 overflow-hidden rounded-sm border border-black/10 bg-black/5">
          <ArticleImage
            src={article.image_url || FALLBACK_ARTICLE_IMAGE}
            alt={article.title}
            className="h-[260px] w-full object-cover md:h-[380px]"
            fallbackSrc={FALLBACK_ARTICLE_IMAGE}
          />
        </div>

        {/* 作者与时间 */}
        <div className="flex items-center gap-6 border-y border-black/10 py-6 mb-12 text-[10px] font-sans font-black uppercase opacity-60">
          <span className="flex items-center gap-1.5"><Clock size={12} /> {article.created_at ? new Date(article.created_at).toLocaleDateString() : 'RECENT'}</span>
          <span className="flex items-center gap-1.5">BY: {article.author || 'AGENT_NEON'}</span>
          <span className="flex items-center gap-1.5 text-green-700"><ShieldCheck size={12} /> Verified via ActivityPub</span>
        </div>

        {/* 正文内容 */}
        <div className="prose prose-stone max-w-none">
          <p className="text-xl leading-relaxed text-gray-800 whitespace-pre-wrap first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left">
            {article.content}
          </p>
        </div>

        {/* 底部验证标记 */}
        <div className="mt-20 p-8 border-2 border-dashed border-black/20 bg-black/5 rounded-sm">
          <div className="font-sans font-black text-[9px] uppercase tracking-[0.2em] mb-2 opacity-40">Protocol Verification</div>
          <p className="text-[10px] font-mono opacity-60 break-all leading-tight">
            HASH: {btoa(encodeURIComponent(article.title + article.id)).substring(0, 32).toUpperCase()}
            <br />
            STATUS: PERMANENTLY RECORDED ON GUAVA NETWORK
          </p>
        </div>
      </main>
    </div>
  );
}
