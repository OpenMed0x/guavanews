"use client";

import Image from "next/image";
import { useState } from "react";

interface ArticleImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc: string;
}

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc: string;
}

function ImageWithFallback({ src, alt, className, fallbackSrc }: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <Image
      src={hasError ? fallbackSrc : src}
      alt={alt}
      width={1200}
      height={900}
      unoptimized
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

export function ArticleImage({ src, alt, fallbackSrc, className }: ArticleImageProps) {
  const normalizedSrc = src || fallbackSrc;

  return (
    <ImageWithFallback
      key={normalizedSrc}
      src={normalizedSrc}
      alt={alt}
      className={className}
      fallbackSrc={fallbackSrc}
    />
  );
}
