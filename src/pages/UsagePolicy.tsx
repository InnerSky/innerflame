import { AnimatedSection } from "@/components/animated-section";

export default function UsagePolicy() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <AnimatedSection>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-6">Usage Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Effective March 4, 2025</p>

          <p className="mb-6">
            This Usage Policy (also referred to as our "Acceptable Use Policy" or "AUP") applies to anyone who uses InnerFlame products and services, and is intended to help our users stay safe and ensure our products and services are being used responsibly.
          </p>

          <p className="mb-6">
            The Usage Policy is categorized according to who can use our products and for what purposes. We will update our policy as our technology and the associated risks evolve or as we learn about unanticipated risks from our users.
          </p>

          <ul className="mb-6 list-disc pl-6 space-y-2">
            <li><strong>Universal Usage Standards</strong>: Our Universal Usage Standards apply to all users including individuals, developers, and businesses.</li>
            <li><strong>High-Risk Use Case Requirements</strong>: Our High-Risk Use Case Requirements apply to specific use cases that pose an elevated risk of harm.</li>
            <li><strong>Disclosure Requirements</strong>: Our Disclosure Requirements apply to specific use cases where it is especially important for users to understand that they are interacting with an AI system.</li>
          </ul>

          <p className="mb-6">
            North Mirror LLC's Trust and Safety Team will implement detections and monitoring to enforce our Usage Policies so please review these policies carefully before using our products. If we learn that you have violated our Usage Policy, we may throttle, suspend, or terminate your access to our products and services. If you discover that our platform outputs are inaccurate, biased or harmful, please notify us at <a href="mailto:support@northmirror.com">support@northmirror.com</a> or report it directly in the product through the support center.
          </p>

          <p className="mb-10">
            This Usage Policy is calibrated to strike an optimal balance between enabling beneficial uses and mitigating potential harms. North Mirror LLC may enter into contracts with certain governmental customers that tailor use restrictions to that customer's public mission and legal authorities if, in North Mirror LLC's judgment, the contractual use restrictions and applicable safeguards are adequate to mitigate the potential harms addressed by this Usage Policy.
          </p>

          <h2 className="text-2xl font-bold mb-4">Universal Usage Standards</h2>

          <h3 className="text-xl font-semibold mb-3">Do Not Compromise Children's Safety</h3>
          <p className="mb-3">This includes using our products or services to:</p>
          <ul className="mb-6 list-disc pl-6 space-y-1">
            <li>Create, distribute, or promote child sexual abuse material. We strictly prohibit and will report to relevant authorities and organizations where appropriate any content that exploits or abuses minors</li>
            <li>Facilitate the trafficking, sextortion, or any other form of exploitation of a minor</li>
            <li>Facilitate minor grooming, including generating content designed to impersonate a minor</li>
            <li>Facilitate or depict child abuse of any form, including instructions for how to conceal abuse</li>
            <li>Promote or facilitate pedophilic relationships, including via roleplay with the model</li>
            <li>Fetishize minors</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Do Not Compromise Critical Infrastructure</h3>
          <p className="mb-3">This includes using our products or services to:</p>
          <ul className="mb-6 list-disc pl-6 space-y-1">
            <li>Facilitate the destruction or disruption of critical infrastructure such as power grids, water treatment facilities, telecommunication networks, or air traffic control systems</li>
            <li>Obtain unauthorized access to critical systems such as voting machines, healthcare databases, and financial markets</li>
            <li>Interfere with the operation of military bases and related infrastructure</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Do Not Incite Violence or Hateful Behavior</h3>
          <p className="mb-3">This includes using our products or services to:</p>
          <ul className="mb-6 list-disc pl-6 space-y-1">
            <li>Incite, facilitate, or promote violent extremism, terrorism, or hateful behavior</li>
            <li>Depict support for organizations or individuals associated with violent extremism, terrorism, or hateful behavior</li>
            <li>Facilitate or promote any act of violence or intimidation targeting individuals, groups, animals, or property</li>
            <li>Promote discriminatory practices or behaviors against individuals or groups on the basis of one or more protected attributes such as race, ethnicity, religion, nationality, gender, sexual orientation, or any other identifying trait</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Do Not Compromise Someone's Privacy or Identity</h3>
          <p className="mb-3">This includes using our products or services to:</p>
          <ul className="mb-6 list-disc pl-6 space-y-1">
            <li>Compromise security or gain unauthorized access to computer systems or networks, including spoofing and social engineering</li>
            <li>Violate the security, integrity, or availability of any user, network, computer, device, or communications system, software application, or network or computing device</li>
            <li>Violate any person's privacy rights as defined by applicable privacy laws, such as sharing personal information without consent, accessing private data unlawfully, or violating any relevant privacy regulations</li>
            <li>Misuse, collect, solicit, or gain access to private information without permission such as non-public contact details, health data, biometric or neural data (including facial recognition), or confidential or proprietary data</li>
            <li>Impersonate a human by presenting results as human-generated, or using results in a manner intended to convince a natural person that they are communicating with a natural person when they are not</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Do Not Create or Facilitate the Exchange of Illegal or Highly Regulated Weapons or Goods</h3>
          <p className="mb-3">This includes using our products or services to:</p>
          <ul className="mb-6 list-disc pl-6 space-y-1">
            <li>Produce, modify, design, market, or distribute weapons, explosives, dangerous materials or other systems designed to cause harm to or loss of human life</li>
            <li>Engage in or facilitate any illegal activity, such as the use, acquisition, or exchange of illegal and controlled substances, or the facilitation of human trafficking and prostitution</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Do Not Create Psychologically or Emotionally Harmful Content</h3>
          <p className="mb-3">This includes using our products or services to:</p>
          <ul className="mb-6 list-disc pl-6 space-y-1">
            <li>Facilitate or conceal any form of self-harm, including disordered eating and unhealthy or compulsive exercise</li>
            <li>Engage in behaviors that promote unhealthy or unattainable body image or beauty standards</li>
            <li>Shame, humiliate, intimidate, bully, harass, or celebrate the suffering of individuals</li>
            <li>Coordinate the harassment or intimidation of an individual or group</li>
            <li>Generate content depicting sexual violence</li>
            <li>Generate content depicting animal cruelty or abuse</li>
            <li>Generate violent or gory content that is inspired by real acts of violence</li>
            <li>Promote, trivialize, or depict graphic violence or gratuitous gore</li>
            <li>Develop a product, or support an existing service that facilitates deceptive techniques with the intent of causing emotional harm</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Do Not Spread Misinformation</h3>
          <p className="mb-3">This includes the usage of our products or services to:</p>
          <ul className="mb-6 list-disc pl-6 space-y-1">
            <li>Create and disseminate deceptive or misleading information about a group, entity or person</li>
            <li>Create and disseminate deceptive or misleading information about laws, regulations, procedures, practices, standards established by an institution, entity or governing body</li>
            <li>Create and disseminate deceptive or misleading information with the intention of targeting specific groups or persons with the misleading content</li>
            <li>Create and advance conspiratorial narratives meant to target a specific group, individual or entity</li>
            <li>Impersonate real entities or create fake personas to falsely attribute content or mislead others about its origin without consent or legal right</li>
            <li>Provide false or misleading information related to medical, health or science issues</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Do Not Create Political Campaigns or Interfere in Elections</h3>
          <p className="mb-3">This includes the usage of our products or services to:</p>
          <ul className="mb-6 list-disc pl-6 space-y-1">
            <li>Promote or advocate for a particular political candidate, party, issue or position. This includes soliciting votes, financial contributions, or public support for a political entity</li>
            <li>Engage in political lobbying to actively influence the decisions of government officials, legislators, or regulatory agencies on legislative, regulatory, or policy matters</li>
            <li>Engage in campaigns, including political campaigns, that promote false or misleading information to discredit or undermine individuals, groups, entities or institutions</li>
            <li>Incite, glorify or facilitate the disruption of electoral or civic processes</li>
            <li>Generate false or misleading information on election laws, procedures and security, candidate information, how to participate, or discouraging participation in an election</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Do Not Use for Criminal Justice, Law Enforcement, Censorship or Surveillance Purposes</h3>
          <p className="mb-3">This includes the usage of our products or services to:</p>
          <ul className="mb-6 list-disc pl-6 space-y-1">
            <li>Make determinations on criminal justice applications, including making decisions about or determining eligibility for parole or sentencing</li>
            <li>Target or track a person's physical location, emotional state, or communication without their consent</li>
            <li>Utilize InnerFlame to assign scores or ratings to individuals based on an assessment of their trustworthiness or social behavior</li>
            <li>Build or support emotional recognition systems or techniques that are used to infer people's emotions</li>
            <li>Analyze or identify specific content to censor on behalf of a government organization</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Do Not Engage in Fraudulent, Abusive, or Predatory Practices</h3>
          <p className="mb-3">This includes using our products or services to:</p>
          <ul className="mb-6 list-disc pl-6 space-y-1">
            <li>Facilitate the production, acquisition, or distribution of counterfeit or illicitly acquired goods</li>
            <li>Promote or facilitate the generation or distribution of spam</li>
            <li>Generate content for fraudulent activities, schemes, scams, phishing, or malware that can result in direct financial or psychological harm</li>
            <li>Generate content for the purposes of developing or promoting the sale or distribution of fraudulent or deceptive products</li>
            <li>Generate deceptive or misleading digital content such as fake reviews, comments, or media</li>
            <li>Engage in or facilitate multi-level marketing, pyramid schemes, or other deceptive business models that use high-pressure sales tactics or exploit participants</li>
            <li>Promote or facilitate payday loans, title loans, or other high-interest, short-term lending practices that exploit vulnerable individuals</li>
            <li>Engage in deceptive, abusive behaviors, practices, or campaigns that exploits people due to their age, disability or a specific social or economic situation</li>
            <li>Promote or facilitate the use of abusive or harassing debt collection practices</li>
            <li>Develop a product, or support an existing service that deploys subliminal, manipulative, or deceptive techniques to distort behavior by impairing decision-making</li>
            <li>Plagiarize or engage in academic dishonesty</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Do Not Abuse our Platform</h3>
          <p className="mb-3">This includes using our products or services to:</p>
          <ul className="mb-6 list-disc pl-6 space-y-1">
            <li>Coordinate malicious activity across multiple accounts such as creating multiple accounts to avoid detection or circumvent product guardrails</li>
            <li>Utilize automation in account creation or to engage in spammy behavior</li>
            <li>Circumvent a ban through the use of a different account, such as the creation of a new account, use of an existing account, or providing access to a person or entity that was previously banned</li>
            <li>Facilitate or provide account access to InnerFlame to persons or entities who are located in unsupported locations</li>
            <li>Intentionally bypass capabilities or restrictions established within our products for the purposes of instructing the system to produce harmful outputs without an authorized use-case approved by North Mirror LLC</li>
            <li>Unauthorized utilization of platform features to train an AI model</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Do Not Generate Sexually Explicit Content</h3>
          <p className="mb-3">This includes the usage of our products or services to:</p>
          <ul className="mb-6 list-disc pl-6 space-y-1">
            <li>Depict or request sexual intercourse or sex acts</li>
            <li>Generate content related to sexual fetishes or fantasies</li>
            <li>Facilitate, promote, or depict incest or bestiality</li>
            <li>Engage in erotic chats</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-10">High-Risk Use Case Requirements</h2>
          <p className="mb-4">
            While InnerFlame is primarily designed for business development purposes, some integrations may pose an elevated risk of harm because they influence domains that are vital to public welfare and social equity. If you intend to use InnerFlame in the following contexts, additional safety measures are required:
          </p>

          <ul className="mb-6 list-disc pl-6 space-y-2">
            <li><strong>Business Decision-Making</strong>: Integrations where InnerFlame is used to make significant business decisions affecting individuals' employment, financial status, or contractual relationships</li>
            <li><strong>Financial Guidance</strong>: Integrations where InnerFlame provides financial guidance that could significantly impact individuals' financial wellbeing</li>
            <li><strong>Educational Applications</strong>: Integrations where InnerFlame is used for formal educational assessment or training</li>
          </ul>

          <p className="mb-4">
            If your integration falls into these categories, we require that you implement these additional safety measures:
          </p>

          <ul className="mb-6 list-disc pl-6 space-y-2">
            <li><strong>Human-in-the-loop</strong>: When using our products or services to provide advice, recommendations, or subjective decisions that directly impact individuals in high-risk domains, a qualified professional must review the content or decision prior to dissemination or finalization. Your business is responsible for the accuracy and appropriateness of that information.</li>
            <li><strong>Disclosure</strong>: You must disclose to your customers or end users that you are using our services to help inform your decisions or recommendations.</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-10">Disclosure Requirements</h2>
          <p className="mb-4">
            The following use cases must disclose to their users that they are interacting with an AI system rather than a human:
          </p>

          <ul className="mb-10 list-disc pl-6 space-y-2">
            <li>All customer-facing chatbots including any external-facing or interactive AI agent</li>
            <li>Services serving minors: Organizations providing minors with the ability to directly interact with products that incorporate InnerFlame</li>
          </ul>

          <p className="mt-10 mb-6 text-sm">
            For any questions regarding this Usage Policy, please contact <a href="mailto:support@northmirror.com" className="text-primary hover:underline">support@northmirror.com</a>.
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
} 