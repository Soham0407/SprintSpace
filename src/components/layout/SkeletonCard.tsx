const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`bg-card border border-white/5 rounded-2xl p-6 animate-pulse ${className}`}>
    <div className="h-3 w-20 bg-white/5 rounded mb-4" />
    <div className="h-4 w-3/4 bg-white/10 rounded mb-6" />
    <div className="space-y-2 mb-6">
      <div className="h-2.5 w-full bg-white/5 rounded" />
      <div className="h-2.5 w-5/6 bg-white/5 rounded" />
      <div className="h-2.5 w-2/3 bg-white/5 rounded" />
    </div>
    <div className="h-2.5 w-16 bg-white/5 rounded" />
  </div>
);

export default SkeletonCard;
