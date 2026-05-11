"use client";

interface ArticleImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc: string;
}

export function ArticleImage({ src, alt, fallbackSrc, className }: ArticleImageProps) {
  return (
    <img
      src={src || fallbackSrc}
      alt={alt}
      className={className}
      onError={(event) => {
        if (event.currentTarget.src !== fallbackSrc) {
          event.currentTarget.src = fallbackSrc;
        }
      }}
    />
  );
}
