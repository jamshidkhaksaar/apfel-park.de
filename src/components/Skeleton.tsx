"use client";

import { type ReactNode } from "react";

type SkeletonProps = {
  className?: string;
  children?: ReactNode;
};

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-strong ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for product/service cards
 */
export function CardSkeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`tech-card overflow-hidden rounded-2xl ${className}`}
      aria-hidden="true"
    >
      {/* Image placeholder */}
      <div className="aspect-[4/3] w-full animate-pulse bg-surface-strong" />
      
      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        {/* Description */}
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        {/* Price/CTA area */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for testimonial bubbles
 */
export function TestimonialSkeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`tech-card rounded-[2rem] p-6 ${className}`}
      aria-hidden="true"
    >
      {/* Stars */}
      <div className="mb-4 flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-4 rounded-full" />
        ))}
      </div>
      
      {/* Quote */}
      <div className="space-y-2 mb-6">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      
      {/* Author */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for service cards
 */
export function ServiceCardSkeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`tech-card rounded-2xl p-6 ${className}`}
      aria-hidden="true"
    >
      {/* Icon */}
      <Skeleton className="mb-4 h-12 w-12 rounded-xl" />
      {/* Title */}
      <Skeleton className="h-5 w-2/3 mb-2" />
      {/* Description */}
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5 mt-1" />
    </div>
  );
}

/**
 * Skeleton for hero section
 */
export function HeroSkeleton() {
  return (
    <section className="relative overflow-hidden py-16 lg:py-24" aria-hidden="true">
      <div className="container-page grid gap-12 lg:grid-cols-2">
        {/* Left content */}
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-3/4" />
          </div>
          <Skeleton className="h-6 w-full" />
          <div className="flex gap-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-12 w-36 rounded-full" />
          </div>
        </div>
        
        {/* Right card */}
        <div className="tech-card rounded-3xl p-8">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Grid of card skeletons
 */
export function CardGridSkeleton({ 
  count = 4, 
  columns = "lg:grid-cols-4" 
}: { 
  count?: number; 
  columns?: string;
}) {
  return (
    <div className={`grid gap-6 sm:grid-cols-2 ${columns}`}>
      {[...Array(count)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
