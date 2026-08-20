import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

/**
 * The login form.
 *
 * A plain HTML form posting to a route handler: no client JavaScript, no state,
 * nothing to hydrate. The only thing it reads back is `?error=1`, and the
 * message it prints for that is the same whatever went wrong.
 */
export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; wait?: string }>;
}) {
  const { error, wait } = await searchParams;
  const waiting = Number(wait);

  return (
    <div className="ek-shell flex min-h-[70vh] max-w-[420px] flex-col justify-center py-16">
      <h1 className="text-[28px]">Sign in</h1>
      <p className="mt-2 text-[15px] text-text-light">
        This page is for the person who runs EveryKit. There is nothing here for anyone
        else.
      </p>

      <form method="post" action="/api/admin/login" className="ek-card mt-8 flex flex-col gap-4 p-5">
        {error ? (
          <p role="alert" className="text-[14px] text-danger">
            {Number.isFinite(waiting) && waiting > 0
              ? `Too many attempts. Try again in ${waiting} seconds.`
              : "That did not work. Check the address and the password."}
          </p>
        ) : null}

        <div>
          <label htmlFor="email" className="block text-[14px] font-semibold">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            autoFocus
            className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-[14px] font-semibold">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
          />
        </div>

        <button type="submit" className="ek-btn ek-btn-accent mt-2 justify-center">
          Sign in
        </button>
      </form>
    </div>
  );
}
