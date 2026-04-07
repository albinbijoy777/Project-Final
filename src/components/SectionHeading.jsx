export default function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
