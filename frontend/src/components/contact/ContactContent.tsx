import Link from "next/link";
import { SITE } from "@/lib/site";

export default function ContactContent() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-foreground">Get in touch</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Have a question, bug report, or feature request? We&apos;d love to hear from you.
        </p>

        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="font-medium text-foreground">Email</dt>
            <dd className="mt-1">
              <a
                href={`mailto:${SITE.contactEmail}`}
                className="text-primary hover:text-primary-dark"
              >
                {SITE.contactEmail}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">FAQ</dt>
            <dd className="mt-1 text-muted">
              Check our{" "}
              <Link href="/faq" className="text-primary hover:text-primary-dark">
                frequently asked questions
              </Link>{" "}
              for quick answers.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Response time</dt>
            <dd className="mt-1 text-muted">We typically respond within 1–2 business days.</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
