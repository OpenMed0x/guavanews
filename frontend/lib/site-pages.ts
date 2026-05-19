export type Locale = "zh" | "en";

export type SitePageSection = {
  heading: string;
  body: string[];
};

export type SitePageLocaleContent = {
  title: string;
  eyebrow: string;
  summary: string;
  updatedAt: string;
  sections: SitePageSection[];
};

export type SitePage = {
  slug: string;
  locales: Record<Locale, SitePageLocaleContent>;
};

export type FooterLink = {
  label: string;
  slug: string;
};

export type FooterSection = {
  title: string;
  links: FooterLink[];
};

export const footerSectionsByLocale: Record<Locale, FooterSection[]> = {
  zh: [
    {
      title: "支持",
      links: [
        { label: "帮助中心", slug: "help-centre" },
        { label: "订阅开通", slug: "subscription-sign-up" },
        { label: "联系我们", slug: "contact-us" },
        { label: "无障碍访问", slug: "accessibility" },
      ],
    },
    {
      title: "法律",
      links: [
        { label: "条款与条件", slug: "terms-and-conditions" },
        { label: "隐私政策", slug: "privacy-policy" },
        { label: "Cookie 政策", slug: "cookie-policy" },
        { label: "版权说明", slug: "copyright" },
      ],
    },
    {
      title: "服务",
      links: [
        { label: "新闻邮件", slug: "newsletter" },
        { label: "Guava API 接入", slug: "guava-api-access" },
        { label: "企业访问", slug: "corporate-access" },
        { label: "职位看板", slug: "job-board" },
      ],
    },
  ],
  en: [
    {
      title: "Support",
      links: [
        { label: "Help Centre", slug: "help-centre" },
        { label: "Subscription Sign Up", slug: "subscription-sign-up" },
        { label: "Contact Us", slug: "contact-us" },
        { label: "Accessibility", slug: "accessibility" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Terms & Conditions", slug: "terms-and-conditions" },
        { label: "Privacy Policy", slug: "privacy-policy" },
        { label: "Cookie Policy", slug: "cookie-policy" },
        { label: "Copyright", slug: "copyright" },
      ],
    },
    {
      title: "Services",
      links: [
        { label: "Newsletter", slug: "newsletter" },
        { label: "Guava API Access", slug: "guava-api-access" },
        { label: "Corporate Access", slug: "corporate-access" },
        { label: "Job Board", slug: "job-board" },
      ],
    },
  ],
};

export const sitePages: Record<string, SitePage> = {
  "help-centre": {
    slug: "help-centre",
    locales: {
      zh: {
        title: "帮助中心",
        eyebrow: "支持运营",
        summary: "面向订阅、账户、发布流程、支付异常与生产事故的统一支持说明。",
        updatedAt: "2026年5月19日",
        sections: [
          {
            heading: "开始使用",
            body: [
              "Guava 会员可通过 Stripe 付费开通，也可通过企业授权方式启用。支付完成后，权益会绑定到当前邮箱身份，或在钱包原型场景下绑定到当前支付钱包地址。",
              "如果付费完成后五分钟内仍未解锁，请先退出并重新登录，再回到文章流页面。这个动作会从后端重新同步权益状态，通常能解决大多数显示延迟问题。",
            ],
          },
          {
            heading: "发布与编辑支持",
            body: [
              "已授权的编辑用户可以通过首页投稿入口创建或更新文章。图片上传支持本地托管、Cloudinary 或 Supabase Storage，实际路径取决于当前环境配置。",
              "如果文章发布失败，请记录错误提示、发生时间和文章标题。生产支持可以结合后端日志、对象存储响应和数据库写入记录进行排查。",
            ],
          },
          {
            heading: "事故响应",
            body: [
              "如果事故影响支付、文章渲染、API 可用性或企业用户使用，请通过 Contact Us 页面列出的渠道进行升级，并附上受影响页面、浏览器、时间戳和任何可见请求标识。",
              "一般产品咨询、内容管理问题和接入支持的标准处理时间为周一至周五 09:00 至 18:00（Asia/Shanghai）。",
            ],
          },
        ],
      },
      en: {
        title: "Help Centre",
        eyebrow: "Support Operations",
        summary: "Operational guidance for subscriptions, account access, publishing workflows, payments, and incident handling.",
        updatedAt: "19 May 2026",
        sections: [
          {
            heading: "Getting Started",
            body: [
              "Guava memberships can be activated through Stripe billing or approved enterprise access. After payment, premium access is tied to the active email identity or, where enabled, the connected paying wallet.",
              "If a completed purchase does not unlock access within five minutes, sign out and sign back in, then revisit the article feed. This refreshes entitlement state from the backend before escalation is required.",
            ],
          },
          {
            heading: "Publishing Support",
            body: [
              "Authorized editorial users can create or update stories from the homepage submission flow. Image delivery may be backed by local storage, Cloudinary, or Supabase Storage depending on the active environment.",
              "If a story fails to publish, capture the error message, the timestamp, and the title. Production support can correlate the incident with backend logs, object storage responses, and database activity.",
            ],
          },
          {
            heading: "Incident Response",
            body: [
              "Severity 1 incidents affecting billing, article rendering, API availability, or enterprise access should be escalated through the channels listed on the Contact Us page with page URL, browser, timestamp, and any visible request identifier.",
              "Routine product questions, onboarding support, and editorial workflow help are handled during standard support hours: Monday to Friday, 09:00 to 18:00 Asia/Shanghai.",
            ],
          },
        ],
      },
    },
  },
  "subscription-sign-up": {
    slug: "subscription-sign-up",
    locales: {
      zh: {
        title: "订阅开通",
        eyebrow: "会员服务",
        summary: "介绍个人订阅、企业订阅、支付验证与权益生效逻辑。",
        updatedAt: "2026年5月19日",
        sections: [
          {
            heading: "个人订阅",
            body: [
              "个人会员面向需要完整阅读文章、使用高级情报内容以及后续扩展研究模块的读者。",
              "当支付完成后，权益默认绑定到登录邮箱。在钱包原型开启的情况下，前端的订阅可见状态还会受到当前连接支付钱包地址的影响。",
            ],
          },
          {
            heading: "支付与续费",
            body: [
              "Stripe 是个人订阅的默认支付通道。价格、续费周期与适用税务信息应在结账时明确展示。",
              "所有支付异常、扣款争议、续费失败等情况，均应按帮助中心与联系我们页面中的支持流程进行处理。",
            ],
          },
          {
            heading: "机构开通",
            body: [
              "如果团队需要采购流程、共享权限治理或更高的文章分发能力，应选择企业访问方案，而不是使用个人订阅结账。",
              "机构开通常包含角色分配、域名授权、合规审查以及 API 和内容分发范围确认。",
            ],
          },
        ],
      },
      en: {
        title: "Subscription Sign Up",
        eyebrow: "Membership Services",
        summary: "Membership plans, billing expectations, entitlement activation, and onboarding paths for individuals and institutions.",
        updatedAt: "19 May 2026",
        sections: [
          {
            heading: "Individual Membership",
            body: [
              "Individual access is intended for readers who need full article unlocks, premium briefings, and future access to expanded intelligence modules.",
              "After checkout, membership status is associated with the authenticated account. Where wallet-based prototypes are enabled, entitlement visibility may also depend on the currently connected paying wallet.",
            ],
          },
          {
            heading: "Billing Expectations",
            body: [
              "Stripe is the default billing processor for individual memberships. Pricing, renewal terms, and applicable tax disclosures should be presented at checkout.",
              "Billing exceptions, disputed charges, and failed renewals should be handled through the support flow described in the Help Centre and Contact Us pages.",
            ],
          },
          {
            heading: "Institutional Onboarding",
            body: [
              "Teams requiring procurement review, shared governance, or higher distribution limits should use Corporate Access rather than an individual checkout flow.",
              "Institutional onboarding typically includes role assignment, approved user domains, compliance review, and commercial scoping of API or newsroom requirements.",
            ],
          },
        ],
      },
    },
  },
  "contact-us": {
    slug: "contact-us",
    locales: {
      zh: {
        title: "联系我们",
        eyebrow: "客户与媒体联系",
        summary: "Guava 的支持、编辑、商务与法务沟通入口。",
        updatedAt: "2026年5月19日",
        sections: [
          {
            heading: "一般咨询",
            body: [
              "账户、订阅、支付和产品使用问题可发送至 support@guava.news，并附上账号邮箱、受影响页面和问题描述。",
              "媒体合作、品牌合作与企业合作请求可发送至 partnerships@guava.news，以便路由到相应商务负责人。",
            ],
          },
          {
            heading: "编辑与更正",
            body: [
              "如需申请更正、补充事实说明或查询来源信息，请发送至 editorial@guava.news，并提供文章标题、链接和支撑材料。",
              "Guava 会依据编辑纠错流程评估更正请求，并根据影响程度决定发布更正、澄清或静默修订。",
            ],
          },
          {
            heading: "法务与合规",
            body: [
              "版权通知、隐私咨询及合规事项可发送至 legal@guava.news。若涉及时效性事务，请注明适用法域及所需响应期限。",
              "如果是安全漏洞通报，请提供简要技术说明与安全复现步骤，除非被要求，否则不要直接发送利用代码。",
            ],
          },
        ],
      },
      en: {
        title: "Contact Us",
        eyebrow: "Client & Press Contact",
        summary: "Primary support, editorial, commercial, and legal communication channels for Guava stakeholders.",
        updatedAt: "19 May 2026",
        sections: [
          {
            heading: "General Enquiries",
            body: [
              "For account, subscription, billing, and product questions, contact support@guava.news and include the account email, impacted page, and a short issue description.",
              "Press, brand, and enterprise partnership enquiries should be sent to partnerships@guava.news for routing to the appropriate commercial lead.",
            ],
          },
          {
            heading: "Editorial Requests",
            body: [
              "Correction requests, factual clarifications, and source enquiries should be sent to editorial@guava.news with the article title, URL, and supporting evidence.",
              "Guava reviews legitimate correction requests under a documented editorial escalation process and may publish amendments, clarifications, or silent fixes depending on severity.",
            ],
          },
          {
            heading: "Legal & Compliance",
            body: [
              "Copyright notices, privacy questions, and compliance matters may be sent to legal@guava.news. Time-sensitive legal correspondence should identify the applicable jurisdiction and requested deadline.",
              "For security disclosures, include a concise technical summary and safe reproduction steps. Do not send exploit code unless previously requested by the response team.",
            ],
          },
        ],
      },
    },
  },
  accessibility: {
    slug: "accessibility",
    locales: {
      zh: {
        title: "无障碍访问",
        eyebrow: "可访问体验",
        summary: "说明 Guava 在可访问性方面的承诺、当前支持范围与已知限制。",
        updatedAt: "2026年5月19日",
        sections: [
          {
            heading: "标准目标",
            body: [
              "Guava 希望让关键用户路径尽量符合 WCAG 2.2 AA 原则，包括更清晰的排版、键盘可达性、可见焦点和一致的信息结构。",
              "屏幕阅读器、浏览器缩放与减少动态效果偏好等辅助技术因素，会在页面结构与导航设计中持续考虑。",
            ],
          },
          {
            heading: "持续改进",
            body: [
              "我们会定期检查文章模板、表单、导航与按钮在语义结构、对比度和非文本替代方面的表现，并根据用户影响优先修复问题。",
              "如果你遇到无障碍障碍，请提交页面链接、所使用的辅助工具以及失败交互描述，这会显著提升修复速度。",
            ],
          },
          {
            heading: "替代支持",
            body: [
              "当某些自助流程暂时无法完全无障碍使用时，Guava 会在商业和运营允许的范围内提供人工替代支持路径。",
            ],
          },
        ],
      },
      en: {
        title: "Accessibility",
        eyebrow: "Inclusive Experience",
        summary: "Accessibility commitments, current support standards, and known limitations across the Guava web experience.",
        updatedAt: "19 May 2026",
        sections: [
          {
            heading: "Accessibility Standard",
            body: [
              "Guava aims to align critical user journeys with WCAG 2.2 AA principles, including readable typography, keyboard navigation support, visible focus states, and consistent information structure.",
              "Assistive technologies such as screen readers, browser zoom, and reduced motion preferences are considered in navigation and content-rendering decisions.",
            ],
          },
          {
            heading: "Ongoing Improvements",
            body: [
              "We periodically review article templates, forms, and navigation modules for semantic structure, contrast, and non-text alternatives, prioritizing issues based on user impact.",
              "If you encounter an accessibility barrier, send the page URL, assistive technology used, and the exact interaction that failed. This materially improves remediation speed.",
            ],
          },
          {
            heading: "Alternative Support",
            body: [
              "Where an equivalent self-service path is temporarily unavailable, Guava will provide a human-assisted alternative through support channels wherever operationally feasible.",
            ],
          },
        ],
      },
    },
  },
  "terms-and-conditions": {
    slug: "terms-and-conditions",
    locales: {
      zh: {
        title: "条款与条件",
        eyebrow: "法律框架",
        summary: "规范 Guava 服务访问、平台使用、商业付费与账户责任的基础条款。",
        updatedAt: "2026年5月19日",
        sections: [
          {
            heading: "服务范围",
            body: [
              "Guava 提供编辑内容、会员分析、账户服务、内容发布工具以及特定程序化接口。具体能力可能因产品等级、地区或技术环境不同而变化。",
              "使用平台即表示用户同意合法使用服务，不滥用发布入口、不绕过访问控制，也不进行影响平台稳定性的行为。",
            ],
          },
          {
            heading: "账户责任",
            body: [
              "用户需妥善保管凭据、连接钱包和任何第三方接入系统，如发现未授权访问应及时报告。",
              "若合理怀疑存在滥用、欺诈、冒充、规避政策或干扰服务的行为，Guava 可暂停相关访问。",
            ],
          },
          {
            heading: "商业条款",
            body: [
              "付费订阅根据销售页面展示的续费和终止规则执行。退款处理将根据产品类型和适用法律决定。",
              "企业合同、API 协议和机构访问安排可通过单独签署的商业文件覆盖公开网站条款。",
            ],
          },
        ],
      },
      en: {
        title: "Terms & Conditions",
        eyebrow: "Legal Framework",
        summary: "Commercial, editorial, and platform-use conditions governing access to Guava services.",
        updatedAt: "19 May 2026",
        sections: [
          {
            heading: "Service Scope",
            body: [
              "Guava provides access to editorial content, premium analysis, account-based services, publishing tools, and selected programmatic interfaces. Service availability may vary by tier, region, and technical environment.",
              "Use of the platform constitutes agreement to operate lawfully, avoid abuse of publishing surfaces, and refrain from bypassing access controls or usage restrictions.",
            ],
          },
          {
            heading: "Accounts & Responsibility",
            body: [
              "Users are responsible for safeguarding credentials, connected wallets, and any third-party systems used to access Guava services. Unauthorized use should be reported promptly.",
              "Guava may suspend access where abuse, fraud, impersonation, policy evasion, or service disruption is reasonably suspected.",
            ],
          },
          {
            heading: "Commercial Terms",
            body: [
              "Paid subscriptions renew or terminate according to the billing terms presented at point of sale. Refund treatment, if any, depends on the applicable plan and governing law.",
              "Enterprise agreements, API contracts, and institutional access programs may override public website terms through separately executed commercial schedules.",
            ],
          },
        ],
      },
    },
  },
  "privacy-policy": {
    slug: "privacy-policy",
    locales: {
      zh: {
        title: "隐私政策",
        eyebrow: "数据保护",
        summary: "说明 Guava 在账户、订阅、支持和分析场景下如何收集、使用、存储和保护个人数据。",
        updatedAt: "2026年5月19日",
        sections: [
          {
            heading: "收集的数据",
            body: [
              "Guava 可能收集邮箱、订阅状态、支付提供方返回的账单元数据、支持沟通记录以及保障服务运行所需的技术事件数据。",
              "在支持钱包体验的场景下，钱包地址与交易引用也可能被处理，用于验证权益或调查支持问题。",
            ],
          },
          {
            heading: "数据用途",
            body: [
              "个人数据主要用于用户认证、订阅交付、支持流程、平台安全和可靠性改进，而不是无节制的营销扩展用途。",
              "内部访问应以合法业务与安全需求为前提，并遵循最小权限与最小数据原则。",
            ],
          },
          {
            heading: "保留与权利",
            body: [
              "数据保留期取决于运营需要、合同义务和法律要求。支持工单、账单元数据和安全日志可能比前端会话状态保留更久。",
              "在适用法律允许的范围内，用户可申请访问、更正或删除数据。部分记录可能因反欺诈、财务和合规要求需要继续保留。",
            ],
          },
        ],
      },
      en: {
        title: "Privacy Policy",
        eyebrow: "Data Protection",
        summary: "How Guava collects, uses, stores, and protects personal data across reader, member, and enterprise workflows.",
        updatedAt: "19 May 2026",
        sections: [
          {
            heading: "Data We Collect",
            body: [
              "Guava may collect account identifiers such as email address, subscription status, billing metadata returned by payment providers, support correspondence, and technical event data needed to operate the service.",
              "Where wallet-based experiences are enabled, wallet addresses and transaction references may be processed to verify entitlements or investigate support issues.",
            ],
          },
          {
            heading: "How Data Is Used",
            body: [
              "Personal data is processed to authenticate users, deliver subscriptions, operate support workflows, secure the platform, and improve product reliability and performance.",
              "Operational access should be limited to legitimate business and security purposes and should follow data minimization principles.",
            ],
          },
          {
            heading: "Retention & Rights",
            body: [
              "Data retention periods depend on operational necessity, contractual obligations, and legal requirements. Support artifacts, billing metadata, and security logs may be retained longer than front-end session state.",
              "Users may request access, correction, or deletion where applicable law grants those rights. Some operational records may need to be retained for fraud prevention, finance, or compliance purposes.",
            ],
          },
        ],
      },
    },
  },
  "cookie-policy": {
    slug: "cookie-policy",
    locales: {
      zh: {
        title: "Cookie 政策",
        eyebrow: "浏览器存储说明",
        summary: "说明 Guava 如何使用 Cookie 与类似存储技术维护登录、偏好、分析与权益连续性。",
        updatedAt: "2026年5月19日",
        sections: [
          {
            heading: "必要存储",
            body: [
              "必要 Cookie 或等效浏览器存储可用于维持登录状态、支持安全认证、保存会员状态并保护关键站点功能。",
              "禁用必要存储可能导致登录、会员验证或发布流程无法正常工作。",
            ],
          },
          {
            heading: "分析与性能",
            body: [
              "Guava 可使用运营分析了解故障流程、页面性能和功能使用情况，目标是提高可靠性，而不是进行不必要的用户画像。",
              "任何分析部署都应在启用前评估比例性、数据最小化和适用法域合规义务。",
            ],
          },
          {
            heading: "用户控制",
            body: [
              "用户可以通过浏览器设置或产品提供的偏好管理功能控制存储。若关闭关键存储，部分功能可能退化。",
            ],
          },
        ],
      },
      en: {
        title: "Cookie Policy",
        eyebrow: "Browser Storage Notice",
        summary: "How Guava uses cookies and similar technologies for sessions, preferences, analytics, and entitlement continuity.",
        updatedAt: "19 May 2026",
        sections: [
          {
            heading: "Essential Cookies",
            body: [
              "Essential cookies and equivalent browser storage may be used to maintain session continuity, support secure sign-in flows, preserve premium state, and protect critical site functionality.",
              "Disabling essential storage may prevent login, entitlement verification, or reliable publishing workflow completion.",
            ],
          },
          {
            heading: "Analytics & Performance",
            body: [
              "Guava may use operational analytics to understand broken flows, page performance, and feature usage. These signals are intended to improve reliability rather than create unnecessary profiling.",
              "Any analytics deployment should be assessed for proportionality, data minimization, and regional compliance obligations before activation.",
            ],
          },
          {
            heading: "User Controls",
            body: [
              "Users can manage storage preferences through browser controls or, where implemented, product-level consent interfaces. Some functionality will degrade if critical storage is disabled.",
            ],
          },
        ],
      },
    },
  },
  copyright: {
    slug: "copyright",
    locales: {
      zh: {
        title: "版权说明",
        eyebrow: "权利与复用",
        summary: "说明 Guava 内容、版式、接口文档与第三方素材的权利边界和复用规则。",
        updatedAt: "2026年5月19日",
        sections: [
          {
            heading: "权利归属",
            body: [
              "除非另有说明，Guava 的编辑内容、页面结构、文案与文档均受版权和相关知识产权法律保护。",
              "第三方商标、来源引用和合作方素材的权利仍归其各自所有人所有，使用需遵守相应授权与法律基础。",
            ],
          },
          {
            heading: "允许使用",
            body: [
              "在适用法律和授权范围内，个人阅读、内部评估与合理引用可被允许，但系统性抓取、重托管和再发布通常不被授权。",
              "商业再分发、数据集提取或会员内容再利用通常需要另行签署书面许可。",
            ],
          },
          {
            heading: "通知流程",
            body: [
              "若你认为平台内容涉及侵权，请发送详细通知至 legal@guava.news，说明主张作品、涉嫌侵权内容以及你的权利依据。",
            ],
          },
        ],
      },
      en: {
        title: "Copyright",
        eyebrow: "Rights & Reuse",
        summary: "Ownership, reuse permissions, notice procedures, and protected material handling across the Guava platform.",
        updatedAt: "19 May 2026",
        sections: [
          {
            heading: "Ownership",
            body: [
              "Unless otherwise stated, Guava editorial materials, layout assets, documentation, and product copy are protected by copyright and related intellectual property laws.",
              "Third-party marks, source excerpts, and partner materials remain the property of their respective owners and are used subject to applicable legal rights and permissions.",
            ],
          },
          {
            heading: "Permitted Use",
            body: [
              "Limited personal reading, internal review, and reasonable quotation with attribution may be permitted depending on law and licensing context. Systematic scraping, rehosting, or republishing is not authorized without permission.",
              "Commercial redistribution, dataset extraction, or reproduction of premium content generally requires a separate written license.",
            ],
          },
          {
            heading: "Notice Procedure",
            body: [
              "To report alleged infringement, send a detailed notice to legal@guava.news including the claimed work, the allegedly infringing material, and your basis for ownership or authority to act.",
            ],
          },
        ],
      },
    },
  },
  newsletter: {
    slug: "newsletter",
    locales: {
      zh: {
        title: "新闻邮件",
        eyebrow: "受众简报",
        summary: "介绍 Guava 邮件简报的定位、订阅管理和数据处理原则。",
        updatedAt: "2026年5月19日",
        sections: [
          {
            heading: "简报定位",
            body: [
              "Guava 邮件简报面向需要高信噪比内容的读者，重点输出市场、协议和情报层面的重要变化，而不是重复轰炸式推送。",
              "未来可能包括每日摘要、每周研究备忘、行业主题精选和企业定制简报等不同层级产品。",
            ],
          },
          {
            heading: "订阅控制",
            body: [
              "用户应能清晰地完成订阅、偏好管理和退订。与安全或计费相关的必要通知可在适用场景下继续发送。",
            ],
          },
          {
            heading: "数据处理",
            body: [
              "新闻邮件运营应遵守隐私政策，包括最小化保留、同意管理和退订名单一致性维护。",
            ],
          },
        ],
      },
      en: {
        title: "Newsletter",
        eyebrow: "Audience Briefings",
        summary: "Editorial brief distribution, subscriber expectations, and governance for opt-in communications.",
        updatedAt: "19 May 2026",
        sections: [
          {
            heading: "Editorial Briefing Model",
            body: [
              "Guava newsletters are designed as high-signal briefings summarizing key market, protocol, and intelligence developments without overwhelming subscribers with redundant updates.",
              "Future product layers may include daily digests, weekly research memos, sector briefings, and enterprise-tailored communications.",
            ],
          },
          {
            heading: "Subscription Controls",
            body: [
              "Subscribers should be able to opt in, manage preferences, and unsubscribe through clearly presented controls. Transactional communications related to security or billing may still be sent where appropriate.",
            ],
          },
          {
            heading: "Data Handling",
            body: [
              "Newsletter operations should follow the Privacy Policy, including retention discipline, consent awareness, and suppression list integrity.",
            ],
          },
        ],
      },
    },
  },
  "guava-api-access": {
    slug: "guava-api-access",
    locales: {
      zh: {
        title: "Guava API 接入",
        eyebrow: "开发者平台",
        summary: "面向 agent、移动端与企业系统的内容 API、权限策略与接入期望。",
        updatedAt: "2026年5月19日",
        sections: [
          {
            heading: "接口能力",
            body: [
              "Guava API 适合客户端、Agent、移动应用和后台系统消费文章流、文章详情、作者聚合与内容元数据。",
              "当前版本提供受 Hacker News 风格启发的轻量接口，包括 story item 读取、feed 列表、作者聚合、搜索和最大内容 ID 查询。",
            ],
          },
          {
            heading: "安全与认证",
            body: [
              "公开读取接口可用于内容消费；涉及写操作、成员状态、管理动作或计费的接口必须使用受控身份和服务端凭据。",
              "对于移动端和 agent 接入，建议将需要保密的能力放在受控后端代理之后，而不是直接暴露客户端密钥。",
            ],
          },
          {
            heading: "接入示例",
            body: [
              "推荐优先接入 `/api/v1/feeds/topstories`、`/api/v1/items/{id}` 和 `/api/v1/search` 三类接口，用于实现首页流、详情页和智能检索。",
              "如需企业级流量或稳定兼容承诺，应使用 Corporate Access 进行商业对接与版本治理。",
            ],
          },
        ],
      },
      en: {
        title: "Guava API Access",
        eyebrow: "Developer Platform",
        summary: "Content APIs, access posture, and operational expectations for agents, mobile apps, and enterprise systems.",
        updatedAt: "19 May 2026",
        sections: [
          {
            heading: "Available Capabilities",
            body: [
              "Guava API is designed for clients, agents, mobile applications, and backend systems that need article feeds, story detail, author aggregation, and content metadata.",
              "The current version provides lightweight, Hacker News-inspired interfaces including story item retrieval, feed lists, author summaries, search, and max item discovery.",
            ],
          },
          {
            heading: "Security & Authentication",
            body: [
              "Public read endpoints are suitable for content consumption; write operations, membership state, admin actions, and billing flows must use controlled identities and server-side credentials.",
              "For mobile and agent integrations, sensitive capabilities should be routed through controlled backend proxies rather than embedding secrets directly in clients.",
            ],
          },
          {
            heading: "Integration Guidance",
            body: [
              "Recommended starting points are `/api/v1/feeds/topstories`, `/api/v1/items/{id}`, and `/api/v1/search` for homepage flows, detail views, and intelligent retrieval.",
              "Teams that need enterprise throughput, governance, or compatibility assurances should onboard through Corporate Access.",
            ],
          },
        ],
      },
    },
  },
  "corporate-access": {
    slug: "corporate-access",
    locales: {
      zh: {
        title: "企业访问",
        eyebrow: "机构方案",
        summary: "面向基金、企业和研究机构的团队访问、采购和治理方案。",
        updatedAt: "2026年5月19日",
        sections: [
          {
            heading: "团队部署",
            body: [
              "企业访问适用于需要共享权限、组织级治理、访问审计和多角色编辑或情报工作流的团队。",
              "部署内容可能包括域名批准、命名席位、管理员控制和按合同约定的使用边界。",
            ],
          },
          {
            heading: "商业流程",
            body: [
              "机构开通可能包含采购评审、安全问卷、法务审核和数据处理说明。具体周期取决于接入深度与合规复杂度。",
              "API 使用、研究再分发与内部传播权限应在商业合同中明确约定后再推广到团队范围。",
            ],
          },
          {
            heading: "支持与治理",
            body: [
              "企业客户应拥有明确的支持渠道、客户负责人和与业务关键程度匹配的事故升级路径。",
            ],
          },
        ],
      },
      en: {
        title: "Corporate Access",
        eyebrow: "Institutional Programs",
        summary: "Team access, procurement support, governance, and commercial onboarding for companies, funds, and research organizations.",
        updatedAt: "19 May 2026",
        sections: [
          {
            heading: "Team Deployment",
            body: [
              "Corporate Access is intended for organizations that need shared access, governed onboarding, reporting visibility, and multi-user editorial or intelligence workflows.",
              "Deployment may include approved domains, named seats, administrative controls, and negotiated usage constraints depending on commercial scope.",
            ],
          },
          {
            heading: "Commercial Process",
            body: [
              "Institutional onboarding can include procurement review, security questionnaires, legal review, and data handling assurance. Timelines depend on requested integrations and compliance complexity.",
              "API usage, premium research rights, and internal redistribution rights should be addressed contractually before broad team rollout.",
            ],
          },
          {
            heading: "Support & Governance",
            body: [
              "Corporate customers should receive clear support channels, account ownership, and incident escalation paths aligned with business criticality.",
            ],
          },
        ],
      },
    },
  },
  "job-board": {
    slug: "job-board",
    locales: {
      zh: {
        title: "职位看板",
        eyebrow: "招聘与职业发展",
        summary: "面向编辑、工程、平台、运营和商业岗位的招聘说明。",
        updatedAt: "2026年5月19日",
        sections: [
          {
            heading: "招聘重点",
            body: [
              "Guava 当前关注编辑系统、内容平台、可靠性工程、受众增长和运营支持方向的人才建设。",
              "我们重视判断力、系统思维、稳定执行和面向产品质量的细节能力。",
            ],
          },
          {
            heading: "候选人体验",
            body: [
              "招聘流程应尊重时间、明确角色范围，并在适用情况下说明工作模式与薪酬区间。",
              "开放申请或合作型人才沟通可发送至 careers@guava.news。",
            ],
          },
          {
            heading: "平等机会",
            body: [
              "Guava 希望在尊重与包容的前提下，基于角色要求、能力与判断力评估候选人。",
            ],
          },
        ],
      },
      en: {
        title: "Job Board",
        eyebrow: "Careers & Hiring",
        summary: "Open roles, recruiting principles, and future newsroom, engineering, and operations hiring guidance.",
        updatedAt: "19 May 2026",
        sections: [
          {
            heading: "Hiring Focus",
            body: [
              "Guava is building across editorial systems, product engineering, platform reliability, audience growth, and operational support. Hiring priorities may shift with product maturity and market demand.",
              "We value editorial judgment, systems thinking, calm execution, and attention to product quality in both technical and non-technical roles.",
            ],
          },
          {
            heading: "Candidate Experience",
            body: [
              "Recruiting processes should be respectful, time-conscious, and clear about role scope, working model, and compensation range where applicable.",
              "Speculative applications and partnership-style talent conversations may be directed to careers@guava.news.",
            ],
          },
          {
            heading: "Equal Opportunity",
            body: [
              "Guava aims to evaluate candidates on merit, judgment, capability, and alignment with role requirements while supporting a respectful and inclusive hiring process.",
            ],
          },
        ],
      },
    },
  },
};

export const sitePageSlugs = Object.keys(sitePages);
export const supportedLocales: Locale[] = ["zh", "en"];

export function isSupportedLocale(value: string): value is Locale {
  return value === "zh" || value === "en";
}
