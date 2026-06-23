import Link from "next/link";
import Prose from "@/components/pages/Prose";
import { SITE } from "@/lib/site";

export default function TermsContent() {
  return (
    <Prose>
      <p className="last-updated">Last updated: June 20, 2026</p>

      <h2>Agreement to terms</h2>
      <p>
        By accessing or using {SITE.name}, you agree to be bound by these Terms of Use. If you
        do not agree, please do not use the service.
      </p>

      <h2>Description of service</h2>
      <p>
        {SITE.name} provides browser-based statistical calculators and related educational
        content. Results are generated using automated statistical methods and are intended as
        analytical aids, not as a substitute for professional statistical consultation.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the service for any unlawful purpose</li>
        <li>Attempt to disrupt, overload, or compromise our systems</li>
        <li>Scrape, reverse engineer, or misuse the platform without permission</li>
        <li>Submit malicious code or content through forms or data inputs</li>
        <li>Misrepresent results as human-verified professional advice</li>
      </ul>

      <h2>Your data and responsibilities</h2>
      <p>
        You are responsible for the data you submit for analysis. Do not upload data you are
        not authorized to process, including sensitive personal data unless you have a lawful
        basis to do so. You retain ownership of your data; you grant us a limited license to
        process it solely to provide the requested analysis.
      </p>

      <h2>Disclaimer of warranties</h2>
      <p>
        The service is provided &quot;as is&quot; and &quot;as available&quot; without
        warranties of any kind. We do not guarantee that results are error-free, complete, or
        suitable for any particular research, clinical, or business decision. Always verify
        critical findings with appropriate domain expertise.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {SITE.name} and its operators shall not be
        liable for any indirect, incidental, special, or consequential damages arising from your
        use of the service, including reliance on analysis output.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The {SITE.name} name, logo, website design, and original content are our intellectual
        property. Blog content and branding may not be copied or redistributed without
        permission, except where otherwise noted.
      </p>

      <h2>Third-party links</h2>
      <p>
        Our website may link to third-party sites. We are not responsible for the content or
        practices of those external sites.
      </p>

      <h2>Termination</h2>
      <p>
        We may suspend or terminate access to the service at any time for violations of these
        terms or for operational reasons, with or without notice.
      </p>

      <h2>Changes to terms</h2>
      <p>
        We may revise these Terms of Use at any time. Continued use of the service after
        changes are posted constitutes acceptance of the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these terms, contact us at{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> or via our{" "}
        <Link href="/contact">Contact page</Link>. See also our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </Prose>
  );
}
