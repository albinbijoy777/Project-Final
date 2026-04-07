export default function LoadingPanel({ rows = 3 }) {
  return (
    <div className="panel rounded-[28px] p-6">
      <div className="h-5 w-40 rounded-full bg-white/8 shimmer" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-white/6 bg-white/4 p-4">
            <div className="h-4 w-32 rounded-full bg-white/8 shimmer" />
            <div className="mt-3 h-3 w-full rounded-full bg-white/6 shimmer" />
            <div className="mt-2 h-3 w-2/3 rounded-full bg-white/6 shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
