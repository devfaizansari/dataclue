import Link from "next/link";
import Prose from "@/components/pages/Prose";
import { SITE } from "@/lib/site";

export default function PrivacyContent() {
  return (
    <Prose>
      <p className="last-updated">Last updated: June 20, 2026</p>

      <h2>Introduction</h2>
      <p>
        {SITE.name} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates an online
        statistical analysis platform. This Privacy Policy explains how we collect, use, and
        protect information when you use our website and calculator at{" "}
        <Link href="/">dataclue</Link>.
      </p>

      <h2>Information we collect</h2>
      <p>We may collect the following types of information:</p>
      <ul>
        <li>
          <strong className="text-foreground">Analysis data:</strong> When you run a
          statistical test, the dataset and options you provide are transmitted to our servers
          for processing. This data is used solely to perform the analysis you requested.
        </li>
        <li>
          <strong className="text-foreground">Contact information:</strong> If you contact us,
          we collect the name, email address, and message content you submit.
        </li>
        <li>
          <strong className="text-foreground">Usage data:</strong> We may collect standard
          technical information such as browser type, device type, pages visited, and
          approximate location derived from IP address for security and analytics.
        </li>
        <li>
          <strong className="text-foreground">Cookies and local storage:</strong> We use
          browser storage for preferences such as theme (light/dark mode) and admin session
          tokens where applicable.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <p>We use collected information to:</p>
      <ul>
        <li>Run statistical analyses and return results to you</li>
        <li>Operate, maintain, and improve the platform</li>
        <li>Respond to support requests and feedback</li>
        <li>Protect against abuse, fraud, and security threats</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>Data retention</h2>
      <p>
        Analysis datasets are processed transiently to generate results and are not intended
        to be stored long-term for marketing or profiling purposes. Contact form submissions
        may be retained as long as needed to respond to your inquiry. Server logs may be kept
        for a limited period for security and debugging.
      </p>

      <h2>Data sharing</h2>
      <p>
        We do not sell your personal information. We may share data only with trusted service
        providers who help us operate the website (such as hosting providers), when required
        by law, or to protect our rights and users&apos; safety.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, or restrict
        processing of your personal data. To exercise these rights, contact us at{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>

      <h2>Children&apos;s privacy</h2>
      <p>
        Our service is not directed to children under 13. We do not knowingly collect personal
        information from children.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be posted on this
        page with an updated &quot;Last updated&quot; date.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about this Privacy Policy? Reach us at{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> or visit our{" "}
        <Link href="/contact">Contact page</Link>.
      </p>
    </Prose>
  );
}
