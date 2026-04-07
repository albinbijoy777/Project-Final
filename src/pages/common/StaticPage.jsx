import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import AppFooter from "../../components/AppFooter.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { BLOG_POSTS, STATIC_PAGES } from "../../data/siteContent.js";
import { getDashboardPath } from "../../utils/routes.js";

export default function StaticPage({ pageKey }) {
  const { profile, user } = useAuth();
  const page = STATIC_PAGES[pageKey];
  const backTarget = user ? getDashboardPath(profile?.role) : "/login";

  if (pageKey === "blog") {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <Link to={backTarget} className="inline-flex items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <div className="mt-10">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Platform insights</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Operations and service growth blog</h1>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {BLOG_POSTS.map((post) => (
                <Motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="panel rounded-[28px] p-6"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">{post.category}</p>
                  <h2 className="mt-3 text-xl font-semibold text-white">{post.title}</h2>
                  <p className="mt-4 text-sm leading-7 text-slate-400">{post.excerpt}</p>
                </Motion.article>
              ))}
            </div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          to={backTarget}
          className="inline-flex items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <Motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-10 panel rounded-[34px] p-8 sm:p-10">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">{page?.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">{page?.title}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300">{page?.intro}</p>

          <div className="mt-10 space-y-8">
            {page?.sections?.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-semibold text-white">{section.heading}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{section.body}</p>
              </section>
            ))}
          </div>
        </Motion.div>
      </div>
      <AppFooter />
    </div>
  );
}
