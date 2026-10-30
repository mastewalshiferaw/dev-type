export default function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`block animate-shimmer rounded-md bg-raised ${className}`} />;
}
