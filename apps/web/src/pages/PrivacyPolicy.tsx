import { AnimatedSection } from "@/components/animated-section";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <AnimatedSection>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Effective March 4, 2025</p>

          <h2 className="text-2xl font-bold mb-4">Introduction</h2>
          <p className="mb-6">
            North Mirror LLC is a company dedicated to helping entrepreneurs gain clarity and move rapidly to market validation through our InnerFlame platform.
          </p>
          <p className="mb-6">
            This Privacy Policy explains how we collect, use, disclose, and process your personal data when you use our website and other services where North Mirror LLC acts as a data controller—for example, when you interact with InnerFlame's Lean Canvas generator, AI coaching, or other platform features.
          </p>
          <p className="mb-6">
            This Privacy Policy applies to all users of our Services. Our Services include our website, the InnerFlame platform, and all related tools, applications, data, and services provided by North Mirror LLC.
          </p>

          <h2 className="text-2xl font-bold mb-4 mt-10">1. Collection of Personal Data</h2>
          <p className="mb-4">
            We collect the following categories of personal data:
          </p>

          <h3 className="text-xl font-semibold mb-3">Personal data you provide to us directly</h3>
          <ul className="mb-6 list-disc pl-6 space-y-2">
            <li><strong>Identity and Contact Data</strong>: We collect identifiers, including your name, email address, and phone number when you sign up for an InnerFlame account, or to receive information on our Services.</li>
            <li><strong>Payment Information</strong>: We collect your payment information if you choose to purchase access to InnerFlame's premium features.</li>
            <li><strong>Inputs and Outputs</strong>: Our AI services allow you to interact with the platform by providing business ideas and other information ("Inputs"), which generate responses and content ("Outputs") based on your Inputs. This includes business ideas, Lean Canvas elements, journal entries, and other information you share with our platform.</li>
            <li><strong>Feedback</strong>: We appreciate feedback on our Services, including ideas and suggestions for improvement or rating responses from our AI ("Feedback"). If you provide Feedback, we may store the entire related interaction as part of your Feedback.</li>
            <li><strong>Communication Information</strong>: If you communicate with us, we collect your name, contact information, and the contents of any messages you send.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Personal data we receive automatically from your use of the Services</h3>
          <p className="mb-3">When you use the Services, we also receive certain technical data automatically:</p>
          <ul className="mb-6 list-disc pl-6 space-y-2">
            <li><strong>Device and Connection Information</strong>: Information about your device, browser, mobile network, IP address (including approximate location information), and other technical identifiers.</li>
            <li><strong>Usage Information</strong>: Information about how you use the Services, such as the dates and times of access, features used, and other information about how you interact with the platform.</li>
            <li><strong>Log and Troubleshooting Information</strong>: Information about how our Services are performing when you use them, including log files and error information.</li>
            <li><strong>Cookies & Similar Technologies</strong>: We use cookies and similar technologies to manage the Services and to collect information about you and your use of the Services. These technologies help us recognize you, customize your experience, and analyze the use of our Services.</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-10">2. Uses of Personal Data</h2>
          <p className="mb-4">
            We use your personal data for the following purposes:
          </p>
          <ul className="mb-6 list-disc pl-6 space-y-2">
            <li>To provide, maintain, and improve the InnerFlame platform and services;</li>
            <li>To communicate with you about your account, our Services, and events;</li>
            <li>To create and administer your InnerFlame account;</li>
            <li>To process payments for premium features;</li>
            <li>To prevent and investigate fraud, abuse, and violations of our Usage Policy;</li>
            <li>To investigate and resolve disputes and security issues;</li>
            <li>To identify and repair errors that impair functionality;</li>
            <li>To improve our Services through research and development;</li>
            <li>To enforce our Terms of Service and similar agreements.</li>
          </ul>
          <p className="mb-6">
            We will not use your Inputs or Outputs to train our AI models, unless: (1) your interactions are flagged for Trust & Safety review (in which case we may use them to improve our ability to detect and enforce our Usage Policy), or (2) you've explicitly reported content to us through our feedback mechanisms, or (3) you've otherwise explicitly opted in to the use of your Inputs and Outputs for training purposes.
          </p>

          <h2 className="text-2xl font-bold mb-4 mt-10">3. How We Disclose Personal Data</h2>
          <p className="mb-4">
            North Mirror LLC will disclose personal data to the following categories of third parties:
          </p>
          <ul className="mb-6 list-disc pl-6 space-y-2">
            <li><strong>Affiliates & corporate partners</strong>: North Mirror LLC may disclose personal data between and among its affiliates and related entities.</li>
            <li><strong>Service providers & business partners</strong>: We may disclose personal data with service providers and business partners for a variety of business purposes, including website hosting, ensuring compliance with industry standards, research, auditing, data processing, and providing you with the services.</li>
          </ul>
          <p className="mb-4">
            North Mirror LLC may also disclose personal data in the following circumstances:
          </p>
          <ul className="mb-6 list-disc pl-6 space-y-2">
            <li><strong>As part of a significant corporate event</strong>: If North Mirror LLC is involved in a merger, corporate transaction, bankruptcy, or other situation involving the transfer of business assets, we will disclose your personal data as part of these corporate transactions.</li>
            <li><strong>Third-Party Services</strong>: If you access third-party services through our platform, these third-party services will be able to collect information about you, including information about your activity on the Services.</li>
            <li><strong>Legal requirements and protection</strong>: We may disclose personal data to governmental authorities as required by law, in response to their requests, or to assist in investigations. We may also disclose personal data in connection with disputes, litigation, or if we determine its disclosure is necessary to protect the health and safety of any person.</li>
            <li><strong>With your consent</strong>: We will otherwise disclose personal data when you give us permission or direct us to disclose this information.</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-10">4. Rights and Choices</h2>
          <p className="mb-4">
            Depending on where you live, you may have certain rights regarding your personal data:
          </p>
          <ul className="mb-6 list-disc pl-6 space-y-2">
            <li><strong>Right to know</strong>: The right to know what personal data we process about you.</li>
            <li><strong>Access & data portability</strong>: The right to request a copy of your personal data.</li>
            <li><strong>Deletion</strong>: The right to request that we delete personal data collected from you.</li>
            <li><strong>Correction</strong>: The right to request that we correct inaccurate personal data.</li>
            <li><strong>Objection</strong>: The right to object to processing of your personal data in certain circumstances.</li>
            <li><strong>Withdrawal of consent</strong>: Where our processing of your personal data is based on consent, you have the right to withdraw your consent.</li>
          </ul>
          <p className="mb-6">
            To exercise your rights, you may submit a request by emailing us at <a href="mailto:support@northmirror.com" className="text-primary hover:underline">support@northmirror.com</a>. We may verify your identity by requesting information sufficient to confirm your identity.
          </p>

          <h2 className="text-2xl font-bold mb-4 mt-10">5. Data Retention and Security</h2>
          <p className="mb-6">
            North Mirror LLC retains your personal data for as long as reasonably necessary for the purposes outlined in this Privacy Policy.
          </p>
          <p className="mb-6">
            When the personal data collected is no longer required by us, we and our service providers will delete or anonymize it as permitted or required under applicable laws.
          </p>
          <p className="mb-6">
            We implement appropriate technical and organizational security measures designed to protect personal data from unauthorized access, disclosure, alteration, or destruction.
          </p>

          <h2 className="text-2xl font-bold mb-4 mt-10">6. Children</h2>
          <p className="mb-6">
            Our Services are not directed towards, and we do not knowingly collect, use, disclose, or share any information about children under the age of 18. If you become aware that a child under the age of 18 has provided any personal data to us while using our Services, please email us at <a href="mailto:support@northmirror.com" className="text-primary hover:underline">support@northmirror.com</a> and we will investigate and delete the personal data if appropriate.
          </p>

          <h2 className="text-2xl font-bold mb-4 mt-10">7. Changes to Our Privacy Policy</h2>
          <p className="mb-6">
            North Mirror LLC may update this Privacy Policy from time to time. We will notify you of any material changes to this Privacy Policy, as appropriate, and update the Effective Date at the top of this policy.
          </p>

          <h2 className="text-2xl font-bold mb-4 mt-10">8. Contact Information</h2>
          <p className="mb-6">
            The data controller responsible for your personal data is North Mirror LLC.
          </p>
          <p className="mb-6">
            If you have any questions about this Privacy Policy, or have any questions, complaints, or requests regarding your personal data, you can contact us at:
          </p>
          <address className="mb-10 not-italic">
            <p>North Mirror LLC</p>
            <p>254 Chapman Rd, Ste 208 #20562, Newark, Delaware 19702 Us</p>
            <p>Email: <a href="mailto:support@northmirror.com" className="text-primary hover:underline">support@northmirror.com</a></p>
          </address>
        </div>
      </AnimatedSection>
    </div>
  );
} 