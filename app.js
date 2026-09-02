(() => {
  "use strict";

  const app = document.getElementById("app");
  const backupFile = document.getElementById("backup-file");
  const STORAGE_KEY = "ecore-crm-secure-v1";
  const SESSION_KEY = "ecore-crm-session-key";
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let data = null;
  let cryptoKey = null;
  let view = "dashboard";
  let selectedClientId = null;
  let modal = null;
  let toastTimer = null;
  let clientSearch = "";
  let clientStatus = "全部";
  let clientGrade = "全部";
  let clientDirection = "全部";
  let quickDraft = { company: "", website: "" };

  const navItems = [
    ["dashboard", "▦", "工作台"],
    ["clients", "●", "账户库"],
    ["pipeline", "↗", "机会漏斗"],
    ["tasks", "✓", "跟进任务"],
    ["activities", "➤", "触达记录"],
    ["quotes", "◆", "库存核验"],
    ["report", "▥", "老板汇报"],
  ];
  const statuses = ["待筛选", "已确认目标（待找联系人）", "LinkedIn申请已发送（等待通过）", "邮件已发送（等待回复）", "WhatsApp已发送（等待回复）", "多渠道已触达（等待回复）", "客户已回复", "已向客户发送报价", "已收到供应报价", "已发现采购需求", "已确认库存机会", "资料核验中", "价格评估中", "商务谈判中", "已成交", "培育", "已关闭"];
  const statusTone = { 待筛选: "gray", "已确认目标（待找联系人）": "gray", "LinkedIn申请已发送（等待通过）": "yellow", "邮件已发送（等待回复）": "yellow", "WhatsApp已发送（等待回复）": "yellow", "多渠道已触达（等待回复）": "yellow", 客户已回复: "pink", 已向客户发送报价: "red", 已收到供应报价: "red", 已发现采购需求: "red", 已确认库存机会: "red", 资料核验中: "orange", 价格评估中: "orange", 商务谈判中: "purple", 已成交: "green", 培育: "gray", 已关闭: "gray" };
  const accountGrades = ["A", "B", "C"];
  const directions = ["Buy-from", "Sell-to", "Two-way"];
  const accountTypes = ["SI", "Server Builder", "HPC / AI Infrastructure", "Distributor", "VAR", "Cloud / Hosting", "Data Center", "OEM / ODM", "Repair / Lifecycle", "General Trader", "Other"];
  const oldStatusMap = { 新线索: "待筛选", 已确认账户: "已确认目标（待找联系人）", 已触达: "多渠道已触达（等待回复）", 已建立联系: "多渠道已触达（等待回复）", 已找到联系人: "多渠道已触达（等待回复）", 已获取联系方式: "多渠道已触达（等待回复）", LinkedIn已触达: "LinkedIn申请已发送（等待通过）", WhatsApp已触达: "WhatsApp已发送（等待回复）", Email已触达: "邮件已发送（等待回复）", 多渠道已触达: "多渠道已触达（等待回复）", 已回复: "客户已回复", 报价中: "已收到供应报价", "需求/库存发现": "已确认库存机会", 资料齐全: "资料核验中", 商务评估: "价格评估中", 核验中: "资料核验中", 谈判中: "商务谈判中", 已成交: "已成交", 暂缓: "培育", 无效: "已关闭" };
  const progressOptions = [
    { value: "linkedin_pending", label: "LinkedIn 已发送 · Pending", tone: "pending" },
    { value: "email_pending", label: "Email 已发送 · 等待回复", tone: "pending" },
    { value: "whatsapp_pending", label: "WhatsApp 已发送 · 等待回复", tone: "pending" },
    { value: "linkedin_replied", label: "LinkedIn 已回复", tone: "reply" },
    { value: "email_replied", label: "Email 已回复", tone: "reply" },
    { value: "whatsapp_replied", label: "WhatsApp 已回复", tone: "reply" },
    { value: "quote_sent", label: "已向客户发送报价", tone: "opportunity" },
    { value: "customer_buying", label: "对方找我们采购（向我们买）", tone: "opportunity" },
    { value: "customer_selling", label: "对方找我们销售（向我们卖）", tone: "opportunity" },
  ];
  const progressLabelMap = Object.fromEntries(progressOptions.map((option) => [option.value, option.label]));
  const progressToneMap = Object.fromEntries(progressOptions.map((option) => [option.value, option.tone]));
  const RESEARCH_BATCH = "2026-08-13-amd-hpc-40";
  const ALL_CLIENTS_TOUCHED_MIGRATION = "2026-08-31-all-clients-touched";

  const OEM_CHANNEL_BATCH = "2026-08-31-oem-authorized-channel-19";
  const NICHE_COUNTRY_BATCH = "2026-09-02-niche-country-rdimm-9";
  const oemChannelSeed = [
    {
        "company": "MEMPHIS Electronic",
        "website": "https://www.memphis.de/en/",
        "country": "Germany",
        "accountGrade": "A",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Samsung DRAM / NAND / Enterprise Memory",
        "email": "sales@memphis.de",
        "linkedin": "https://www.linkedin.com/company/memphis-electronic-gmbh",
        "role": "Procurement / Product / Key Account",
        "score": 93,
        "priority": "A1",
        "evidence": "Samsung Semiconductor EMEA 官方 Sales Representatives & Distributors 目录列名；LinkedIn 规模 51–200，持续发布 memory / DRAM / NAND 内容。",
        "hypothesis": "BUY：采购 Samsung 企业级内存；SELL：在紧缺、BOM 变化或项目补单时提供可追溯全新原厂货。"
    },
    {
        "company": "SIMMS International",
        "website": "https://www.simms.co.uk/",
        "country": "United Kingdom",
        "accountGrade": "A",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Micron Enterprise DRAM / SSD / Industrial Storage",
        "email": "marketing@simms.co.uk",
        "linkedin": "https://uk.linkedin.com/company/simms-international-plc",
        "role": "Enterprise Sales / Procurement / Product Manager",
        "score": 93,
        "priority": "A1",
        "evidence": "Micron 官网 Authorized Distributors 目录列名；LinkedIn 规模 11–50，主营 enterprise DRAM、SSD 与工业存储。",
        "hypothesis": "BUY：Micron RDIMM/SSD；SELL：针对缺货、项目余量和BOM-change新货开展双向合作。"
    },
    {
        "company": "Convergent Systems (S) Pte Ltd",
        "website": "https://www.convergent.com.sg/",
        "country": "Singapore",
        "accountGrade": "A",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Micron RDIMM / Western Digital Enterprise SSD & HDD",
        "email": "enquiry@convergent.com.sg",
        "linkedin": "https://www.linkedin.com/company/convergent-systems-s-pte-ltd",
        "role": "Memory/Storage Product Manager / Procurement",
        "score": 92,
        "priority": "A1",
        "evidence": "Micron 官网 Authorized Distributors 目录列名；公司官网有 Western Digital 品牌合作页；新加坡本地渠道。",
        "hypothesis": "BUY：Micron企业内存及WD企业盘；SELL：用明确PN、项目补单或缺货需求切入。"
    },
    {
        "company": "Uniquest Asia Korea",
        "website": "https://www.uniquest.co.kr/",
        "country": "South Korea",
        "accountGrade": "A",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Micron Enterprise Memory / Semiconductor",
        "email": "micron@uniquest.co.kr",
        "linkedin": "https://www.linkedin.com/company/uniquest-corporation",
        "role": "Micron Product Manager / Memory Sales / Purchasing",
        "score": 91,
        "priority": "A1",
        "evidence": "Micron 官网 Authorized Distributors 韩国目录列名，并公开 Micron 专属邮箱。",
        "hypothesis": "BUY：获取韩国Micron企业RDIMM价格与交期基准；SELL：仅在确认具体缺货/BOM需求后推进。"
    },
    {
        "company": "GreenHill Elektronik GmbH",
        "website": "https://greenhill.de/",
        "country": "Germany",
        "accountGrade": "A",
        "accountType": "Distributor",
        "direction": "Buy-from",
        "products": "Samsung Semiconductor / Server DRAM / SSD",
        "email": "info@greenhill.de",
        "linkedin": "",
        "role": "Memory Sales / Procurement",
        "score": 88,
        "priority": "A2",
        "evidence": "Samsung Semiconductor EMEA 官方 Sales Representatives & Distributors 目录列名；德国小型渠道，官方联系资料完整。",
        "hypothesis": "BUY优先：用具体Samsung服务器RDIMM/SSD PN核验产品线、现货能力、出口和原包装条件。"
    },
    {
        "company": "AV Concept Singapore Pte Ltd",
        "website": "https://www.avconcept.com/",
        "country": "Singapore",
        "accountGrade": "A",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Samsung DRAM / SSD / Semiconductor",
        "email": "michael.lim@avconcept.com",
        "linkedin": "",
        "role": "Samsung Product Manager / Purchasing",
        "score": 88,
        "priority": "A2",
        "evidence": "Samsung Semiconductor SE & SW Asia 官方 Sales Representatives & Distributors 目录列名。",
        "hypothesis": "BUY：Samsung服务器RDIMM/企业SSD；SELL：只针对其项目缺货或明确PN，不发泛库存介绍。"
    },
    {
        "company": "Albatron Technology Co., Ltd.",
        "website": "https://www.albatron.com.tw/",
        "country": "Taiwan",
        "accountGrade": "A",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Micron Enterprise RDIMM / SSD",
        "email": "bmdp@albatron.com.tw",
        "linkedin": "",
        "role": "Memory Product Manager / Sales",
        "score": 88,
        "priority": "A2",
        "evidence": "Micron 官网 Authorized Distributors 亚洲目录列名。",
        "hypothesis": "BUY：建立台湾Micron授权报价池并核验原包装/出口；SELL：只处理紧缺指定PN。"
    },
    {
        "company": "Unitron Tech",
        "website": "http://www.unitrontech.com/",
        "country": "South Korea",
        "accountGrade": "A",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Micron Enterprise Memory",
        "email": "csh2@unitrontech.com",
        "linkedin": "",
        "role": "Micron Product Manager / Purchasing",
        "score": 89,
        "priority": "A2",
        "evidence": "Micron 官网 Authorized Distributors 韩国目录列名，并公开公司域名邮箱。",
        "hypothesis": "BUY：与Uniquest并行核验Micron企业RDIMM价格和交期；SELL：取得明确需求后再推进。"
    },
    {
        "company": "PALTEK Corporation",
        "website": "https://www.paltek.co.jp/",
        "country": "Japan",
        "accountGrade": "B",
        "accountType": "Distributor",
        "direction": "Buy-from",
        "products": "Micron Enterprise Memory / Storage",
        "email": "info_pal@paltek.co.jp",
        "linkedin": "",
        "role": "Micron Sales / Product Marketing",
        "score": 83,
        "priority": "B1",
        "evidence": "Micron 官网 Authorized Distributors 日本目录列名。",
        "hypothesis": "BUY：作为日本正规Micron渠道询问企业内存/存储、出口和香港/新加坡交付能力。"
    },
    {
        "company": "EG Electronics AB",
        "website": "https://egmemory.com/",
        "country": "Sweden / UK",
        "accountGrade": "B",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Samsung Enterprise Memory / SSD",
        "email": "Nick.Putnam@egmemory.com",
        "linkedin": "",
        "role": "Memory Sales / Procurement",
        "score": 86,
        "priority": "B1",
        "evidence": "Samsung Semiconductor EMEA 官方 Sales Representatives & Distributors 目录列名；业务域名聚焦memory。",
        "hypothesis": "BUY：用Samsung 64/96GB RDIMM具体PN询证；SELL：确认其是否接收excess/BOM-change全新库存。"
    },
    {
        "company": "Crestone Technology Group",
        "website": "https://www.crestonegroup.com/",
        "country": "United States",
        "accountGrade": "B",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Samsung Enterprise Memory / SSD",
        "email": "info@crestonegroup.com",
        "linkedin": "",
        "role": "Sales / Procurement",
        "score": 85,
        "priority": "B1",
        "evidence": "Samsung Semiconductor Americas 官方 Sales Representatives & Distributors 目录列名。",
        "hypothesis": "BUY：核验Samsung企业内存/SSD、owned/direct stock和出口能力；SELL：只在缺货事件下推进。"
    },
    {
        "company": "Neptune Electronics (NEco)",
        "website": "https://www.neccoelect.com/",
        "country": "United States",
        "accountGrade": "B",
        "accountType": "Distributor",
        "direction": "Buy-from",
        "products": "Samsung Semiconductor / High-reliability Components",
        "email": "info@neccoelect.com",
        "linkedin": "",
        "role": "Sales / Quality / Procurement",
        "score": 79,
        "priority": "B2",
        "evidence": "Samsung Semiconductor Americas 官方 Sales Representatives & Distributors 目录列名。",
        "hypothesis": "BUY：按具体Samsung PN询问服务器模组能力、MOQ、追溯与出口；不假设其持有现货。"
    },
    {
        "company": "Supertron India",
        "website": "https://www.supertronindia.com/",
        "country": "India",
        "accountGrade": "B",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Micron Enterprise Memory / IT Components",
        "email": "sanjay.khushlani@supertronindia.com",
        "linkedin": "",
        "role": "Micron Business Manager / Purchasing",
        "score": 80,
        "priority": "B2",
        "evidence": "Micron 官网 Authorized Distributors 亚洲目录列名，并提供直接业务联系人。",
        "hypothesis": "BUY：Micron企业内存；SELL：仅在印度本地缺货或明确项目需求后推进。"
    },
    {
        "company": "ASBIS Enterprises",
        "website": "https://www.asbis.com/",
        "country": "Cyprus / EMEA",
        "accountGrade": "B",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Samsung / Micron / Western Digital Enterprise Components",
        "email": "",
        "linkedin": "https://www.linkedin.com/company/asbis",
        "role": "Country Enterprise Storage / Components Product Manager",
        "score": 80,
        "priority": "B2",
        "evidence": "Samsung与Micron官方目录均有列名；Western Digital合作另有公开厂商/公司证据。",
        "hypothesis": "BUY/SELL均需按具体国家分支和品牌产品经理切入，禁止向集团总入口泛发。"
    },
    {
        "company": "Tomen Devices Corporation",
        "website": "https://www.tomendevices.co.jp/",
        "country": "Japan",
        "accountGrade": "B",
        "accountType": "Distributor",
        "direction": "Buy-from",
        "products": "Samsung Semiconductor / Enterprise Memory",
        "email": "",
        "linkedin": "",
        "role": "Memory Sales / Purchasing",
        "score": 74,
        "priority": "B2",
        "evidence": "Samsung Semiconductor 日本 Global Network 官方目录列名。",
        "hypothesis": "BUY：用作Samsung授权价格、交期和正规渠道基准；规模较大，不作为最快成交对象。"
    },
    {
        "company": "Eastronics",
        "website": "https://www.eastronics.com/",
        "country": "Israel",
        "accountGrade": "B",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Micron Enterprise RDIMM / SSD",
        "email": "eastronics@easx.co.il",
        "linkedin": "",
        "role": "Micron Product Manager / Purchasing",
        "score": 80,
        "priority": "B3",
        "evidence": "Micron 官网 Authorized Distributors 以色列目录列名。",
        "hypothesis": "BUY：补充Micron企业RDIMM/SSD报价池；SELL：仅针对明确PN需求。"
    },
    {
        "company": "Edge Electronics, Inc.",
        "website": "https://www.edgeelectronics.com/",
        "country": "United States",
        "accountGrade": "B",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Micron Enterprise Memory / EOL-LTB",
        "email": "sales@edgeelectronics.com",
        "linkedin": "",
        "role": "Micron Product Manager / Sales",
        "score": 80,
        "priority": "B3",
        "evidence": "Micron 官网 Authorized Distributors Americas 目录列名。",
        "hypothesis": "BUY：核验Micron企业模组、EOL/LTB和可追溯货；SELL：对紧缺或生命周期项目提供新货。"
    },
    {
        "company": "Excelpoint Systems",
        "website": "https://www.excelpoint.com/",
        "country": "Singapore",
        "accountGrade": "B",
        "accountType": "Distributor",
        "direction": "Buy-from",
        "products": "Samsung DRAM / SSD / Semiconductor",
        "email": "Patricia.ng@excelpoint.com.sg",
        "linkedin": "",
        "role": "Samsung Product Manager / Procurement",
        "score": 75,
        "priority": "B3",
        "evidence": "Samsung Semiconductor SE & SW Asia 官方 Sales Representatives & Distributors 目录列名。",
        "hypothesis": "BUY：作为Samsung授权报价/交期基准，先确认server DRAM而非仅嵌入式设计业务。"
    },
    {
        "company": "Abacus Electric",
        "website": "https://www.abacus.cz/",
        "country": "Czech Republic",
        "accountGrade": "A",
        "accountType": "Distributor",
        "direction": "Two-way",
        "products": "Samsung Enterprise Memory / SSD / Server Components",
        "email": "jp@abacus.cz",
        "linkedin": "",
        "role": "Component Purchasing / Samsung Product Manager",
        "score": 86,
        "priority": "B1",
        "evidence": "Samsung Semiconductor EMEA 官方 Sales Representatives & Distributors 目录列名；CRM已有同名账户，本批仅补充OEM渠道证据，不重复新增。",
        "hypothesis": "BUY：核验Samsung企业内存/SSD；SELL：结合其服务器业务询问项目缺货和BOM-change。"
    }
];
  const nicheCountrySeed = [
    {
      company: "Maguay Computers",
      website: "https://www.maguay.ro/",
      country: "Romania",
      accountGrade: "A",
      accountType: "Server Builder",
      direction: "Buy-from",
      products: "Samsung / SK hynix / Micron 64GB, 96GB, 128GB DDR5 RDIMM; AI/HPC servers",
      email: "office@maguay.ro",
      role: "Purchasing / Supply Chain / Server Product Manager",
      score: 91,
      priority: "A1",
      evidence: "Intel Partner Showcase confirms Maguay builds AI/HPC and data-center systems plus its own servers/storage; official site and contact page verify the company domain and office email. Sources: https://www.intel.com/content/www/us/en/partner/showcase/storefront/a5S3b0000016NifEAE/maguay-computers-srl.html | https://www.maguay.ro/contact",
      hypothesis: "Own-brand server and HPC project configurations can create new/unused RDIMM from BOM changes, cancelled deployments, spare allocation or configuration updates.",
    },
    {
      company: "XENYA d.o.o.",
      website: "https://xenya.si/",
      country: "Slovenia",
      accountGrade: "A",
      accountType: "HPC / AI Infrastructure",
      direction: "Buy-from",
      products: "Supermicro / NVIDIA data-center systems; high-capacity DDR5 RDIMM; storage",
      email: "sales@xenya.si",
      role: "Server Sales / Product / Procurement",
      score: 91,
      priority: "A1",
      evidence: "XENYA's official 2025 Data Center Industry page states it represents Supermicro and NVIDIA in Slovenia and publishes a company-domain sales email. Sources: https://xenya.si/xenya-at-the-data-center-industry-2025-conference/ | https://xenya.si/about-us/",
      hypothesis: "Supermicro and NVIDIA project supply creates a credible path to high-capacity server memory, project spares and released configuration stock.",
    },
    {
      company: "ETA2U",
      website: "https://www.eta2u.ro/",
      country: "Romania",
      accountGrade: "A",
      accountType: "HPC / AI Infrastructure",
      direction: "Buy-from",
      products: "HPC systems, data-center integration, servers, storage, DDR5 RDIMM",
      email: "office@eta2u.ro",
      role: "HPC / Infrastructure Procurement / Supply Chain",
      score: 89,
      priority: "A1",
      evidence: "ETA2U's official site describes 30+ years in complex IT integration, 1,000+ active clients and 32 strategic partners; IBM verifies it as an SI/MSP/VAR. Sources: https://www.eta2u.ro/ | https://www.ibm.com/partnerplus/directory/company/3537 | https://www.eta2u.ro/contact",
      hypothesis: "HPC and end-to-end data-center projects can generate unused RDIMM through project-specific BOM changes, spare stock or delayed/cancelled deployments.",
    },
    {
      company: "Kontrax JSC",
      website: "https://kontrax.bg/en/",
      country: "Bulgaria",
      accountGrade: "A",
      accountType: "SI",
      direction: "Buy-from",
      products: "Dell / Fujitsu / Lenovo servers, PowerEdge HPC/AI, storage, DDR5 RDIMM",
      email: "office@kontrax.bg",
      role: "Data Center Solutions / Procurement / Product Manager",
      score: 88,
      priority: "A1",
      evidence: "Kontrax's official data-center page lists Dell, Fujitsu and Lenovo server solutions including PowerEdge HPC/AI systems; its official contact page verifies the company email and Sofia address. Sources: https://kontrax.bg/en/resheniya/czentrove-za-danni/data-center-equipment-and-system-software/ | https://kontrax.bg/en/contacts/",
      hypothesis: "Multi-vendor server projects can create customer-specific spare memory, cancelled-order stock or configuration-change inventory.",
    },
    {
      company: "CNsys Plc",
      website: "https://cnsys.bg/en/",
      country: "Bulgaria",
      accountGrade: "A",
      accountType: "SI",
      direction: "Buy-from",
      products: "Data-center systems, hyperconverged infrastructure, servers, storage, DDR5 RDIMM",
      email: "sales@cnsys.bg",
      role: "Data Center Solutions / Purchasing / Supply Chain",
      score: 86,
      priority: "A2",
      evidence: "CNsys states it is a direct Platinum/Gold partner able to design and supply data-center products in Bulgaria; its official contact page publishes a sales inbox and national office network. Sources: https://cnsys.bg/en/data-center-solutions/ | https://cnsys.bg/en/contact-us/",
      hypothesis: "Direct project supply and a national service footprint make project spares, replacement stock and unused configuration inventory plausible.",
    },
    {
      company: "M SAN Grupa",
      website: "https://www.msan.hr/en/",
      country: "Croatia",
      accountGrade: "B",
      accountType: "Distributor",
      direction: "Buy-from",
      products: "Enterprise VAD, servers, storage, data-center products, high-capacity DDR5 RDIMM",
      email: "",
      role: "Enterprise VAD / Product Manager / Procurement",
      score: 85,
      priority: "B1",
      evidence: "M SAN's official pages describe an enterprise VAD business, 6,100+ partners, 200,000 products delivered monthly and a 56,347 m2 logistics footprint with customs warehousing. Sources: https://www.msan.hr/enterprise/ | https://www.msan.hr/en/distribution/ | https://www.msan.hr/en/the-company/",
      hypothesis: "Regional VAD inventory and customs warehousing may yield channel stock, allocation changes or project returns, but server-memory ownership must be verified before treating it as supply.",
    },
    {
      company: "Arctur d.o.o.",
      website: "https://www.arctur.si/en/",
      country: "Slovenia",
      accountGrade: "B",
      accountType: "HPC / AI Infrastructure",
      direction: "Buy-from",
      products: "Private HPC / cloud infrastructure; high-memory compute nodes; enterprise storage",
      email: "info@arctur.si",
      role: "Data Center Operations / Infrastructure / Procurement",
      score: 84,
      priority: "B1",
      evidence: "The European Monitor of Industrial Ecosystems documents Arctur's HPC/cloud infrastructure with up to 1TB memory per node, NVIDIA Tesla GPUs and 1.5PB storage; official sources verify its domain and contact channel. Sources: https://monitor-industrial-ecosystems.ec.europa.eu/technology-centre/arctur-doo-0 | https://www.arctur.si/en/news/arctur-opened-its-data-centre-doors/",
      hypothesis: "A privately operated HPC environment can generate unused spares or refresh stock, although it is more likely to be an end user than a recurring distributor.",
    },
    {
      company: "COMING Computer Engineering",
      website: "https://coming.rs/en/home/",
      country: "Serbia",
      accountGrade: "B",
      accountType: "Cloud / Hosting",
      direction: "Buy-from",
      products: "Cloud infrastructure, enterprise servers, backup / DR, DDR5 RDIMM",
      email: "office@coming.rs",
      role: "Infrastructure Operations / Procurement / Hardware",
      score: 82,
      priority: "B2",
      evidence: "COMING's official site verifies its enterprise IT systems business, vendor partnerships, Belgrade office and company-domain email; its LinkedIn company page identifies it as a Serbian cloud provider operating since 2009. Sources: https://coming.rs/en/home/ | https://rs.linkedin.com/company/coming---computer-engineering",
      hypothesis: "Cloud infrastructure and managed IT projects can create spare or refresh inventory, but new/unused condition and ownership need early confirmation.",
    },
    {
      company: "NewCytech Business Solutions",
      website: "https://newcytech.logicom.net/",
      country: "Cyprus",
      accountGrade: "B",
      accountType: "SI",
      direction: "Buy-from",
      products: "Enterprise infrastructure solutions, servers, storage, data-center hardware",
      email: "newcytech@newcytech.com",
      role: "Infrastructure Solutions / Procurement / Product",
      score: 82,
      priority: "B2",
      evidence: "IBM's partner directory verifies NewCytech as a Cyprus business technology company within Logicom Group; its official contact page verifies the Nicosia entity, phone and company email. Sources: https://www.ibm.com/partnerplus/directory/company/6015 | https://newcytech.logicom.net/contact-us/",
      hypothesis: "Enterprise infrastructure projects inside a regional distribution group may create BOM-change or released project stock; exact memory capability remains unverified.",
    },
  ];
  const AMD_EPYC_DIRECTORY = "https://www.amd.com/en/where-to-buy/processors/epyc/sys-integrators.html";
  const researchAccountSeed = [
    { company: "Abacus Electric", website: "https://www.abacus.cz/", country: "Czech Republic", accountGrade: "A", accountType: "Server Builder", focus: true, direction: "Buy-from", evidence: "官网明确生产 white-box 服务器与存储，并经营服务器部件、内存和 SSD；AMD EPYC 官方方案商。", hypothesis: "有服务器组装、现货与项目订单，最可能出现 BOM 变更、订单未交付或全新部件余量。" },
    { company: "Advanced Clustering Technologies", website: "https://www.advancedclustering.com/", country: "United States", accountGrade: "A", accountType: "HPC / AI Infrastructure", evidence: "官网专注 HPC/AI 集群、服务器与工作站；AMD EPYC 官方方案商。", hypothesis: "集群项目使用大量 RDIMM 与企业级 NVMe，适合询问项目取消、扩容余料和 spare stock。" },
    { company: "Advanced HPC", website: "https://www.advancedhpc.com/", country: "United States", accountGrade: "A", accountType: "HPC / AI Infrastructure", focus: true, evidence: "官网可配置 Supermicro EPYC GPU 服务器，明确列出 DDR4/DDR5 RDIMM 与 NVMe；AMD EPYC 官方方案商。", hypothesis: "直接配置 Supermicro HPC 服务器，部件匹配度高，优先找采购、供应链或库存负责人。" },
    { company: "ASA Computers", website: "https://www.asacomputers.com/", country: "United States", accountGrade: "A", accountType: "Server Builder", focus: true, direction: "Buy-from", email: "sales@asacomputers.com", evidence: "官网销售 Supermicro GPU/EPYC 服务器，并设有 CPU、Memory、SSD clearance；AMD EPYC 官方方案商。", hypothesis: "同时具备系统集成与 clearance 库存入口，是 Ecore 最优先的潜在库存供应方之一。" },
    { company: "Aspen Systems", website: "https://www.aspsys.com/", country: "United States", accountGrade: "A", accountType: "HPC / AI Infrastructure", evidence: "官网定位定制 HPC 集群、AI 硬件与服务器；AMD EPYC 官方方案商。", hypothesis: "定制项目会形成配置变更、备用件和交付余量，适合采购优先触达。" },
    { company: "Atipa Technologies", website: "https://www.atipa.com/", country: "United States", accountGrade: "A", accountType: "HPC / AI Infrastructure", email: "sales@atipa.com", evidence: "官网设计和交付 HPC、AI 与数据基础设施，服务器配置包含 DDR5 与 NVMe；AMD EPYC 官方方案商。", hypothesis: "定制服务器/集群的 RDIMM 与企业 SSD 用量大，优先询问 cancelled project 和 released inventory。" },
    { company: "Broadberry Data Systems", website: "https://www.broadberry.com/", country: "United Kingdom", accountGrade: "A", accountType: "Server Builder", focus: true, evidence: "官网提供可配置 Supermicro EPYC GPU、HPC 与存储服务器，明确列出 DDR5 RDIMM/NVMe；AMD EPYC 官方方案商。", hypothesis: "服务器配置器和多平台库存使其具备部件余量与型号切换机会。" },
    { company: "DIAWAY", website: "https://diaway.com/", country: "Estonia", accountGrade: "A", accountType: "HPC / AI Infrastructure", focus: true, email: "contact@diaway.com", evidence: "官网提供 EPYC HCI、全 NVMe 与存储服务器，配置使用 WD Ultrastar NVMe 和 RDIMM；AMD EPYC 官方方案商。", hypothesis: "波罗的海区域中型集成商，产品与 Ecore 采购品类直接重合，区域竞争相对较低。" },
    { company: "M Computers", website: "https://mcomputers.cz/", country: "Czech Republic", accountGrade: "A", accountType: "HPC / AI Infrastructure", focus: true, email: "info@mcomputers.cz", evidence: "官网有 Supermicro/EPYC 服务器、AI 超算项目，并明确测试 Kingston 内存与企业 SSD；AMD EPYC 官方方案商。", hypothesis: "项目型 HPC 集成与硬件测试会形成备件、替换料和项目余量，适合本地语言触达。" },
    { company: "Nor-Tech", website: "https://nor-tech.com/", country: "United States", accountGrade: "A", accountType: "HPC / AI Infrastructure", evidence: "官网明确列出 Supermicro 与 AMD 合作，提供 HPC 集群、AI 服务器、全闪和并行存储；AMD EPYC 官方方案商。", hypothesis: "系统集成、升级和回收服务并存，既可能释放库存也可能有紧急缺料。" },
    { company: "ServerDirect", website: "https://www.serverdirect.nl/", country: "Netherlands", accountGrade: "A", accountType: "Server Builder", focus: true, direction: "Buy-from", evidence: "官网标注 Supermicro Direct Partner，单独销售 DDR5 RDIMM、Solidigm 企业 SSD并提供服务器/存储集成；AMD EPYC 官方方案商。", hypothesis: "可见部件级目录和价格，库存透明度较高，优先询问现货、released stock 与批量折扣。" },
    { company: "Thinkmate", website: "https://www.thinkmate.com/", country: "United States", accountGrade: "A", accountType: "Server Builder", evidence: "官网拥有完整 Supermicro 服务器、存储、GPU/HPC 配置器；原 AMD 目录成员 Silicon Mechanics 已并入 Thinkmate。", hypothesis: "Supermicro 系统配置量大，存在 RDIMM/NVMe 配置替换和库存释放机会，但需精准找供应链角色。" },
    { company: "International Computer Concepts", website: "https://www.icc-usa.com/", country: "United States", accountGrade: "A", accountType: "HPC / AI Infrastructure", evidence: "官网专注 AI/HPC 解决方案和定制基础设施；AMD EPYC 官方方案商。", hypothesis: "定制 AI/HPC 项目部件密度高，可双向开发项目余料与紧急缺料。" },
    { company: "EchoStreams Innovative Solutions", website: "https://echostreams.com/", country: "United States", accountGrade: "A", accountType: "Server Builder", evidence: "官网提供服务器、存储与高密度平台；AMD EPYC 官方方案商。", hypothesis: "服务器和存储平台制造/集成属性强，优先确认是否自持内存和企业 SSD 库存。" },
    { company: "RAID Media Systems", website: "https://www.raidmedia.com/", country: "Germany", accountGrade: "A", accountType: "Server Builder", focus: true, evidence: "官网专注存储、服务器和媒体工作流系统；AMD EPYC 官方方案商。", hypothesis: "存储项目与企业 SSD 高度匹配，适合询问项目 surplus、spares 和 discontinued configuration。" },
    { company: "2CRSi", website: "https://www.2crsi.com/", country: "France", accountGrade: "B", accountType: "Server Builder", evidence: "官网设计制造高性能节能服务器，覆盖 AI、Cloud、HPC 与数据中心；AMD EPYC 官方方案商。", hypothesis: "直接制造服务器，部件需求真实，但公司体量和正式采购流程较大，作为第二梯队精准开发。" },
    { company: "Ace Computers", website: "https://acecomputers.com/", country: "United States", accountGrade: "B", accountType: "Server Builder", evidence: "官网提供 AI 服务器、通用 HPC、存储和工作站；AMD EPYC 官方方案商。", hypothesis: "系统制造能力强，但政府/军工占比较高且美国敏感度较高，需回避敏感用途并低频开发。" },
    { company: "AMAX Engineering", website: "https://www.amax.com/", country: "United States", accountGrade: "B", accountType: "HPC / AI Infrastructure", evidence: "官网提供 AI/HPC、数据中心与定制服务器工程；AMD EPYC 官方方案商。", hypothesis: "部件消耗量大但组织较成熟，优先找供应链/库存而非泛销售。" },
    { company: "BIOS IT", website: "https://www.bios-it.co.uk/", country: "United Kingdom", accountGrade: "B", accountType: "HPC / AI Infrastructure", evidence: "官网聚焦 HPC、AI 和高性能服务器；AMD EPYC 官方方案商。", hypothesis: "英国 HPC 集成商，可能有项目余料，但需先核验当前采购实体与仓库所在地。" },
    { company: "Boston Limited", website: "https://boston.co.uk/", country: "United Kingdom", accountGrade: "B", accountType: "HPC / AI Infrastructure", evidence: "官网提供服务器、存储、AI/HPC 和数据中心方案；AMD EPYC 官方方案商。", hypothesis: "产品高度匹配但集团规模偏大，适合作为稳定长期账户而非追求快速回复。" },
    { company: "CARRI Systems", website: "https://www.carri.com/", country: "France", accountGrade: "B", accountType: "Server Builder", focus: true, evidence: "官网为法国 AI 服务器、工作站和集群制造集成商；AMD EPYC 官方方案商。", hypothesis: "本地化法语触达采购或运营负责人，重点问 cancelled project 和 extra units。" },
    { company: "CIARA", website: "https://ciaratech.com/", country: "Canada", accountGrade: "B", accountType: "Server Builder", evidence: "官网提供服务器、工作站、HPC 与 OEM 方案；AMD EPYC 官方方案商。", hypothesis: "OEM/项目配置会产生替换物料，但北美开发成本较高，列入第二梯队。" },
    { company: "Colfax International", website: "https://www.colfax-intl.com/", country: "United States", accountGrade: "B", accountType: "HPC / AI Infrastructure", evidence: "官网专注 HPC 与 AI 服务器、集群和工作站；AMD EPYC 官方方案商。", hypothesis: "定制配置与研究客户较多，适合项目余料和紧急缺料双向开发。" },
    { company: "DALCO", website: "https://www.dalco.ch/", country: "Switzerland", accountGrade: "B", accountType: "HPC / AI Infrastructure", focus: true, evidence: "官网提供高性能计算、服务器和专业系统；AMD EPYC 官方方案商。", hypothesis: "瑞士中型技术公司，可信度高但库存释放概率需通过采购/运营角色验证。" },
    { company: "DELTA Computer Products", website: "https://www.deltacomputer.com/", country: "Germany", accountGrade: "B", accountType: "HPC / AI Infrastructure", evidence: "官网覆盖 HPC、AI、服务器、存储和 GPU 基础设施；AMD EPYC 官方方案商。", hypothesis: "技术匹配度高，德语触达供应链或产品负责人；避免只联系整机销售。" },
    { company: "Exxact", website: "https://www.exxactcorp.com/", country: "United States", accountGrade: "B", accountType: "HPC / AI Infrastructure", evidence: "官网提供 Deep Learning、HPC、服务器与分销业务；AMD EPYC 官方方案商。", hypothesis: "供应链和库存体量可观，但美国渠道竞争高，作为精准而非大批量开发对象。" },
    { company: "FORMAT", website: "https://www.format.com.pl/", country: "Poland", accountGrade: "B", accountType: "SI", focus: true, evidence: "官网提供服务器、IT 基础设施与集成服务；AMD EPYC 官方方案商。", hypothesis: "东欧区域适合本地化触达，先确认是否自行配置服务器和持有 RDIMM/SSD。" },
    { company: "Images & Technology", website: "https://www.imagespc.com/", country: "Canada", accountGrade: "B", accountType: "HPC / AI Infrastructure", evidence: "官网提供 HPC、AI、服务器与专业计算方案；AMD EPYC 官方方案商。", hypothesis: "项目型客户可能有 surplus/spares，优先找采购或技术销售负责人。" },
    { company: "KOI Computers", website: "https://www.koicomputers.com/", country: "United States", accountGrade: "B", accountType: "Server Builder", email: "sales@koicomputers.com", evidence: "AMD EPYC 与 NVIDIA Certified Systems 官方目录均可验证，官网提供定制 HPC 集群、服务器和存储。", hypothesis: "可信度较高且公司规模适中，但政府项目较多；以商业、教育或研究项目余料切入并回避敏感用途。" },
    { company: "MEGWARE", website: "https://www.megware.com/", country: "Germany", accountGrade: "B", accountType: "HPC / AI Infrastructure", focus: true, evidence: "官网专注 HPC 系统与集群解决方案；AMD EPYC 官方方案商。", hypothesis: "大型 HPC 项目存在部件余量，但采购流程偏专业，需用德语和具体 PN 切入。" },
    { company: "Microway", website: "https://www.microway.com/", country: "United States", accountGrade: "B", accountType: "HPC / AI Infrastructure", evidence: "官网长期提供 HPC、AI、GPU 服务器和集群；AMD EPYC 官方方案商。", hypothesis: "产品匹配但美国响应与合规成本较高，第二梯队低频精准开发。" },
    { company: "Network Allies", website: "https://www.networkallies.com/", country: "United States", accountGrade: "B", accountType: "Server Builder", evidence: "AMD EPYC 官方方案商目录列名；官网需进一步核验当前服务器/存储产品线。", hypothesis: "先确认仍自有集成与库存能力，再问 spare stock，不直接发送长模板。" },
    { company: "PSSC Labs", website: "https://pssclabs.com/", country: "United States", accountGrade: "B", accountType: "HPC / AI Infrastructure", evidence: "官网提供 on-prem AI、HPC、Big Data 集群与定制服务器；AMD EPYC 官方方案商。", hypothesis: "政府/研究项目多，部件需求强但敏感性较高，话术聚焦教育、科研和商业项目。" },
    { company: "Puget Systems", website: "https://puget.systems/", country: "United States", accountGrade: "B", accountType: "Server Builder", evidence: "AMD EPYC 官方方案商目录列名，官网提供专业工作站和服务器。", hypothesis: "定制工作站/服务器有换料可能，但企业 RDIMM/SSD 占比需先核验。" },
    { company: "Racklive", website: "https://racklive.com/", country: "United States", accountGrade: "B", accountType: "Data Center", evidence: "AMD EPYC 官方方案商目录列名，定位数据中心与机架基础设施。", hypothesis: "可能有规模化服务器项目和 spare inventory；先确认采购实体与项目类型。" },
    { company: "SCAN Computers", website: "https://www.scan.co.uk/", country: "United Kingdom", accountGrade: "B", accountType: "Server Builder", evidence: "官网提供组件、服务器、3XS 系统与 HPC；AMD EPYC 官方方案商。", hypothesis: "库存和产品广但规模较大，价格竞争强；适合明确 PN/数量的机会型开发。" },
    { company: "TAROX", website: "https://www.tarox.de/", country: "Germany", accountGrade: "B", accountType: "Server Builder", evidence: "官网提供德国本地 IT、服务器与基础设施方案；AMD EPYC 官方方案商。", hypothesis: "制造与渠道兼具，可能有 released stock，但应定位产品管理或采购而非泛销售。" },
    { company: "Thomas-Krenn", website: "https://www.thomas-krenn.com/", country: "Germany", accountGrade: "B", accountType: "Server Builder", evidence: "官网提供可配置企业服务器与存储；AMD EPYC 官方方案商。", hypothesis: "可信度高、产品匹配，但体量较大且库存管理成熟，作为中长期账户。" },
    { company: "WORTMANN", website: "https://www.wortmann.de/", country: "Germany", accountGrade: "B", accountType: "OEM / ODM", evidence: "官网为德国 TERRA IT 制造与渠道公司；AMD EPYC 官方方案商。", hypothesis: "制造端可能有物料释放，但公司较大，需找供应链/产品管理的准确入口。" },
    { company: "Penguin Solutions", website: "https://www.penguinsolutions.com/en-us", country: "United States", accountGrade: "B", accountType: "HPC / AI Infrastructure", evidence: "原 Penguin Computing，官网提供大规模 AI 数据中心基础设施；AMD EPYC 官方方案商目录列名。", hypothesis: "规模偏大且项目复杂，保留为高质量长期账户，不进入本周首触达优先队列。" },
  ];

  function uid() {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
  }
  function isoOffset(days, hour = 10, minute = 0) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }
  function dateKey(value) {
    const d = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  }
  function fmt(value, time = true) {
    if (!value) return "未设置";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Singapore", month: "numeric", day: "numeric",
      ...(time ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
    }).format(d);
  }
  function localInput(days = 0, hour = 10) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  }
  function localDateTime(value) {
    if (!value) return "";
    const d = new Date(value);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  }
  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[m]);
  }
  function clientById(id) {
    return data.clients.find((item) => item.id === Number(id));
  }
  function trustLevel(score) {
    return score >= 85 ? "较可信" : score >= 65 ? "需继续核验" : "待核验";
  }
  function statusPill(status) {
    return `<span class="status ${statusTone[status] || "gray"}">${escapeHtml(status)}</span>`;
  }
  function trustPill(score) {
    const tone = score >= 85 ? "good" : score >= 65 ? "medium" : "low";
    return `<span class="trust ${tone}">${score} · ${trustLevel(score)}</span>`;
  }
  function gradePill(grade = "C") {
    return `<span class="grade grade-${escapeHtml(grade)}">${escapeHtml(grade)}级</span>`;
  }
  function directionLabel(direction) {
    return ({ "Buy-from": "向对方采购", "Sell-to": "向对方销售", "Two-way": "双向账户" })[direction] || direction || "待判断";
  }
  function clientActivities(clientId) {
    return (data?.activities || []).filter((activity) => Number(activity.clientId) === Number(clientId));
  }
  function latestClientActivity(clientId) {
    return [...clientActivities(clientId)].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))[0] || null;
  }
  function uniqueProgressTags(tags = []) {
    const unique = [...new Set(tags)].filter((tag) => progressLabelMap[tag]);
    ["linkedin", "email", "whatsapp"].forEach((channel) => {
      if (unique.includes(`${channel}_replied`)) {
        const pendingIndex = unique.indexOf(`${channel}_pending`);
        if (pendingIndex >= 0) unique.splice(pendingIndex, 1);
      }
    });
    return unique;
  }
  function progressTagsFromForm(form) {
    return uniqueProgressTags(new FormData(form).getAll("progressTags"));
  }
  function derivedStatus(tags = [], fallback = "已确认目标（待找联系人）") {
    if (tags.includes("customer_buying")) return "已发现采购需求";
    if (tags.includes("customer_selling")) return "已收到供应报价";
    if (tags.includes("quote_sent")) return "已向客户发送报价";
    if (tags.some((tag) => progressToneMap[tag] === "reply")) return "客户已回复";
    const pending = tags.filter((tag) => progressToneMap[tag] === "pending");
    if (pending.length > 1) return "多渠道已触达（等待回复）";
    if (pending[0] === "linkedin_pending") return "LinkedIn申请已发送（等待通过）";
    if (pending[0] === "email_pending") return "邮件已发送（等待回复）";
    if (pending[0] === "whatsapp_pending") return "WhatsApp已发送（等待回复）";
    return fallback;
  }
  function progressSelector(selectedTags = []) {
    const selected = new Set(selectedTags);
    const groups = [
      ["已触达 · 浅黄色", "pending"],
      ["客户已回复 · 浅粉色", "reply"],
      ["真实业务机会 · 红色", "opportunity"],
    ];
    return `<div class="progress-selector">${groups.map(([title, tone]) => `<fieldset class="progress-group ${tone}"><legend>${title}</legend>${progressOptions.filter((option) => option.tone === tone).map((option) => `<label><input type="checkbox" name="progressTags" value="${option.value}" ${selected.has(option.value) ? "checked" : ""} /><span>${option.label}</span></label>`).join("")}</fieldset>`).join("")}</div>`;
  }
  function progressPills(client) {
    const tags = uniqueProgressTags(client.progressTags);
    if (!tags.length) return statusPill(client.status);
    return `<div class="progress-pills">${tags.map((tag) => `<span class="progress-pill ${progressToneMap[tag]}">${escapeHtml(progressLabelMap[tag])}</span>`).join("")}</div>`;
  }
  function accountProgressState(client) {
    const tones = uniqueProgressTags(client.progressTags).map((tag) => progressToneMap[tag]);
    if (tones.includes("opportunity")) return "opportunity";
    if (tones.includes("reply")) return "reply";
    if (tones.includes("pending")) return "outreach";
    return "none";
  }
  function contactMethods(client) {
    const methods = [];
    if (client.linkedin) methods.push("LinkedIn");
    if (client.whatsapp) methods.push("WhatsApp");
    if (client.email) methods.push("Email");
    return methods;
  }
  function contactSummary(client) {
    const methods = contactMethods(client);
    return `<strong>${escapeHtml(client.contactName || "待寻找")}</strong>${client.jobTitle ? `<small>${escapeHtml(client.jobTitle)}</small>` : ""}<span class="contact-methods">${methods.length ? methods.map((method) => `<i>${method}</i>`).join("") : "<em>暂无联系方式</em>"}</span>`;
  }
  function activitySummary(activity, total = 0) {
    if (!activity) return `<span class="no-activity">暂无沟通记录</span>`;
    return `<div class="activity-preview"><div><b>${escapeHtml(activity.channel)} · ${escapeHtml(activity.activityType)}</b><time>${fmt(activity.occurredAt)}</time></div><p>${escapeHtml(activity.summary || "未填写摘要")}</p>${total > 1 ? `<small>共 ${total} 条沟通记录</small>` : ""}</div>`;
  }
  function researchAccounts() {
    const now = new Date().toISOString();
    return researchAccountSeed.map((item, index) => {
      const dueGroup = item.focus ? Math.floor(researchAccountSeed.filter((candidate, candidateIndex) => candidate.focus && candidateIndex < index).length / 4) : 5 + (index % 4);
      const nextFollowUpAt = isoOffset(dueGroup, 10 + (index % 4), index % 2 ? 30 : 0);
      return {
        id: 6801 + index,
        company: item.company,
        website: item.website,
        country: item.country,
        businessRole: item.direction === "Buy-from" ? "供应商" : "双向合作",
        products: "DDR4/DDR5 ECC RDIMM, Enterprise NVMe/SATA SSD, Server barebone/components",
        source: "AMD EPYC 官方方案商目录 / 公司官网",
        contactName: "",
        jobTitle: "",
        email: item.email || "",
        whatsapp: "",
        linkedin: "",
        status: "已确认目标（待找联系人）",
        trustScore: item.accountGrade === "A" ? 90 : 82,
        followUpStage: "联系人研究",
        lastTouchAt: "",
        nextFollowUpAt,
        nextAction: item.accountGrade === "A"
          ? "定位 Purchasing / Supply Chain / Inventory 负责人；询问项目取消、BOM 变更或全新未使用 RDIMM/SSD 余料"
          : "定位采购或产品负责人；先确认是否自持库存，再询问项目余料、spare stock 或 released inventory",
        notes: `2026-08-13 筛选批次；尚未触达。${item.hypothesis}`,
        accountGrade: item.accountGrade,
        direction: item.direction || "Two-way",
        accountType: item.accountType,
        commercialHypothesis: item.hypothesis,
        verifiedEvidence: `大厂目录：${AMD_EPYC_DIRECTORY}；官网核验：${item.evidence}`,
        owner: "Jenna",
        researchBatch: RESEARCH_BATCH,
        focus: Boolean(item.focus),
        createdAt: now,
        updatedAt: now,
      };
    });
  }
  function mergeResearchBatch(payload) {
    const leads = researchAccounts();
    const cleanUrl = (value = "") => String(value).toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
    const cleanName = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
    const existingByUrl = new Map(payload.clients.map((client) => [cleanUrl(client.website), client]));
    const existingByName = new Map(payload.clients.map((client) => [cleanName(client.company), client]));
    const newlyAdded = [];

    leads.forEach((lead) => {
      const existing = existingByUrl.get(cleanUrl(lead.website)) || existingByName.get(cleanName(lead.company));
      if (existing) {
        if (!existing.verifiedEvidence || existing.verifiedEvidence.startsWith("待补充")) existing.verifiedEvidence = lead.verifiedEvidence;
        if (!existing.commercialHypothesis) existing.commercialHypothesis = lead.commercialHypothesis;
        if (!existing.accountType || existing.accountType === "Other") existing.accountType = lead.accountType;
        if (!existing.products) existing.products = lead.products;
        if (!existing.source) existing.source = lead.source;
        if (existing.researchBatch === RESEARCH_BATCH && !existing.lastTouchAt) {
          existing.focus = lead.focus;
          existing.nextFollowUpAt = lead.nextFollowUpAt;
          existing.updatedAt = lead.updatedAt;
        }
        return;
      }
      payload.clients.push(lead);
      existingByUrl.set(cleanUrl(lead.website), lead);
      existingByName.set(cleanName(lead.company), lead);
      newlyAdded.push(lead);
    });

    const completedResearchTasks = (payload.tasks || []).filter((task) => task.researchBatch === RESEARCH_BATCH && task.completed);
    const existingTaskClients = new Set(completedResearchTasks.map((task) => Number(task.clientId)));
    payload.tasks = (payload.tasks || []).filter((task) => task.researchBatch !== RESEARCH_BATCH || task.completed);
    leads.filter((lead) => lead.focus).forEach((lead, index) => {
      const account = payload.clients.find((client) => cleanUrl(client.website) === cleanUrl(lead.website));
      if (!account || existingTaskClients.has(Number(account.id))) return;
      payload.tasks.push({
        id: 7801 + index,
        clientId: account.id,
        title: "找到采购/供应链负责人并完成首次触达",
        dueAt: lead.nextFollowUpAt,
        priority: "高",
        stage: "联系人研究",
        completed: false,
        researchBatch: RESEARCH_BATCH,
      });
    });
    payload.importedResearchBatches = Array.from(new Set([...(payload.importedResearchBatches || []), RESEARCH_BATCH]));
    return newlyAdded.length;
  }

  function mergeOemChannelBatch(payload) {
    payload.appliedMigrations = payload.appliedMigrations || [];
    if (payload.appliedMigrations.includes(OEM_CHANNEL_BATCH)) return 0;
    const cleanUrl = (value = "") => String(value).toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
    const cleanName = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
    const existingByUrl = new Map((payload.clients || []).filter((client) => client.website).map((client) => [cleanUrl(client.website), client]));
    const existingByName = new Map((payload.clients || []).map((client) => [cleanName(client.company), client]));
    const now = new Date().toISOString();
    let added = 0;
    oemChannelSeed.forEach((item, index) => {
      const existing = existingByUrl.get(cleanUrl(item.website)) || existingByName.get(cleanName(item.company));
      const source = "原厂官方授权/合作目录｜核验日 2026-08-31";
      const verifiedEvidence = item.evidence + " 原厂目录只证明渠道关系，不证明当前持有指定PN、数量或现货。";
      if (existing) {
        const evidenceText = String(existing.verifiedEvidence || "");
        if (!evidenceText.includes(item.evidence)) existing.verifiedEvidence = [evidenceText, verifiedEvidence].filter(Boolean).join("；");
        if (!existing.commercialHypothesis) existing.commercialHypothesis = item.hypothesis;
        if (!existing.email && item.email) existing.email = item.email;
        if (!existing.linkedin && item.linkedin) existing.linkedin = item.linkedin;
        existing.source = existing.source || source;
        existing.updatedAt = now;
        return;
      }
      const id = uid();
      const client = {
        id,
        company: item.company,
        website: item.website,
        country: item.country,
        businessRole: item.direction === "Buy-from" ? "供应商" : "双向合作",
        products: item.products,
        source,
        contactName: "",
        jobTitle: item.role,
        email: item.email || "",
        whatsapp: "",
        linkedin: item.linkedin || "",
        progressTags: [],
        status: "已确认目标（待找联系人）",
        trustScore: item.score,
        followUpStage: "联系人研究",
        lastTouchAt: "",
        nextFollowUpAt: ["A1", "A2"].includes(item.priority) ? isoOffset(index < 4 ? 1 : 3, 10) : "",
        nextAction: `找到${item.role}，先核验产品线/库存能力，再决定是否发送具体PN询盘`,
        notes: `OEM渠道批次 ${OEM_CHANNEL_BATCH}｜优先级 ${item.priority}｜尚未触达`,
        accountGrade: item.accountGrade,
        direction: item.direction,
        accountType: item.accountType,
        commercialHypothesis: item.hypothesis,
        verifiedEvidence,
        owner: "Jenna",
        researchBatch: OEM_CHANNEL_BATCH,
        createdAt: now,
        updatedAt: now,
      };
      payload.clients.push(client);
      existingByUrl.set(cleanUrl(client.website), client);
      existingByName.set(cleanName(client.company), client);
      if (["A1", "A2"].includes(item.priority)) {
        payload.tasks.push({
          id: uid(),
          clientId: id,
          title: client.nextAction,
          dueAt: client.nextFollowUpAt,
          priority: "高",
          stage: "联系人研究",
          completed: false,
          researchBatch: OEM_CHANNEL_BATCH,
        });
      }
      added += 1;
    });
    payload.appliedMigrations.push(OEM_CHANNEL_BATCH);
    return added;
  }

  function mergeNicheCountryBatch(payload) {
    payload.appliedMigrations = payload.appliedMigrations || [];
    if (payload.appliedMigrations.includes(NICHE_COUNTRY_BATCH)) return 0;
    const cleanUrl = (value = "") => String(value).toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
    const cleanName = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
    const existingByUrl = new Map((payload.clients || []).filter((client) => client.website).map((client) => [cleanUrl(client.website), client]));
    const existingByName = new Map((payload.clients || []).map((client) => [cleanName(client.company), client]));
    const now = new Date().toISOString();
    let added = 0;

    nicheCountrySeed.forEach((item, index) => {
      const existing = existingByUrl.get(cleanUrl(item.website)) || existingByName.get(cleanName(item.company));
      const verifiedEvidence = `${item.evidence} Verification date: 2026-09-02. Public-company evidence does not prove current ownership of a specified PN or physical stock.`;
      if (existing) {
        const evidenceText = String(existing.verifiedEvidence || "");
        if (!evidenceText.includes("Verification date: 2026-09-02")) existing.verifiedEvidence = [evidenceText, verifiedEvidence].filter(Boolean).join("；");
        if (!existing.commercialHypothesis) existing.commercialHypothesis = item.hypothesis;
        if (!existing.email && item.email) existing.email = item.email;
        if (!existing.jobTitle) existing.jobTitle = item.role;
        existing.updatedAt = now;
        return;
      }

      const id = uid();
      const nextFollowUpAt = ["A1", "A2"].includes(item.priority) ? isoOffset(index < 4 ? 0 : 1, 10 + (index % 3), index % 2 ? 30 : 0) : "";
      const nextAction = ["A1", "A2"].includes(item.priority)
        ? "定位采购/供应链负责人；询问全新 Samsung DDR5 128GB 5600/6400 RDIMM（总需求 15,000pcs，可接受部分数量），并确认 PN、数量、价格、交期和库存地"
        : "先确认是否自持高容量 DDR5 RDIMM 或项目释放库存；有真实供给后再索取 PN、数量、价格、货况和库存地";
      const client = {
        id,
        company: item.company,
        website: item.website,
        country: item.country,
        businessRole: item.direction === "Buy-from" ? "供应商" : "双向合作",
        products: item.products,
        source: "小众国家服务器/HPC专项研究｜官网及官方合作伙伴目录",
        contactName: "",
        jobTitle: item.role,
        email: item.email || "",
        whatsapp: "",
        linkedin: "",
        progressTags: [],
        status: "已确认目标（待找联系人）",
        trustScore: item.score,
        followUpStage: "联系人研究",
        lastTouchAt: "",
        nextFollowUpAt,
        nextAction,
        notes: `小众国家专项 ${NICHE_COUNTRY_BATCH}｜优先级 ${item.priority}｜尚未触达｜首轮用英文；不把官网产品能力当成现货。`,
        accountGrade: item.accountGrade,
        direction: item.direction,
        accountType: item.accountType,
        commercialHypothesis: item.hypothesis,
        verifiedEvidence,
        owner: "Jenna",
        researchBatch: NICHE_COUNTRY_BATCH,
        createdAt: now,
        updatedAt: now,
      };
      payload.clients.push(client);
      existingByUrl.set(cleanUrl(client.website), client);
      existingByName.set(cleanName(client.company), client);
      if (["A1", "A2"].includes(item.priority)) {
        payload.tasks.push({
          id: uid(),
          clientId: id,
          title: nextAction,
          dueAt: nextFollowUpAt,
          priority: "高",
          stage: "联系人研究",
          completed: false,
          researchBatch: NICHE_COUNTRY_BATCH,
        });
      }
      added += 1;
    });

    payload.appliedMigrations.push(NICHE_COUNTRY_BATCH);
    return added;
  }

  function normalizeData(payload) {
    payload.version = 5;
    payload.clients = (payload.clients || []).map((c) => ({
      ...c,
      status: oldStatusMap[c.status] || c.status || "待筛选",
      accountGrade: c.accountGrade || (Number(c.trustScore || 0) >= 85 ? "A" : Number(c.trustScore || 0) >= 65 ? "B" : "C"),
      direction: c.direction || (c.businessRole === "供应商" ? "Buy-from" : c.businessRole === "潜在买家" ? "Sell-to" : "Two-way"),
      accountType: c.accountType || "Other",
      commercialHypothesis: c.commercialHypothesis || c.notes || "",
      verifiedEvidence: c.verifiedEvidence || "",
      owner: "Jenna",
    }));
    payload.tasks = payload.tasks || [];
    payload.activities = payload.activities || [];
    payload.quotes = (payload.quotes || []).map((q) => ({
      ...q,
      opportunityDirection: q.opportunityDirection || "Buy-from",
      packaging: q.packaging || "待确认",
      ownership: q.ownership || "待确认",
      availability: q.availability || q.leadTime || "待确认",
      countryOfOrigin: q.countryOfOrigin || "待确认",
      evidence: q.evidence || "待确认",
      traceability: q.traceability || "待确认",
      warranty: q.warranty || "待确认",
      targetPrice: q.targetPrice || "",
      internalOwner: q.internalOwner || "Jenna",
    }));
    payload.clients.forEach((client) => {
      const tags = [...(client.progressTags || [])];
      if (client.status === "LinkedIn申请已发送（等待通过）") tags.push("linkedin_pending");
      if (client.status === "邮件已发送（等待回复）") tags.push("email_pending");
      if (client.status === "WhatsApp已发送（等待回复）") tags.push("whatsapp_pending");
      if (client.status === "多渠道已触达（等待回复）") {
        if (client.linkedin) tags.push("linkedin_pending");
        if (client.email) tags.push("email_pending");
        if (client.whatsapp) tags.push("whatsapp_pending");
      }
      const activities = payload.activities.filter((activity) => Number(activity.clientId) === Number(client.id));
      activities.forEach((activity) => {
        const channel = String(activity.channel || "").toLowerCase();
        const replied = activity.activityType === "客户回复";
        if (channel.includes("linkedin")) tags.push(replied ? "linkedin_replied" : "linkedin_pending");
        if (channel.includes("email")) tags.push(replied ? "email_replied" : "email_pending");
        if (channel.includes("whatsapp")) tags.push(replied ? "whatsapp_replied" : "whatsapp_pending");
      });
      if (client.status === "客户已回复" && !tags.some((tag) => progressToneMap[tag] === "reply")) {
        if (client.linkedin) tags.push("linkedin_replied");
        else if (client.email) tags.push("email_replied");
        else if (client.whatsapp) tags.push("whatsapp_replied");
      }
      if (client.status === "已向客户发送报价") tags.push("quote_sent");
      if (client.status === "已发现采购需求") tags.push("customer_buying");
      if (["已收到供应报价", "已确认库存机会"].includes(client.status)) tags.push("customer_selling");
      payload.quotes.filter((quote) => Number(quote.clientId) === Number(client.id)).forEach((quote) => {
        if (quote.opportunityDirection === "Sell-to") tags.push("customer_buying");
        else if (quote.opportunityDirection === "Buy-from") tags.push("customer_selling");
        else tags.push("customer_buying", "customer_selling");
      });
      client.progressTags = uniqueProgressTags(tags);
      if (client.progressTags.length) client.status = derivedStatus(client.progressTags, client.status);
    });
    mergeResearchBatch(payload);
    mergeOemChannelBatch(payload);
    payload.appliedMigrations = payload.appliedMigrations || [];
    if (!payload.appliedMigrations.includes(ALL_CLIENTS_TOUCHED_MIGRATION)) {
      payload.clients.forEach((client) => {
        const hasReplyOrOpportunity = uniqueProgressTags(client.progressTags).some((tag) =>
          ["reply", "opportunity"].includes(progressToneMap[tag]),
        );
        if (!hasReplyOrOpportunity && !["资料核验中", "价格评估中", "商务谈判中", "已成交", "已关闭"].includes(client.status)) {
          client.status = "多渠道已触达（等待回复）";
        }
      });
      payload.appliedMigrations.push(ALL_CLIENTS_TOUCHED_MIGRATION);
    }
    mergeNicheCountryBatch(payload);
    return payload;
  }

  function seedData() {
    const now = new Date().toISOString();
    const clients = [
      { id: 101, company: "ClusterVision", website: "https://clustervision.com", country: "Netherlands", businessRole: "潜在买家", products: "DDR5 RDIMM, GPU, HPC", source: "官网 / LinkedIn", contactName: "Procurement Team", jobTitle: "", email: "info@clustervision.com", whatsapp: "", linkedin: "", status: "已触达", trustScore: 88, followUpStage: "二次跟进", lastTouchAt: isoOffset(-3, 16, 10), nextFollowUpAt: isoOffset(0, 10, 30), nextAction: "确认是否采购 DDR5 RDIMM，并约 15 分钟沟通", notes: "HPC / AI 基础设施方向，匹配企业级内存和 GPU。", createdAt: isoOffset(-6), updatedAt: now },
      { id: 102, company: "Stortech", website: "https://stortech.ae", country: "UAE", businessRole: "供应商", products: "Enterprise SSD, Server Memory", source: "官网", contactName: "Anil Gupta", jobTitle: "Owner", email: "", whatsapp: "", linkedin: "", status: "已回复", trustScore: 72, followUpStage: "报价询盘", lastTouchAt: isoOffset(-1, 20, 15), nextFollowUpAt: isoOffset(0, 14), nextAction: "询问是否现货、Date Code、实物图片和最佳价格", notes: "已开始沟通，收到报价前先核验货况及公司实体。", createdAt: isoOffset(-5), updatedAt: now },
      { id: 103, company: "PMCO", website: "https://pmco.eu", country: "Lithuania", businessRole: "潜在买家", products: "DDR5 RDIMM, Enterprise SSD", source: "LinkedIn", contactName: "Mindaugas Seduikis", jobTitle: "", email: "", whatsapp: "", linkedin: "https://www.linkedin.com", status: "已触达", trustScore: 84, followUpStage: "三次跟进", lastTouchAt: isoOffset(-7, 11), nextFollowUpAt: isoOffset(1, 9, 30), nextAction: "基于 AI/HPC 项目发送更具体的库存合作问句", notes: "已通过 LinkedIn 连接，需避免模板化跟进。", createdAt: isoOffset(-8), updatedAt: now },
      { id: 104, company: "Settech Inc.", website: "https://settechinc.com", country: "United States", businessRole: "双向合作", products: "Server Components, SSD", source: "官网", contactName: "", jobTitle: "", email: "", whatsapp: "", linkedin: "", status: "新线索", trustScore: 64, followUpStage: "首次触达", lastTouchAt: "", nextFollowUpAt: isoOffset(2, 10), nextAction: "查找采购/供应链负责人并发送定制邮件", notes: "需要补全联系人、团队规模与地址核验。", createdAt: isoOffset(-3), updatedAt: now },
      { id: 105, company: "Wiwynn", website: "https://www.wiwynn.com", country: "Taiwan", businessRole: "潜在买家", products: "AI Server, Cloud Infrastructure, Rack Solutions", source: "官网 / LinkedIn", contactName: "", jobTitle: "", email: "", whatsapp: "", linkedin: "", status: "新线索", trustScore: 95, followUpStage: "联系人研究", lastTouchAt: "", nextFollowUpAt: isoOffset(3, 15), nextAction: "定位供应链、供应商注册或项目剩余库存合作联系人", notes: "大型云基础设施公司，匹配度高，触达应更精准。", createdAt: isoOffset(-2), updatedAt: now },
    ];
    return {
      version: 5,
      clients: clients.map((c) => ({
        ...c,
        status: oldStatusMap[c.status] || c.status,
        accountGrade: c.trustScore >= 85 ? "A" : c.trustScore >= 65 ? "B" : "C",
        direction: c.businessRole === "供应商" ? "Buy-from" : c.businessRole === "潜在买家" ? "Sell-to" : "Two-way",
        accountType: c.company === "ClusterVision" ? "HPC / AI Infrastructure" : c.company === "Stortech" ? "Distributor" : "SI",
        commercialHypothesis: c.notes,
        verifiedEvidence: "待补充官网、官方目录或库存证据链接",
        owner: "Jenna",
      })),
      tasks: [
        { id: 201, clientId: 101, title: "发送二次跟进：确认 DDR5 RDIMM 需求", dueAt: isoOffset(0, 10, 30), priority: "高", stage: "二次跟进", completed: false },
        { id: 202, clientId: 102, title: "询问库存、货况、Date Code 与最佳价格", dueAt: isoOffset(0, 14), priority: "高", stage: "报价询盘", completed: false },
        { id: 203, clientId: 103, title: "发送第三次定制化跟进", dueAt: isoOffset(1, 9, 30), priority: "普通", stage: "三次跟进", completed: false },
        { id: 204, clientId: 104, title: "补全采购联系人与邮箱", dueAt: isoOffset(2, 10), priority: "普通", stage: "联系人研究", completed: false },
      ],
      activities: [
        { id: 301, clientId: 101, channel: "Email", activityType: "首次触达", stage: "首次触达", summary: "已发送企业级内存与 GPU 供应合作介绍。", nextAction: "确认当前采购方向", occurredAt: isoOffset(-3, 16, 10), nextDueAt: isoOffset(0, 10, 30) },
        { id: 302, clientId: 102, channel: "WhatsApp", activityType: "客户回复", stage: "报价询盘", summary: "对方表示可以提供企业级 SSD 报价，等待具体库存信息。", nextAction: "索取实物图、Date Code 和贸易条款", occurredAt: isoOffset(-1, 20, 15), nextDueAt: isoOffset(0, 14) },
      ],
      quotes: [
        { id: 401, clientId: 102, partNumber: "MZWLJ3T8HBLS-00007", category: "Enterprise SSD", brand: "Samsung", description: "3.84TB NVMe U.2", quantity: 40, unitPrice: "410", currency: "USD", condition: "Factory Sealed", dateCode: "待确认", stockLocation: "Dubai", leadTime: "2–3 days", incoterm: "EXW", quoteStatus: "价格偏高", createdAt: now },
      ],
    };
  }

  function bytesToBase64(bytes) {
    let binary = "";
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }
  function base64ToBytes(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  }
  async function deriveKey(password, salt) {
    const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 180000, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }
  async function encryptPayload(payload, key, salt) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(payload)));
    return { format: "ecore-crm-encrypted", version: 1, salt: bytesToBase64(salt), iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(ciphertext)), updatedAt: new Date().toISOString() };
  }
  async function decryptPayload(record, key) {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(record.iv) }, key, base64ToBytes(record.data));
    return JSON.parse(decoder.decode(plain));
  }
  async function saveData() {
    if (!cryptoKey || !data) return;
    const old = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const salt = old.salt ? base64ToBytes(old.salt) : crypto.getRandomValues(new Uint8Array(16));
    const encrypted = await encryptPayload(data, cryptoKey, salt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
  }
  async function transact(mutator, message) {
    mutator(data);
    await saveData();
    render();
    toast(message);
  }

  function renderAuth(mode = "login", error = "") {
    const setup = mode === "setup";
    app.innerHTML = `
      <main class="auth-shell">
        <section class="auth-panel">
          <div class="auth-brand"><span>ecore</span><small>CRM</small></div>
          <div class="auth-kicker">${setup ? "首次使用 · 创建本机密码" : "安全访问"}</div>
          <h1>${setup ? "建立你的客户工作台" : "欢迎回来，Jenna"}</h1>
          <p class="auth-copy">${setup
            ? "设置一个至少 6 位的访问密码。客户、报价和跟进数据会加密后保存在当前浏览器，不会上传到 GitHub。"
            : "输入你首次设置的密码，解锁保存在这台设备上的客户、报价和跟进数据。"}</p>
          <form class="auth-form" id="auth-form">
            <label for="auth-password">${setup ? "创建访问密码" : "访问密码"}</label>
            <div class="auth-input-row">
              <input id="auth-password" name="password" type="password" minlength="6" autocomplete="${setup ? "new-password" : "current-password"}" required placeholder="${setup ? "至少 6 位，请务必记住" : "请输入密码"}" />
              <button type="submit">${setup ? "创建并进入" : "解锁 CRM"}</button>
            </div>
            <p class="auth-error">${escapeHtml(error)}</p>
          </form>
          <div class="auth-note"><b>✓</b><span>GitHub Pages 只存放网页程序，不存放你的客户数据。请定期进入系统下载加密备份。</span></div>
          ${setup ? "" : `<button class="subtle-button" id="import-auth" style="margin-top:16px;padding:0 14px;">从加密备份恢复</button>`}
        </section>
        <aside class="auth-art"><span class="orb one"></span><span class="orb two"></span><p>专注芯片分销<br />连接全球机会</p></aside>
      </main>`;
    document.getElementById("auth-form").addEventListener("submit", (event) => handleAuth(event, setup));
    document.getElementById("import-auth")?.addEventListener("click", () => backupFile.click());
    setTimeout(() => document.getElementById("auth-password")?.focus(), 0);
  }

  async function handleAuth(event, setup) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password").toString();
    if (password.length < 6) return renderAuth(setup ? "setup" : "login", "密码至少需要 6 位");
    app.innerHTML = `<div class="loading-screen">正在安全解锁…</div>`;
    try {
      if (setup) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        cryptoKey = await deriveKey(password, salt);
        data = normalizeData(seedData());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(await encryptPayload(data, cryptoKey, salt)));
      } else {
        const record = JSON.parse(localStorage.getItem(STORAGE_KEY));
        cryptoKey = await deriveKey(password, base64ToBytes(record.salt));
        data = normalizeData(await decryptPayload(record, cryptoKey));
        await saveData();
      }
      sessionStorage.setItem(SESSION_KEY, password);
      render();
      const overdue = openTasks().filter((task) => new Date(task.dueAt) < new Date()).length;
      if (overdue) toast(`有 ${overdue} 个跟进任务已到期，请优先处理`);
    } catch {
      cryptoKey = null;
      data = null;
      sessionStorage.removeItem(SESSION_KEY);
      renderAuth("login", "密码不正确，或本地数据已损坏");
    }
  }

  function logout() {
    cryptoKey = null;
    data = null;
    sessionStorage.removeItem(SESSION_KEY);
    renderAuth(localStorage.getItem(STORAGE_KEY) ? "login" : "setup");
  }

  function openTasks() {
    return data.tasks.filter((task) => !task.completed);
  }
  function stats() {
    const now = new Date();
    const today = dateKey(now);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const open = openTasks();
    return {
      today: open.filter((t) => dateKey(t.dueAt) === today).length,
      overdue: open.filter((t) => new Date(t.dueAt) < now && dateKey(t.dueAt) !== today).length,
      newWeek: data.clients.filter((c) => new Date(c.createdAt) >= weekAgo).length,
      discovered: data.clients.filter((c) => accountProgressState(c) === "opportunity" || ["资料核验中", "价格评估中", "商务谈判中", "已成交"].includes(c.status)).length,
      ready: data.clients.filter((c) => ["资料核验中", "价格评估中", "商务谈判中", "已成交"].includes(c.status)).length,
      waitingInternal: data.quotes.filter((q) => ["待内部价格", "待内部技术判断", "待内部合规判断"].includes(q.quoteStatus)).length,
      incompleteStock: data.quotes.filter((q) => quoteCompleteness(q).score < 80).length,
    };
  }
  function hasValue(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return Boolean(normalized && !["待确认", "pending", "unknown", "n/a", "na", "-"].includes(normalized));
  }
  function quoteCompleteness(q) {
    const checks = [
      ["Exact PN", q.partNumber], ["数量", q.quantity], ["Condition", q.condition], ["包装/封签", q.packaging],
      ["库存地点", q.stockLocation], ["货权", q.ownership], ["可用时间", q.availability], ["价格", q.unitPrice],
      ["Date Code", q.dateCode], ["COO", q.countryOfOrigin], ["图片/视频", q.evidence], ["可追溯性", q.traceability],
      ["Warranty/RMA", q.warranty], ["交期", q.leadTime], ["Incoterm", q.incoterm],
    ];
    const complete = checks.filter(([, value]) => hasValue(value)).length;
    return { score: Math.round((complete / checks.length) * 100), missing: checks.filter(([, value]) => !hasValue(value)).map(([label]) => label) };
  }
  function renderNav() {
    const counts = { tasks: openTasks().length, clients: data.clients.length, pipeline: data.clients.filter((c) => accountProgressState(c) === "opportunity" || ["资料核验中", "价格评估中", "商务谈判中"].includes(c.status)).length };
    return `
      <aside class="sidebar">
        <div class="brand"><span>ecore</span><small>CRM</small></div>
        <nav class="nav">${navItems.map(([id, icon, label]) => `
          <button class="nav-item ${view === id ? "active" : ""}" data-view="${id}">
            <span class="icon">${icon}</span><span>${label}</span>${counts[id] ? `<b class="badge">${counts[id]}</b>` : ""}
          </button>`).join("")}</nav>
        <div class="sidebar-tools">
          <button class="subtle-button" id="download-backup">下载加密备份</button>
          <button class="subtle-button" id="restore-backup">恢复备份</button>
          <button class="subtle-button" id="logout">锁定 CRM</button>
        </div>
        <div class="sidebar-art"><span></span><b></b></div>
      </aside>`;
  }
  function top(title, eyebrow, actions = true) {
    return `<header class="section-header"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1></div>
      ${actions ? `<div class="top-actions"><button class="secondary" data-action="activity">＋ 记录沟通</button><button class="primary" data-action="client">＋ 录入新客户</button></div>` : ""}
    </header>`;
  }
  function renderDashboard() {
    const s = stats();
    const priority = [...openTasks()].sort((a, b) => (a.priority === "高" ? -1 : 1) - (b.priority === "高" ? -1 : 1) || new Date(a.dueAt) - new Date(b.dueAt)).slice(0, 6);
    const progress = [
      ["⌕", "已确认目标", data.clients.filter((c) => c.status === "已确认目标（待找联系人）").length],
      ["➤", "已发送待回复", data.clients.filter((c) => accountProgressState(c) === "outreach").length],
      ["●", "客户已回复", data.clients.filter((c) => accountProgressState(c) === "reply").length],
      ["▤", "报价 / 采购 / 销售机会", data.clients.filter((c) => accountProgressState(c) === "opportunity").length],
    ];
    const queues = [
      ["等待内部判断", s.waitingInternal, "quotes", "需要价格、技术或合规结论"],
      ["库存资料不完整", s.incompleteStock, "quotes", "完整度低于 80%"],
      ["已发现机会", s.discovered, "pipeline", "已有真实需求或库存"],
    ];
    return `
      <header class="topbar"><div><p class="eyebrow">${new Intl.DateTimeFormat("zh-CN", { dateStyle: "full", timeZone: "Asia/Singapore" }).format(new Date())}</p><h1>今日业务控制台</h1><p class="header-note">先处理超期、内部卡点和资料缺口，再继续开发新名单。</p></div>
        <div class="top-actions"><div class="search-box"><input id="global-search" placeholder="搜索公司、联系人、料号…" /></div><button class="primary" data-action="client">＋ 录入新客户</button></div>
      </header>
      <section class="metrics">
        <article class="metric"><div><label>今日待跟进</label><strong>${s.today}</strong></div><span class="metric-icon">◷</span></article>
        <article class="metric danger"><div><label>超期任务</label><strong>${s.overdue}</strong></div><span class="metric-icon">!</span></article>
        <article class="metric"><div><label>已发现机会</label><strong>${s.discovered}</strong></div><span class="metric-icon">↗</span></article>
        <article class="metric"><div><label>进入核验/评估</label><strong>${s.ready}</strong></div><span class="metric-icon">✓</span></article>
      </section>
      <section class="dashboard-grid">
        <div>
          <article class="panel">
            <div class="panel-title"><h2>行动队列</h2><small>按优先级和到期时间排序</small></div>
            ${priority.length ? `<div class="priority-list">${priority.map((task) => {
              const client = clientById(task.clientId);
              return `<button class="priority-row" data-client="${task.clientId}"><strong>${escapeHtml(client?.company || "未知客户")}</strong><span>${gradePill(client?.accountGrade)} ${escapeHtml(directionLabel(client?.direction))}</span><span>${escapeHtml(task.title)}</span><time>${fmt(task.dueAt)}</time></button>`;
            }).join("")}</div>` : `<div class="empty">没有待处理任务</div>`}
          </article>
          <article class="quick-card">
            <h3>网址快速建档</h3><p>粘贴公司官网，先自动提取域名与公司名，再补充背调信息。</p>
            <div class="quick-row"><input id="quick-url" placeholder="例如：https://company.com" /><button class="secondary" id="analyze-url">提取并建档</button></div>
          </article>
        </div>
        <div>
          <article class="panel">
            <div class="panel-title"><h2>机会漏斗</h2><button class="text-link" data-view="pipeline">查看全部</button></div>
            <div class="progress-list">${progress.map(([icon, label, count]) => `<div class="progress-row"><span class="progress-icon">${icon}</span><span>${label}</span><b>${count}</b></div>`).join("")}</div>
          </article>
          <article class="panel queue-panel"><div class="panel-title"><h2>管理队列</h2></div>${queues.map(([label, count, target, note]) => `<button class="queue-row" data-view="${target}"><span><strong>${label}</strong><small>${note}</small></span><b>${count}</b></button>`).join("")}</article>
        </div>
      </section>`;
  }
  function renderClients() {
    const keyword = clientSearch.toLowerCase();
    const rows = data.clients.filter((c) => {
      const text = [c.company, c.country, c.products, c.contactName, c.email, c.accountType, c.commercialHypothesis].join(" ").toLowerCase();
      return text.includes(keyword)
        && (clientStatus === "全部" || c.status === clientStatus || (c.progressTags || []).includes(clientStatus))
        && (clientGrade === "全部" || c.accountGrade === clientGrade)
        && (clientDirection === "全部" || c.direction === clientDirection);
    });
    return `${top("账户库", "账户分级、沟通进展与下一步动作")}
      <div class="progress-legend" aria-label="客户颜色说明">
        <span><i class="legend-outreach"></i>浅黄色：已发送，等待通过 / 回复</span>
        <span><i class="legend-reply"></i>浅粉色：客户已回复</span>
        <span><i class="legend-opportunity"></i>红色：报价 / 采购 / 销售机会</span>
      </div>
      <div class="toolbar"><input id="client-search" class="grow" value="${escapeHtml(clientSearch)}" placeholder="搜索公司、国家、产品、联系人或邮箱" />
        <select id="client-grade"><option>全部</option>${accountGrades.map((g) => `<option ${g === clientGrade ? "selected" : ""}>${g}</option>`).join("")}</select>
        <select id="client-direction"><option>全部</option>${directions.map((d) => `<option ${d === clientDirection ? "selected" : ""}>${d}</option>`).join("")}</select>
        <select id="client-status"><option>全部</option><optgroup label="触达与回复">${progressOptions.map((option) => `<option value="${option.value}" ${option.value === clientStatus ? "selected" : ""}>${option.label}</option>`).join("")}</optgroup><optgroup label="后续阶段">${["待筛选", "已确认目标（待找联系人）", "资料核验中", "价格评估中", "商务谈判中", "已成交", "培育", "已关闭"].map((s) => `<option ${s === clientStatus ? "selected" : ""}>${s}</option>`).join("")}</optgroup></select>
      </div>
      <div class="table-wrap account-table"><table><thead><tr><th>账户</th><th>等级 / 类型</th><th>业务方向</th><th>联系人 / 渠道</th><th>具体机会阶段</th><th>最近沟通</th><th>下次跟进</th><th>下一步</th></tr></thead>
      <tbody>${rows.map((c) => {
        const latest = latestClientActivity(c.id);
        const activityCount = clientActivities(c.id).length;
        return `<tr class="clickable account-progress-${accountProgressState(c)}" data-client="${c.id}"><td><div class="company-cell"><strong>${escapeHtml(c.company)}</strong><small>${escapeHtml(c.country || "待补充")} · ${escapeHtml(c.website)}</small></div></td><td>${gradePill(c.accountGrade)}<br><small>${escapeHtml(c.accountType)}</small></td><td><strong>${escapeHtml(directionLabel(c.direction))}</strong><br><small>${escapeHtml(c.products || "待补充")}</small></td><td><div class="contact-cell">${contactSummary(c)}</div></td><td>${progressPills(c)}</td><td>${activitySummary(latest, activityCount)}</td><td>${fmt(c.nextFollowUpAt)}</td><td class="next-action-cell">${escapeHtml(c.nextAction || "未设置")}</td></tr>`;
      }).join("")}</tbody></table>
      ${rows.length ? "" : `<div class="empty">没有符合条件的客户</div>`}</div>`;
  }
  function renderPipeline() {
    const activeStages = statuses.filter((s) => !["培育", "已关闭"].includes(s));
    return `${top("机会漏斗", "回复不等于机会：按证据推进阶段")}
      <section class="pipeline-board">${activeStages.map((stage) => {
        const items = data.clients.filter((c) => c.status === stage);
        return `<div class="pipeline-column"><div class="column-title"><h2>${stage}</h2><b>${items.length}</b></div><div class="pipeline-list">${items.length ? items.map((c) => `<button class="pipeline-card" data-client="${c.id}"><div>${gradePill(c.accountGrade)}<small>${escapeHtml(c.accountType)}</small></div><strong>${escapeHtml(c.company)}</strong><p>${escapeHtml(directionLabel(c.direction))}</p><span>${escapeHtml(c.nextAction || "尚未设置下一步")}</span><time>${fmt(c.nextFollowUpAt)}</time></button>`).join("") : `<div class="empty compact">暂无</div>`}</div></div>`;
      }).join("")}</section>`;
  }
  function renderTasks() {
    const columns = [["今日", (t) => !t.completed && dateKey(t.dueAt) === dateKey(new Date())], ["未来", (t) => !t.completed && new Date(t.dueAt) > new Date() && dateKey(t.dueAt) !== dateKey(new Date())], ["超期", (t) => !t.completed && new Date(t.dueAt) < new Date() && dateKey(t.dueAt) !== dateKey(new Date())], ["已完成", (t) => t.completed]];
    return `${top("跟进任务", "二次、三次、四次跟进节奏")}
      <section class="task-board">${columns.map(([name, test]) => {
        const items = data.tasks.filter(test).sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
        return `<div class="task-column"><div class="column-title"><h2>${name}</h2><b>${items.length}</b></div><div class="task-list">${items.length ? items.map((t) => {
          const client = clientById(t.clientId);
          return `<article class="task-card ${t.completed ? "done" : ""}"><div class="task-card-head"><button class="task-check" data-task="${t.id}">${t.completed ? "✓" : ""}</button><span class="priority ${t.priority === "高" ? "high" : ""}">${t.priority}</span></div><button class="task-client" style="border:0;background:none;padding:0;cursor:pointer" data-client="${t.clientId}">${escapeHtml(client?.company || "未知客户")}</button><p>${escapeHtml(t.title)}</p><time>${fmt(t.dueAt)} · ${escapeHtml(t.stage)}</time></article>`;
        }).join("") : `<div class="empty" style="padding:25px 4px">暂无任务</div>`}</div></div>`;
      }).join("")}</section>`;
  }
  function renderActivities() {
    const items = [...data.activities].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
    return `${top("触达记录", "Email · WhatsApp · LinkedIn · 电话")}
      <section class="timeline">${items.length ? items.map((a) => {
        const client = clientById(a.clientId);
        return `<article class="timeline-item"><div><span class="timeline-dot">${escapeHtml(a.channel.slice(0, 2))}</span><i class="timeline-line"></i></div><div class="timeline-content"><div class="timeline-top"><strong>${escapeHtml(client?.company || "未知客户")}</strong><span>${escapeHtml(a.channel)} · ${escapeHtml(a.activityType)}</span><time>${fmt(a.occurredAt)}</time></div><p>${escapeHtml(a.summary)}</p><div class="next-step"><b>下一步：</b>${escapeHtml(a.nextAction || "待安排")} ${a.nextDueAt ? `· ${fmt(a.nextDueAt)}` : ""}</div></div></article>`;
      }).join("") : `<div class="empty">还没有触达记录</div>`}</section>`;
  }
  function renderQuotes() {
    return `${top("库存与机会核验", "Exact PN、货权、包装、证据与商务判断")}
      <div class="verification-guide"><b>进入“资料核验中”的最低标准</b><span>Exact PN · Qty · Condition · Packaging · Location · Ownership · Availability · Price · D/C · COO · Evidence · Traceability · Warranty · Lead time · Incoterm</span></div>
      <div class="table-wrap"><table><thead><tr><th>公司 / 方向</th><th>料号</th><th>产品</th><th>数量 / 价格</th><th>货况 / 包装</th><th>货权 / 地点</th><th>证据完整度</th><th>评估状态</th></tr></thead>
      <tbody>${data.quotes.map((q) => { const c = clientById(q.clientId); const quality = quoteCompleteness(q); return `<tr class="clickable" data-client="${q.clientId}"><td><strong>${escapeHtml(c?.company || "未知客户")}</strong><br><small>${escapeHtml(directionLabel(q.opportunityDirection))}</small></td><td><strong>${escapeHtml(q.partNumber)}</strong><br><small>${escapeHtml(q.dateCode || "D/C待确认")} · ${escapeHtml(q.countryOfOrigin || "COO待确认")}</small></td><td>${escapeHtml(q.category)} · ${escapeHtml(q.brand)}<br><small>${escapeHtml(q.description)}</small></td><td>${q.quantity || "待确认"} pcs<br><strong>${escapeHtml(q.currency)} ${escapeHtml(q.unitPrice || "待确认")}</strong></td><td>${escapeHtml(q.condition || "待确认")}<br><small>${escapeHtml(q.packaging || "包装待确认")}</small></td><td>${escapeHtml(q.ownership || "待确认")}<br><small>${escapeHtml(q.stockLocation || "地点待确认")}</small></td><td><div class="completion"><b>${quality.score}%</b><i style="--progress:${quality.score}%"></i><small>${quality.missing.length ? `缺：${escapeHtml(quality.missing.slice(0, 3).join("、"))}${quality.missing.length > 3 ? "…" : ""}` : "资料完整"}</small></div></td><td>${escapeHtml(q.quoteStatus || "待评估")}</td></tr>`; }).join("")}</tbody></table>
      ${data.quotes.length ? "" : `<div class="empty">还没有报价记录</div>`}</div>`;
  }
  function reportText() {
    const s = stats();
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const weeklyActivities = data.activities.filter((a) => new Date(a.occurredAt) >= weekAgo);
    const weeklyQuotes = data.quotes.filter((q) => new Date(q.createdAt) >= weekAgo);
    const open = openTasks();
    const focus = [...open].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)).slice(0, 5);
    const incomplete = data.quotes.filter((q) => quoteCompleteness(q).score < 80);
    return `ecore 海外采购与业务开发周报\n\n一、有效业务进展\n- 新增合格账户：${s.newWeek} 家\n- 新增有效触达：${weeklyActivities.length} 次\n- 已发现需求/库存机会：${s.discovered} 家\n- 进入核验/评估阶段：${s.ready} 家\n- 新增库存/需求记录：${weeklyQuotes.length} 条\n- 开放任务：${open.length} 个，其中超期 ${s.overdue} 个\n\n二、重点机会与下一步\n${focus.length ? focus.map((t, i) => { const c = clientById(t.clientId); return `${i + 1}. ${c?.company || "未知客户"}｜${c?.accountGrade || "C"}级｜${directionLabel(c?.direction)}：${t.title}（${fmt(t.dueAt)}）`; }).join("\n") : "- 暂无开放任务"}\n\n三、内部卡点\n- 等待内部价格/技术/合规判断：${s.waitingInternal} 条\n- 库存资料完整度低于80%：${incomplete.length} 条\n- 重点补齐：Exact PN、Qty、Condition、Packaging、Location、Ownership、Availability、Price、D/C、COO、Evidence、Traceability、Warranty。\n\n四、下周动作\n- 优先推进A类账户及已发现真实机会，不以礼貌回复代替机会。\n- 采购端聚焦全新/未使用、可追溯的DDR4/DDR5 RDIMM与Enterprise SSD。\n- 每个开放账户必须有明确下一步和日期；无下一步日期不进入活跃管道。`;
  }
  function renderReport() {
    const s = stats();
    return `${top("老板汇报", "一键汇总本周开发进度", false)}
      <section class="report-grid"><article class="panel"><div class="panel-title"><h2>本周汇报草稿</h2><button class="secondary" id="copy-report">复制汇报</button></div><div class="report-copy">${escapeHtml(reportText())}</div></article>
      <aside class="panel"><div class="panel-title"><h2>核心指标</h2></div><div class="kpi-list">
        <div class="kpi-item"><span>账户总数</span><strong>${data.clients.length}</strong></div>
        <div class="kpi-item"><span>开放任务</span><strong>${openTasks().length}</strong></div>
        <div class="kpi-item"><span>已发现机会</span><strong>${s.discovered}</strong></div>
        <div class="kpi-item"><span>进入核验 / 评估</span><strong>${s.ready}</strong></div>
        <div class="kpi-item"><span>超期任务</span><strong>${s.overdue}</strong></div>
      </div></aside></section>`;
  }

  function renderDrawer() {
    const c = clientById(selectedClientId);
    if (!c) return "";
    const activities = data.activities.filter((a) => a.clientId === c.id).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
    const quotes = data.quotes.filter((q) => q.clientId === c.id);
    const detail = (label, value, wide = false) => `<div class="detail-card ${wide ? "detail-wide" : ""}"><label>${label}</label><p>${value || "待补充"}</p></div>`;
    return `<div class="drawer-backdrop" id="drawer-backdrop"></div><aside class="drawer">
      <div class="drawer-head"><div><p>${escapeHtml(c.country)} · ${escapeHtml(c.accountType)} · ${escapeHtml(directionLabel(c.direction))}</p><h2>${escapeHtml(c.company)}</h2><div class="drawer-badges">${gradePill(c.accountGrade)} ${progressPills(c)} ${trustPill(c.trustScore)}</div></div><button class="icon-button" id="close-drawer">×</button></div>
      <div class="drawer-actions"><button class="primary" data-action="activity" data-client-id="${c.id}">＋ 记录沟通</button><button class="secondary" data-action="quote" data-client-id="${c.id}">＋ 添加库存/需求</button><button class="secondary" data-action="edit-client" data-client-id="${c.id}">编辑账户</button></div>
      <div class="detail-grid">
        ${detail("官网", c.website ? `<a href="${escapeHtml(c.website)}" target="_blank" rel="noopener">${escapeHtml(c.website)}</a>` : "")}
        ${detail("产品方向", escapeHtml(c.products))}
        ${detail("联系人", escapeHtml([c.contactName, c.jobTitle].filter(Boolean).join(" · ")))}
        ${detail("LinkedIn / WhatsApp / Email", escapeHtml([c.linkedin, c.whatsapp, c.email].filter(Boolean).join(" · ")))}
        ${detail("触达 / 回复 / 业务机会", progressPills(c), true)}
        ${detail("下次跟进", fmt(c.nextFollowUpAt))}
        ${detail("下一步动作", escapeHtml(c.nextAction), true)}
        ${detail("商业假设", escapeHtml(c.commercialHypothesis), true)}
        ${detail("已核验证据", escapeHtml(c.verifiedEvidence), true)}
        ${detail("背调与沟通备注", escapeHtml(c.notes), true)}
      </div>
      <section class="drawer-section"><h3>近期触达</h3><div class="mini-list">${activities.length ? activities.slice(0, 5).map((a) => `<div class="mini-item"><strong>${escapeHtml(a.channel)} · ${fmt(a.occurredAt)}</strong>${escapeHtml(a.summary)}</div>`).join("") : `<div class="mini-item">暂无记录</div>`}</div></section>
      <section class="drawer-section"><h3>库存与需求</h3><div class="mini-list">${quotes.length ? quotes.map((q) => { const quality = quoteCompleteness(q); return `<div class="mini-item"><strong>${escapeHtml(q.partNumber)} · ${escapeHtml(q.currency)} ${escapeHtml(q.unitPrice || "待确认")}</strong>${escapeHtml(q.brand)} ${escapeHtml(q.description)} · ${q.quantity || "?"} pcs · ${escapeHtml(q.condition)} · 资料完整度 ${quality.score}%</div>`; }).join("") : `<div class="mini-item">暂无记录</div>`}</div></section>
    </aside>`;
  }
  function clientOptions(selected = "") {
    return data.clients.map((c) => `<option value="${c.id}" ${Number(selected) === c.id ? "selected" : ""}>${escapeHtml(c.company)}</option>`).join("");
  }
  function renderModal() {
    if (!modal) return "";
    if (["client", "edit-client"].includes(modal.type)) {
      const existing = modal.type === "edit-client" ? clientById(modal.clientId) : null;
      const val = (key, fallback = "") => escapeHtml(existing?.[key] ?? fallback);
      const selected = (value, current) => value === current ? "selected" : "";
      return `<div class="modal-backdrop"><form class="modal" id="client-form"><input type="hidden" name="clientId" value="${existing?.id || ""}" /><div class="modal-head"><h2>${existing ? "编辑账户" : "录入新账户"}</h2><button type="button" class="icon-button" data-close-modal>×</button></div>
        <div class="form-grid">
          <div class="field"><label>公司名称 *</label><input name="company" required value="${val("company", quickDraft.company)}" /></div>
          <div class="field"><label>公司官网</label><input name="website" value="${val("website", quickDraft.website)}" placeholder="https://..." /></div>
          <div class="field"><label>国家 / 地区</label><input name="country" value="${val("country")}" /></div>
          <div class="field"><label>账户等级 *</label><select name="accountGrade">${accountGrades.map((g) => `<option ${selected(g, existing?.accountGrade || "B")}>${g}</option>`).join("")}</select></div>
          <div class="field"><label>公司类型</label><select name="accountType">${accountTypes.map((t) => `<option ${selected(t, existing?.accountType || "SI")}>${t}</option>`).join("")}</select></div>
          <div class="field"><label>业务方向</label><select name="direction">${directions.map((d) => `<option ${selected(d, existing?.direction || "Buy-from")}>${d}</option>`).join("")}</select></div>
          <input type="hidden" name="status" value="${val("status", "已确认目标（待找联系人）")}" />
          <div class="field wide"><label>触达 / 回复 / 业务机会（可多选）</label>${progressSelector(existing?.progressTags || [])}</div>
          <div class="field wide"><label>主营与匹配产品</label><input name="products" value="${val("products")}" placeholder="DDR5 RDIMM, Enterprise SSD…" /></div>
          <div class="field"><label>联系人</label><input name="contactName" value="${val("contactName")}" /></div>
          <div class="field"><label>职位</label><input name="jobTitle" value="${val("jobTitle")}" /></div>
          <div class="field"><label>Email</label><input name="email" type="email" value="${val("email")}" /></div>
          <div class="field"><label>WhatsApp</label><input name="whatsapp" value="${val("whatsapp")}" /></div>
          <div class="field"><label>LinkedIn</label><input name="linkedin" value="${val("linkedin")}" placeholder="个人主页链接" /></div>
          <div class="field"><label>线索来源</label><select name="source">${["官网", "LinkedIn", "展会清单", "合作伙伴目录", "转介绍", "行业目录", "WhatsApp"].map((x) => `<option ${selected(x, existing?.source || "官网")}>${x}</option>`).join("")}</select></div>
          <div class="field"><label>可信度评分</label><input name="trustScore" type="number" min="0" max="100" value="${val("trustScore", "60")}" /></div>
          <div class="field"><label>下次跟进时间 *</label><input name="nextFollowUpAt" type="datetime-local" required value="${existing?.nextFollowUpAt ? localDateTime(existing.nextFollowUpAt) : localInput(3, 10)}" /></div>
          <div class="field wide"><label>下一步动作 *</label><input name="nextAction" required value="${val("nextAction", "核验公司与正确联系人")}" /></div>
          <div class="field wide"><label>商业假设：为什么可能有库存/需求？</label><textarea name="commercialHypothesis" placeholder="项目取消、BOM变更、备件释放、配置调整等，仅写有依据的假设">${val("commercialHypothesis")}</textarea></div>
          <div class="field wide"><label>已核验证据</label><textarea name="verifiedEvidence" placeholder="官网页面、官方合作伙伴目录、展会、公司注册、库存图片等">${val("verifiedEvidence")}</textarea></div>
          <div class="field wide"><label>背调与备注</label><textarea name="notes" placeholder="公司实体、地址、官网邮箱、团队规模、Trade Reference、风险点…">${val("notes")}</textarea></div>
        </div><div class="modal-actions"><button type="button" class="secondary" data-close-modal>取消</button><button class="primary" type="submit">${existing ? "保存修改" : "保存账户并创建跟进"}</button></div></form></div>`;
    }
    if (modal.type === "activity") {
      const currentClient = clientById(modal.clientId);
      return `<div class="modal-backdrop"><form class="modal" id="activity-form"><div class="modal-head"><h2>记录沟通</h2><button type="button" class="icon-button" data-close-modal>×</button></div>
        <div class="form-grid">
          <div class="field"><label>客户 *</label><select name="clientId" required><option value="">请选择</option>${clientOptions(modal.clientId)}</select></div>
          <div class="field"><label>渠道</label><select name="channel"><option>Email</option><option>WhatsApp</option><option>LinkedIn</option><option>电话</option><option>官网表单</option><option>其他</option></select></div>
          <div class="field"><label>沟通类型</label><select name="activityType"><option>首次触达</option><option>二次跟进</option><option>三次跟进</option><option>四次跟进</option><option>客户回复</option><option>已发送报价</option><option>对方提出采购需求</option><option>对方提出销售库存</option><option>电话沟通</option></select></div>
          <div class="field wide"><label>本次结果 / 业务机会（可多选）</label>${progressSelector(currentClient?.progressTags || [])}</div>
          <div class="field wide"><label>本次沟通摘要 *</label><textarea name="summary" required></textarea></div>
          <div class="field"><label>下次跟进时间</label><input name="nextDueAt" type="datetime-local" value="${localInput(3, 10)}" /></div>
          <div class="field"><label>下次动作</label><input name="nextAction" placeholder="例如：索取实物图与 Date Code" /></div>
        </div><div class="modal-actions"><button type="button" class="secondary" data-close-modal>取消</button><button class="primary" type="submit">保存并安排跟进</button></div></form></div>`;
    }
    return `<div class="modal-backdrop"><form class="modal modal-wide" id="quote-form"><div class="modal-head"><div><h2>添加库存 / 需求机会</h2><p class="modal-note">先记录事实，缺失项明确标记“待确认”；不要把上游货源当作自有库存。</p></div><button type="button" class="icon-button" data-close-modal>×</button></div>
      <div class="form-grid">
        <div class="field"><label>客户 / 供应商 *</label><select name="clientId" required><option value="">请选择</option>${clientOptions(modal.clientId)}</select></div>
        <div class="field"><label>机会方向</label><select name="opportunityDirection">${directions.map((d) => `<option>${d}</option>`).join("")}</select></div>
        <div class="field"><label>料号 *</label><input name="partNumber" required /></div>
        <div class="field"><label>类别</label><select name="category"><option>RDIMM</option><option>Enterprise SSD</option><option>GPU</option><option>CPU</option><option>Server Components</option></select></div>
        <div class="field"><label>品牌</label><input name="brand" placeholder="Samsung / SK hynix / Micron…" /></div>
        <div class="field wide"><label>规格描述</label><input name="description" /></div>
        <div class="field"><label>数量 *</label><input name="quantity" type="number" min="1" required /></div>
        <div class="field"><label>单价</label><input name="unitPrice" inputmode="decimal" /></div>
        <div class="field"><label>目标价 / 市场参考</label><input name="targetPrice" inputmode="decimal" /></div>
        <div class="field"><label>币种</label><select name="currency"><option>USD</option><option>EUR</option><option>CNY</option><option>HKD</option></select></div>
        <div class="field"><label>货况</label><select name="condition"><option>Factory Sealed</option><option>New / Unused</option><option>Open-box Unused</option><option>Project-released New Stock</option><option>BOM-change New Stock</option></select></div>
        <div class="field"><label>包装与封签</label><input name="packaging" placeholder="Original box / tray / antistatic bag / seal" /></div>
        <div class="field"><label>Date Code</label><input name="dateCode" placeholder="待确认 / 2025+" /></div>
        <div class="field"><label>COO</label><input name="countryOfOrigin" placeholder="Country of Origin" /></div>
        <div class="field"><label>库存地</label><input name="stockLocation" /></div>
        <div class="field"><label>货权</label><select name="ownership"><option>待确认</option><option>Own stock</option><option>Partner stock</option><option>Distributor allocation</option><option>Future stock</option></select></div>
        <div class="field"><label>可用时间</label><input name="availability" placeholder="In stock / ETA / future stock" /></div>
        <div class="field"><label>交期</label><input name="leadTime" /></div>
        <div class="field"><label>Incoterm</label><select name="incoterm"><option>EXW</option><option>FOB</option><option>CIF</option><option>DDP</option></select></div>
        <div class="field"><label>图片 / 视频证据</label><input name="evidence" placeholder="已收到 / 待确认 / 文件名或链接" /></div>
        <div class="field"><label>来源与可追溯性</label><input name="traceability" placeholder="PO / Invoice / authorization / source explanation" /></div>
        <div class="field"><label>Warranty / RMA</label><input name="warranty" placeholder="期限、退换方式、运费责任" /></div>
        <div class="field wide"><label>内部评估状态</label><select name="quoteStatus"><option>资料待核验</option><option>待内部价格</option><option>待内部技术判断</option><option>待内部合规判断</option><option>价格可谈</option><option>价格偏高</option><option>进入验货</option><option>已接受</option><option>已拒绝</option></select></div>
      </div><div class="modal-actions"><button type="button" class="secondary" data-close-modal>取消</button><button class="primary" type="submit">保存报价</button></div></form></div>`;
  }

  function render() {
    if (!data) return;
    const content = view === "dashboard" ? renderDashboard() : view === "clients" ? renderClients() : view === "pipeline" ? renderPipeline() : view === "tasks" ? renderTasks() : view === "activities" ? renderActivities() : view === "quotes" ? renderQuotes() : renderReport();
    app.innerHTML = `<div class="app-shell">${renderNav()}<main class="workspace">${content}</main>${renderDrawer()}${renderModal()}</div>`;
    bindEvents();
  }

  function bindEvents() {
    document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { view = button.dataset.view; selectedClientId = null; render(); }));
    document.querySelectorAll("[data-client]").forEach((el) => el.addEventListener("click", (event) => { event.stopPropagation(); selectedClientId = Number(el.dataset.client); render(); }));
    document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => {
      const type = button.dataset.action;
      if (type === "client") quickDraft = { company: "", website: "" };
      modal = { type, clientId: Number(button.dataset.clientId || selectedClientId || 0) || "" };
      render();
    }));
    document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => { modal = null; render(); }));
    document.querySelector(".modal-backdrop")?.addEventListener("click", (event) => { if (event.target.classList.contains("modal-backdrop")) { modal = null; render(); } });
    document.getElementById("close-drawer")?.addEventListener("click", () => { selectedClientId = null; render(); });
    document.getElementById("drawer-backdrop")?.addEventListener("click", () => { selectedClientId = null; render(); });
    document.getElementById("logout")?.addEventListener("click", logout);
    document.getElementById("download-backup")?.addEventListener("click", downloadBackup);
    document.getElementById("restore-backup")?.addEventListener("click", () => backupFile.click());
    document.getElementById("analyze-url")?.addEventListener("click", analyzeUrl);
    document.getElementById("global-search")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { clientSearch = event.target.value; view = "clients"; render(); }
    });
    document.getElementById("client-search")?.addEventListener("input", (event) => { clientSearch = event.target.value; render(); document.getElementById("client-search")?.focus(); });
    document.getElementById("client-status")?.addEventListener("change", (event) => { clientStatus = event.target.value; render(); });
    document.getElementById("client-grade")?.addEventListener("change", (event) => { clientGrade = event.target.value; render(); });
    document.getElementById("client-direction")?.addEventListener("change", (event) => { clientDirection = event.target.value; render(); });
    document.querySelectorAll("[data-task]").forEach((button) => button.addEventListener("click", () => transact((draft) => {
      const task = draft.tasks.find((t) => t.id === Number(button.dataset.task));
      if (task) task.completed = !task.completed;
    }, "任务状态已更新")));
    document.getElementById("copy-report")?.addEventListener("click", async () => {
      await navigator.clipboard.writeText(reportText());
      toast("老板周报已复制");
    });
    document.getElementById("client-form")?.addEventListener("submit", submitClient);
    document.getElementById("activity-form")?.addEventListener("submit", submitActivity);
    document.getElementById("quote-form")?.addEventListener("submit", submitQuote);
  }

  function analyzeUrl() {
    const raw = document.getElementById("quick-url").value.trim();
    try {
      const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
      const url = new URL(normalized);
      const company = url.hostname.replace(/^www\./, "").split(".")[0].split(/[-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      quickDraft = { company, website: normalized };
      modal = { type: "client", clientId: "" };
      render();
      toast("已提取网址和公司名，请补充背调信息");
    } catch { toast("请输入有效的公司网址"); }
  }
  async function submitClient(event) {
    event.preventDefault();
    const selectedTags = progressTagsFromForm(event.currentTarget);
    const f = Object.fromEntries(new FormData(event.currentTarget));
    const existingId = Number(f.clientId || 0);
    const id = existingId || uid();
    const createdAt = new Date().toISOString();
    const next = f.nextFollowUpAt ? new Date(f.nextFollowUpAt).toISOString() : "";
    const score = Math.max(0, Math.min(100, Number(f.trustScore || 60)));
    if (f.linkedin.trim() && !selectedTags.some((tag) => tag.startsWith("linkedin_"))) selectedTags.push("linkedin_pending");
    if (f.email.trim() && !selectedTags.some((tag) => tag.startsWith("email_"))) selectedTags.push("email_pending");
    if (f.whatsapp.trim() && !selectedTags.some((tag) => tag.startsWith("whatsapp_"))) selectedTags.push("whatsapp_pending");
    await transact((draft) => {
      const progressTags = uniqueProgressTags(selectedTags);
      const values = { company: f.company.trim(), website: f.website.trim(), country: f.country.trim(), accountGrade: f.accountGrade, accountType: f.accountType, direction: f.direction, businessRole: f.direction === "Buy-from" ? "供应商" : f.direction === "Sell-to" ? "潜在买家" : "双向合作", products: f.products.trim(), source: f.source, contactName: f.contactName.trim(), jobTitle: f.jobTitle.trim(), email: f.email.trim(), whatsapp: f.whatsapp.trim(), linkedin: f.linkedin.trim(), progressTags, status: derivedStatus(progressTags, f.status || "已确认目标（待找联系人）"), trustScore: score, nextFollowUpAt: next, nextAction: f.nextAction.trim(), commercialHypothesis: f.commercialHypothesis.trim(), verifiedEvidence: f.verifiedEvidence.trim(), notes: f.notes.trim(), updatedAt: createdAt };
      const existing = draft.clients.find((c) => c.id === existingId);
      if (existing) Object.assign(existing, values);
      else draft.clients.unshift({ id, ...values, followUpStage: "账户研究", lastTouchAt: "", createdAt });
      if (!existing && next) draft.tasks.push({ id: uid(), clientId: id, title: f.nextAction.trim(), dueAt: next, priority: f.accountGrade === "A" ? "高" : "普通", stage: "账户研究", completed: false });
    }, existingId ? "账户资料已更新" : "账户已保存，并创建下次跟进");
    modal = null; quickDraft = { company: "", website: "" }; render();
  }
  async function submitActivity(event) {
    event.preventDefault();
    const selectedTags = progressTagsFromForm(event.currentTarget);
    const f = Object.fromEntries(new FormData(event.currentTarget));
    const channelKey = f.channel === "LinkedIn" ? "linkedin" : f.channel === "WhatsApp" ? "whatsapp" : f.channel === "Email" ? "email" : "";
    if (channelKey) selectedTags.push(`${channelKey}_${f.activityType === "客户回复" ? "replied" : "pending"}`);
    if (f.activityType === "已发送报价") selectedTags.push("quote_sent");
    if (f.activityType === "对方提出采购需求") selectedTags.push("customer_buying");
    if (f.activityType === "对方提出销售库存") selectedTags.push("customer_selling");
    const clientId = Number(f.clientId);
    const next = f.nextDueAt ? new Date(f.nextDueAt).toISOString() : "";
    const now = new Date().toISOString();
    await transact((draft) => {
      draft.activities.unshift({ id: uid(), clientId, channel: f.channel, activityType: f.activityType, stage: f.activityType, progressTags: selectedTags, summary: f.summary.trim(), nextAction: f.nextAction.trim(), occurredAt: now, nextDueAt: next });
      const c = draft.clients.find((item) => item.id === clientId);
      if (c) { c.progressTags = uniqueProgressTags([...(c.progressTags || []), ...selectedTags]); c.status = derivedStatus(c.progressTags, c.status); c.followUpStage = f.activityType; c.lastTouchAt = now; c.nextFollowUpAt = next; c.nextAction = f.nextAction.trim(); c.updatedAt = now; }
      if (next && f.nextAction.trim()) draft.tasks.push({ id: uid(), clientId, title: f.nextAction.trim(), dueAt: next, priority: ["三次跟进", "四次跟进"].includes(f.activityType) ? "高" : "普通", stage: f.activityType, completed: false });
    }, "沟通已记录，下一次跟进已安排");
    modal = null; render();
  }
  async function submitQuote(event) {
    event.preventDefault();
    const f = Object.fromEntries(new FormData(event.currentTarget));
    const clientId = Number(f.clientId);
    const now = new Date().toISOString();
    await transact((draft) => {
      const quote = { id: uid(), clientId, opportunityDirection: f.opportunityDirection, partNumber: f.partNumber.trim(), category: f.category, brand: f.brand.trim(), description: f.description.trim(), quantity: Number(f.quantity || 0), unitPrice: f.unitPrice.trim(), targetPrice: f.targetPrice.trim(), currency: f.currency, condition: f.condition, packaging: f.packaging.trim() || "待确认", dateCode: f.dateCode.trim() || "待确认", countryOfOrigin: f.countryOfOrigin.trim() || "待确认", stockLocation: f.stockLocation.trim() || "待确认", ownership: f.ownership, availability: f.availability.trim() || "待确认", leadTime: f.leadTime.trim() || "待确认", incoterm: f.incoterm, evidence: f.evidence.trim() || "待确认", traceability: f.traceability.trim() || "待确认", warranty: f.warranty.trim() || "待确认", quoteStatus: f.quoteStatus, createdAt: now };
      draft.quotes.unshift(quote);
      const c = draft.clients.find((item) => item.id === clientId);
      if (c && !["已成交", "已关闭"].includes(c.status)) {
        const opportunityTags = f.opportunityDirection === "Sell-to" ? ["customer_buying"] : f.opportunityDirection === "Buy-from" ? ["customer_selling"] : ["customer_buying", "customer_selling"];
        c.progressTags = uniqueProgressTags([...(c.progressTags || []), ...opportunityTags]);
        c.status = derivedStatus(c.progressTags, c.status);
        c.updatedAt = now;
      }
    }, "报价与库存信息已保存");
    modal = null; render();
  }

  function downloadBackup() {
    const record = localStorage.getItem(STORAGE_KEY);
    if (!record) return toast("暂无可备份的数据");
    const blob = new Blob([record], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ecore-crm-backup-${dateKey(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast("加密备份已下载");
  }
  backupFile.addEventListener("change", async () => {
    const file = backupFile.files?.[0];
    if (!file) return;
    try {
      const record = JSON.parse(await file.text());
      if (record.format !== "ecore-crm-encrypted" || !record.salt || !record.iv || !record.data) throw new Error("invalid");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      backupFile.value = "";
      cryptoKey = null; data = null; sessionStorage.removeItem(SESSION_KEY);
      renderAuth("login", "备份已恢复，请输入该备份对应的密码");
    } catch {
      backupFile.value = "";
      toast("这不是有效的 ecore CRM 加密备份");
    }
  });
  function toast(message) {
    clearTimeout(toastTimer);
    document.querySelector(".toast")?.remove();
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    document.body.appendChild(el);
    toastTimer = setTimeout(() => el.remove(), 2600);
  }

  document.addEventListener("keydown", (event) => {
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
    if (!data) return;
    if (!typing && event.key.toLowerCase() === "n") { quickDraft = { company: "", website: "" }; modal = { type: "client", clientId: "" }; render(); }
    if (event.key === "Escape") { modal = null; selectedClientId = null; render(); }
  });

  async function boot() {
    const record = localStorage.getItem(STORAGE_KEY);
    if (!record) return renderAuth("setup");
    const sessionPassword = sessionStorage.getItem(SESSION_KEY);
    if (!sessionPassword) return renderAuth("login");
    try {
      const parsed = JSON.parse(record);
      cryptoKey = await deriveKey(sessionPassword, base64ToBytes(parsed.salt));
      data = normalizeData(await decryptPayload(parsed, cryptoKey));
      await saveData();
      render();
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      renderAuth("login");
    }
  }
  boot();
})();
