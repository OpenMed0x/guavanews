export const FREE_ARTICLE_LIMIT = 5;

const FREE_ARTICLE_STORAGE_KEY = "guava_free_article_ids";

type AccessResult = {
  allowed: boolean;
  ids: number[];
  remaining: number;
  consumed: boolean;
};

function normalizeArticleIds(ids: unknown): number[] {
  if (!Array.isArray(ids)) {
    return [];
  }

  return Array.from(
    new Set(
      ids
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  ).slice(0, FREE_ARTICLE_LIMIT);
}

export function getFreeArticleIds(): number[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return normalizeArticleIds(JSON.parse(window.localStorage.getItem(FREE_ARTICLE_STORAGE_KEY) || "[]"));
  } catch {
    return [];
  }
}

export function setFreeArticleIds(ids: number[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FREE_ARTICLE_STORAGE_KEY, JSON.stringify(normalizeArticleIds(ids)));
}

export function getRemainingFreeArticles(): number {
  return Math.max(0, FREE_ARTICLE_LIMIT - getFreeArticleIds().length);
}

export function isFreeArticleUnlocked(articleId: number): boolean {
  return getFreeArticleIds().includes(articleId);
}

export function registerFreeArticleAccess(articleId: number): AccessResult {
  const ids = getFreeArticleIds();

  if (ids.includes(articleId)) {
    return {
      allowed: true,
      ids,
      remaining: Math.max(0, FREE_ARTICLE_LIMIT - ids.length),
      consumed: false,
    };
  }

  if (ids.length >= FREE_ARTICLE_LIMIT) {
    return {
      allowed: false,
      ids,
      remaining: 0,
      consumed: false,
    };
  }

  const nextIds = [...ids, articleId];
  setFreeArticleIds(nextIds);

  return {
    allowed: true,
    ids: nextIds,
    remaining: Math.max(0, FREE_ARTICLE_LIMIT - nextIds.length),
    consumed: true,
  };
}
