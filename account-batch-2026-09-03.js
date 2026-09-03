(() => {
  "use strict";

  const BATCH_KEY = "ecore-account-batch-2026-09-03-v1";
  const COUNTRY_FILTER_KEY = "ecore-country-filter-v1";
  const TARGET_NEW_ACCOUNTS = 30;

  // 2026-09-03 Account Development pool.
  // This script imports only net-new accounts: existing names/aliases are skipped.
  // Contact email/LinkedIn fields are intentionally NOT populated because the core CRM
  // currently interprets a populated channel field as "already contacted".
  const CANDIDATES = [
    {
      company: "Starline Computer GmbH",
      aliases: ["Starline Computer", "Starline"],
      website: "https://www.starline.de/en",
      country: "Germany",
      accountGrade: "A",
      accountType: "Server Builder",
      direction: "Two-way",
      products: "Enterprise servers / storage / GPU servers / server memory / NVMe",
      priority: "A1",
      evidence: "Official site: German server and storage specialist with configurable server/storage systems and corporate purchasing workflow.",
      hypothesis: "BOTH: server/storage assembly can create recurring component demand and project/configuration-change inventory."
    },
    {
      company: "AMBER AI & Data Science Solutions GmbH",
      aliases: ["Amber AI", "AMBER"],
      website: "https://amber.eu/",
      country: "Germany",
      accountGrade: "A",
      accountType: "HPC / AI Infrastructure",
      direction: "Two-way",
      products: "NVIDIA DGX / HGX / RTX / AI Factory infrastructure",
      priority: "A1",
      evidence: "Official site and NVIDIA partner directory: NVIDIA Elite / AI Factory specialist with DGX, HGX, RTX and enterprise AI infrastructure.",
      hypothesis: "BOTH: AI infrastructure projects create high-density GPU/server-memory/storage requirements and possible project-change inventory."
    },
    {
      company: "E4 Computer Engineering",
      aliases: ["E4 Computer Engineering S.p.A.", "E4"],
      website: "https://www.e4company.com/",
      country: "Italy",
      accountGrade: "A",
      accountType: "HPC / AI Infrastructure",
      direction: "Two-way",
      products: "HPC / AI / advanced compute infrastructure / servers / storage",
      priority: "A1",
      evidence: "Official/EuroHPC evidence: E4 designs and deploys HPC/AI infrastructure and is involved in the 2026 IT4LIA AI Factory procurement with Dell Technologies.",
      hypothesis: "BOTH: large HPC/AI BOMs can create exact-PN demand, spares and released project inventory."
    },
    {
      company: "Vesper Technologies",
      aliases: ["Vespertec", "Vesper Technologies Ltd"],
      website: "https://vespertec.com/",
      country: "United Kingdom",
      accountGrade: "A",
      accountType: "HPC / AI Infrastructure",
      direction: "Two-way",
      products: "NVIDIA AI / GPU / data-center infrastructure / storage",
      priority: "A1",
      evidence: "Official site and NVIDIA reseller directory: data-center performance specialist with NVIDIA AI infrastructure and AI Factory focus.",
      hypothesis: "BOTH: GPU/data-center projects can generate urgent supply gaps and project-specific hardware inventory."
    },
    {
      company: "Stovaris",
      aliases: ["Stovaris Sp. z o.o.", "Stovaris Ltd."],
      website: "https://stovaris.pl/en/",
      country: "Poland",
      accountGrade: "A",
      accountType: "Distributor",
      direction: "Two-way",
      products: "IT infrastructure / data center / servers / storage",
      priority: "A1",
      evidence: "Official site: Polish value-added distributor with dedicated IT Infrastructure & Data Center and Servers & Storage business.",
      hypothesis: "BOTH: distribution inventory can provide enterprise hardware supply while project/channel changes may release stock."
    },
    {
      company: "Gigaserwer Sp. z o.o.",
      aliases: ["Gigaserwer"],
      website: "https://www.gigaserwer.pl/",
      country: "Poland",
      accountGrade: "A",
      accountType: "Server Builder",
      direction: "Two-way",
      products: "Servers / workstations / GPU compute / enterprise components",
      priority: "A1",
      evidence: "Giga Computing official channel listing plus company profile: Polish server integrator/manufacturer, 11–50 employees.",
      hypothesis: "BOTH: server production creates component procurement needs plus potential released/spare inventory."
    },
    {
      company: "Servodata Elektronik Sp. z o.o.",
      aliases: ["Servodata Elektronik", "Servodata"],
      website: "https://www.servodata.com.pl/",
      country: "Poland",
      accountGrade: "B",
      accountType: "HPC / AI Infrastructure",
      direction: "Two-way",
      products: "HPC / NVIDIA compute / enterprise servers",
      priority: "A2",
      evidence: "Official contact site plus NVIDIA ecosystem evidence; company publicly supports price and availability enquiries for enterprise hardware.",
      hypothesis: "BOTH: validate current server/GPU scope, then explore project component demand and excess/spare inventory."
    },
    {
      company: "ADN Distribution GmbH",
      aliases: ["Advanced Digital Network Distribution", "ADN", "Advanced Digital Network Distribution GmbH"],
      website: "https://www.adn.de/de/",
      country: "Germany",
      accountGrade: "A",
      accountType: "Distributor",
      direction: "Buy-from",
      products: "NVIDIA compute / DGX / networking / enterprise infrastructure",
      priority: "A1",
      evidence: "NVIDIA official partner directory lists Advanced Digital Network Distribution GmbH as Distributor with Compute and DGX AI Compute Systems competencies.",
      hypothesis: "BUY-first: validate availability, allocation and reseller/export path for NVIDIA enterprise hardware."
    },
    {
      company: "Workstation Specialists",
      aliases: ["Workstation Specialists Ltd"],
      website: "https://www.workstationspecialist.com/",
      country: "United Kingdom",
      accountGrade: "A",
      accountType: "Server Builder",
      direction: "Buy-from",
      products: "NVIDIA RTX PRO 6000 / workstations / GPU compute",
      priority: "A1",
      evidence: "Official product catalogue lists RTX PRO 6000 Blackwell Workstation and Server editions with live availability signals.",
      hypothesis: "BUY-first: build a professional-GPU sourcing channel for RTX PRO 6000 Workstation/Server and related workstation hardware."
    },
    {
      company: "Dynacore Technologies",
      aliases: ["Dynacore Technologies Pte Ltd", "Dynacore"],
      website: "https://dynacoretech.com/",
      country: "Singapore",
      accountGrade: "A",
      accountType: "Distributor",
      direction: "Buy-from",
      products: "ASUS / MSI / GIGABYTE RTX 5070 / 5090 / PC components",
      priority: "A1",
      evidence: "Official Singapore site: PC/component channel with corporate orders and current RTX 50-series product availability.",
      hypothesis: "BUY-first: local Singapore source for RTX 5070/5090 B2B quantities, allocation and pickup."
    },
    {
      company: "Avertek Enterprises",
      aliases: ["Avertek Enterprises Pte Ltd", "Avertek"],
      website: "https://www.avertek.com.sg/",
      country: "Singapore",
      accountGrade: "A",
      accountType: "Distributor",
      direction: "Buy-from",
      products: "ASUS GPU / HPC / creative & gaming hardware",
      priority: "A1",
      evidence: "Official site: Singapore wholesale distributor focused on high-performance computing, creative and gaming hardware with ASUS channel history.",
      hypothesis: "BUY-first: validate ASUS RTX 5090/5070 allocation, reseller pricing and local stock."
    },
    {
      company: "Wiredzone",
      aliases: ["Wiredzone.com", "Wiredzone.com Inc."],
      website: "https://www.wiredzone.com/",
      country: "United States",
      accountGrade: "B",
      accountType: "VAR",
      direction: "Buy-from",
      products: "RTX PRO 6000 / Supermicro / AI servers / workstations",
      priority: "A2",
      evidence: "Official catalogue lists RTX PRO 6000 Blackwell Workstation/Server products and enterprise server components.",
      hypothesis: "BUY-first: verify actual stock vs manufacturer drop-ship, quantity, export terms and B2B pricing."
    },
    {
      company: "Escape Technology",
      aliases: ["Escape Technology Ltd"],
      website: "https://www.escape-technology.com/",
      country: "United Kingdom",
      accountGrade: "A",
      accountType: "VAR",
      direction: "Buy-from",
      products: "NVIDIA professional GPU / RTX PRO 6000 / creative infrastructure",
      priority: "A1",
      evidence: "Official site lists NVIDIA RTX PRO 6000 Blackwell Server Edition and professional NVIDIA infrastructure products.",
      hypothesis: "BUY-first: focus on incoming RTX PRO 6000 allocation, ETA and B2B/export pricing."
    },
    {
      company: "SabrePC",
      aliases: ["SabrePC.com", "GenoEdge Corporation"],
      website: "https://www.sabrepc.com/",
      country: "United States",
      accountGrade: "A",
      accountType: "VAR",
      direction: "Buy-from",
      products: "Professional GPU / data-center GPU / HPC / servers / workstations",
      priority: "A1",
      evidence: "Official catalogue focuses on professional/data-center GPU, HPC, servers and workstations and lists RTX PRO Blackwell SKUs.",
      hypothesis: "BUY-first: source RTX PRO 6000 Workstation/Server through B2B account channel rather than web inventory only."
    },
    {
      company: "Ban Leong Technologies",
      aliases: ["Ban Leong Technologies Ltd", "Ban Leong"],
      website: "https://www.banleong.com.sg/",
      country: "Singapore",
      accountGrade: "B",
      accountType: "Distributor",
      direction: "Buy-from",
      products: "Consumer GPU / PC components / enterprise technology distribution",
      priority: "A2",
      evidence: "Official Singapore distributor with broad authorized-brand portfolio, local warehousing and reseller/system-integrator channel.",
      hypothesis: "BUY-first: backup Singapore source for RTX 5090/5070 and related branded GPU allocation."
    },
    {
      company: "Happyware Server",
      aliases: ["Happyware", "Happyware Server Europe"],
      website: "https://happyware.com/",
      country: "Germany",
      accountGrade: "A",
      accountType: "Server Builder",
      direction: "Two-way",
      products: "Servers / storage / GIGABYTE enterprise systems / components",
      priority: "A1",
      evidence: "Giga Computing official reseller listing identifies Happyware as an enterprise server channel partner.",
      hypothesis: "BOTH: server-system business can create enterprise component demand plus configuration/project inventory."
    },
    {
      company: "Ibertronica",
      aliases: ["Ibertronica Sistemas", "Ibertrónica"],
      website: "https://ibertronica.es/",
      country: "Spain",
      accountGrade: "A",
      accountType: "Distributor",
      direction: "Two-way",
      products: "Servers / workstations / GIGABYTE enterprise hardware / components",
      priority: "A1",
      evidence: "Giga Computing official reseller directory lists Ibertronica in Spain for enterprise hardware.",
      hypothesis: "BOTH: Spanish enterprise hardware channel may provide stock and recurring server/workstation component demand."
    },
    {
      company: "bluechip Computer AG",
      aliases: ["Bluechip Computer AG", "bluechip"],
      website: "https://www.bluechip.de/",
      country: "Germany",
      accountGrade: "A",
      accountType: "OEM / ODM",
      direction: "Two-way",
      products: "PC / workstation / server systems / components",
      priority: "A2",
      evidence: "German system manufacturer/channel company with workstation/server and component business; validate current GPU/server procurement ownership.",
      hypothesis: "BOTH: system manufacturing creates component demand and possible inventory from model/configuration changes."
    },
    {
      company: "Nephos Technologies",
      aliases: ["Nephos Technologies Ltd"],
      website: "https://www.nephostechnologies.com/",
      country: "United Kingdom",
      accountGrade: "B",
      accountType: "SI",
      direction: "Two-way",
      products: "Data infrastructure / NVIDIA networking / enterprise solutions",
      priority: "B1",
      evidence: "NVIDIA EMEA reseller directory lists Nephos Technologies in the UK.",
      hypothesis: "Validate server/storage hardware scope; if confirmed, develop for project shortages and lifecycle inventory."
    },
    {
      company: "OCF",
      aliases: ["OCF Limited", "OCF Ltd"],
      website: "https://www.ocf.co.uk/",
      country: "United Kingdom",
      accountGrade: "B",
      accountType: "HPC / AI Infrastructure",
      direction: "Two-way",
      products: "HPC / AI / research compute / NVIDIA infrastructure",
      priority: "A2",
      evidence: "NVIDIA EMEA reseller directory lists OCF; company is known for HPC/research computing infrastructure.",
      hypothesis: "BOTH: HPC projects create memory/storage/GPU demand and potential project spares or refresh inventory."
    },
    {
      company: "Pixitmedia",
      aliases: ["Pixit Media", "Pixitmedia Ltd"],
      website: "https://www.pixitmedia.com/",
      country: "United Kingdom",
      accountGrade: "B",
      accountType: "SI",
      direction: "Two-way",
      products: "High-performance data / storage / media infrastructure / NVIDIA networking",
      priority: "B1",
      evidence: "NVIDIA EMEA reseller directory lists Pixit Media; enterprise high-performance data/storage infrastructure is commercially relevant.",
      hypothesis: "BOTH: storage-heavy projects may create enterprise SSD demand and infrastructure refresh inventory."
    },
    {
      company: "BEST Systeme GmbH",
      aliases: ["BEST Systeme", "best Systeme GmbH"],
      website: "https://www.best.de/",
      country: "Germany",
      accountGrade: "B",
      accountType: "SI",
      direction: "Two-way",
      products: "NVIDIA networking / enterprise IT / engineered systems",
      priority: "B1",
      evidence: "Official site and NVIDIA partner directory: German IT project company with NVIDIA networking competence.",
      hypothesis: "Validate server hardware ownership before deeper development; potential project sourcing and released infrastructure stock."
    },
    {
      company: "Cosmos Business Systems",
      aliases: ["Cosmos Business Systems S.A.", "Cosmos Business Systems SA"],
      website: "https://www.cosmos.com.gr/",
      country: "Greece",
      accountGrade: "B",
      accountType: "SI",
      direction: "Two-way",
      products: "Enterprise IT / data center / NVIDIA infrastructure",
      priority: "B1",
      evidence: "NVIDIA enterprise partner/reseller ecosystem plus established enterprise IT integration business in Greece.",
      hypothesis: "BOTH: enterprise projects can create exact-PN demand and infrastructure refresh/surplus opportunities."
    },
    {
      company: "Anadat Technology",
      aliases: ["Anadat", "Anadat Consulting"],
      website: "https://www.anadat.com/",
      country: "Spain",
      accountGrade: "B",
      accountType: "SI",
      direction: "Sell-to",
      products: "Enterprise infrastructure / cloud / data center / NVIDIA ecosystem",
      priority: "B1",
      evidence: "NVIDIA EMEA reseller ecosystem and Spanish enterprise infrastructure positioning.",
      hypothesis: "SELL/relationship-first: validate server component sourcing ownership and project shortage use cases."
    },
    {
      company: "Aditinet",
      aliases: ["Aditinet S.p.A.", "Aditinet SpA"],
      website: "https://www.aditinet.it/",
      country: "Italy",
      accountGrade: "B",
      accountType: "SI",
      direction: "Sell-to",
      products: "Data-center networking / infrastructure / NVIDIA ecosystem",
      priority: "B1",
      evidence: "NVIDIA EMEA reseller ecosystem; Italian enterprise infrastructure integrator.",
      hypothesis: "Validate whether server hardware/BOM sourcing sits in scope before investing deeper development time."
    },
    {
      company: "Kramer & Crew GmbH",
      aliases: ["Kramer & Crew"],
      website: "",
      country: "Germany",
      accountGrade: "B",
      accountType: "SI",
      direction: "Sell-to",
      products: "Enterprise infrastructure / NVIDIA ecosystem",
      priority: "B1",
      evidence: "NVIDIA EMEA reseller/partner directory; company-level infrastructure fit requires contact-level verification.",
      hypothesis: "Account-led: confirm server/data-center sourcing responsibility before positioning ECORE."
    },
    {
      company: "LeitWerk AG",
      aliases: ["LeitWerk"],
      website: "https://www.leitwerk.de/",
      country: "Germany",
      accountGrade: "B",
      accountType: "SI",
      direction: "Sell-to",
      products: "Enterprise IT infrastructure / NVIDIA ecosystem",
      priority: "B1",
      evidence: "NVIDIA EMEA reseller/partner directory; enterprise infrastructure account for further qualification.",
      hypothesis: "Account-led: qualify hardware procurement and project supply scenarios before deeper outreach."
    },
    {
      company: "sysGen GmbH",
      aliases: ["sysGen"],
      website: "",
      country: "Germany",
      accountGrade: "B",
      accountType: "SI",
      direction: "Sell-to",
      products: "Enterprise infrastructure / NVIDIA ecosystem",
      priority: "B1",
      evidence: "NVIDIA EMEA reseller/partner directory; requires current server-hardware scope verification.",
      hypothesis: "Account-led: identify the server/infrastructure owner and validate component sourcing relevance."
    },
    {
      company: "IaaS365",
      aliases: ["IaaS 365", "IaaS365 S.L."],
      website: "https://iaas365.com/",
      country: "Spain",
      accountGrade: "B",
      accountType: "Cloud / Hosting",
      direction: "Two-way",
      products: "Cloud / data-center infrastructure / NVIDIA ecosystem",
      priority: "B1",
      evidence: "NVIDIA EMEA ecosystem account; cloud/data-center footprint makes hardware lifecycle worth validating.",
      hypothesis: "BOTH hypothesis: own/managed infrastructure may create refresh inventory and new hardware demand."
    },
    {
      company: "COMSET S.A.",
      aliases: ["COMSET", "Comset SA"],
      website: "",
      country: "Poland",
      accountGrade: "B",
      accountType: "SI",
      direction: "Two-way",
      products: "NVIDIA compute / networking / enterprise infrastructure",
      priority: "B1",
      evidence: "NVIDIA partner ecosystem; compute/networking relevance requires current account verification.",
      hypothesis: "BOTH: validate compute project procurement and any spare/released enterprise hardware."
    },

    // Replacement pool below is used only when one of the first 30 already exists in CRM.
    {
      company: "BIOS IT",
      aliases: ["BIOS IT Ltd"],
      website: "https://www.bios-it.co.uk/",
      country: "United Kingdom",
      accountGrade: "A",
      accountType: "HPC / AI Infrastructure",
      direction: "Two-way",
      products: "HPC / AI / server / storage infrastructure",
      priority: "A1",
      evidence: "Official site: end-to-end HPC design and deployment with configurable compute, memory, accelerators and storage.",
      hypothesis: "BOTH: HPC BOMs create component sourcing needs and project/spare inventory."
    },
    {
      company: "MEGWARE",
      aliases: ["MEGWARE Computer Vertrieb und Service GmbH"],
      website: "https://www.megware.com/",
      country: "Germany",
      accountGrade: "A",
      accountType: "HPC / AI Infrastructure",
      direction: "Two-way",
      products: "HPC clusters / GPU / enterprise compute",
      priority: "A1",
      evidence: "HPC specialist with large compute projects and enterprise server infrastructure.",
      hypothesis: "BOTH: large HPC projects can create recurring memory/storage/GPU needs and released project stock."
    },
    {
      company: "FORMAT Sp. z o.o.",
      aliases: ["FORMAT"],
      website: "https://www.format.com.pl/",
      country: "Poland",
      accountGrade: "B",
      accountType: "SI",
      direction: "Two-way",
      products: "Servers / IT infrastructure / NVIDIA ecosystem",
      priority: "B1",
      evidence: "NVIDIA/enterprise infrastructure ecosystem account.",
      hypothesis: "Qualify server integration depth, then explore shortage and project inventory scenarios."
    },
    {
      company: "Datera s.r.o.",
      aliases: ["Datera"],
      website: "",
      country: "Czech Republic",
      accountGrade: "B",
      accountType: "VAR",
      direction: "Two-way",
      products: "NVIDIA ecosystem / enterprise infrastructure",
      priority: "B1",
      evidence: "NVIDIA EMEA reseller directory; current server/storage depth should be verified before heavy investment.",
      hypothesis: "Account-led qualification for project hardware demand and possible channel stock."
    },
    {
      company: "Neoria NV",
      aliases: ["Neoria"],
      website: "",
      country: "Belgium",
      accountGrade: "B",
      accountType: "VAR",
      direction: "Two-way",
      products: "NVIDIA ecosystem / enterprise infrastructure",
      priority: "B1",
      evidence: "NVIDIA EMEA reseller directory; reachable mid-sized channel candidate.",
      hypothesis: "Qualify server/GPU product ownership, then develop BUY/SELL based on actual channel role."
    },
    {
      company: "m.a.x. Informationstechnologie AG",
      aliases: ["M.A.X. IT", "m.a.x. it"],
      website: "https://www.max-it.de/",
      country: "Germany",
      accountGrade: "B",
      accountType: "SI",
      direction: "Sell-to",
      products: "System integration / managed server / infrastructure",
      priority: "B1",
      evidence: "Official site: Munich IT/system-integration company with managed server and infrastructure services, around 50 employees.",
      hypothesis: "Qualify whether physical server procurement is material enough for component-level opportunities."
    },
    {
      company: "Flow Communications",
      aliases: ["Flow Communications UK"],
      website: "http://www.flow-communications.co.uk/",
      country: "United Kingdom",
      accountGrade: "B",
      accountType: "VAR",
      direction: "Sell-to",
      products: "NVIDIA networking / enterprise infrastructure",
      priority: "B1",
      evidence: "NVIDIA EMEA reseller directory lists Flow Communications in the UK.",
      hypothesis: "Validate compute/server scope before deeper outreach; networking-only accounts should be downgraded."
    },
    {
      company: "Azken Muga",
      aliases: ["Azken Muga S.L."],
      website: "https://azken.com/",
      country: "Spain",
      accountGrade: "B",
      accountType: "Distributor",
      direction: "Two-way",
      products: "GIGABYTE / Giga Computing enterprise systems / components",
      priority: "B1",
      evidence: "Giga Computing official reseller directory lists Azken Muga in Spain.",
      hypothesis: "BOTH: validate enterprise server stock, component availability and project demand."
    },
    {
      company: "SIE",
      aliases: ["SIE Spain"],
      website: "",
      country: "Spain",
      accountGrade: "B",
      accountType: "Distributor",
      direction: "Two-way",
      products: "Giga Computing enterprise hardware / server channel",
      priority: "B1",
      evidence: "Giga Computing official reseller directory lists SIE in Spain.",
      hypothesis: "BOTH: validate server-system/channel inventory and exact component demand."
    },
    {
      company: "AMAX Ireland",
      aliases: ["Amax Ireland"],
      website: "https://amax.ie/",
      country: "Ireland",
      accountGrade: "B",
      accountType: "HPC / AI Infrastructure",
      direction: "Two-way",
      products: "HPC / AI / enterprise compute",
      priority: "B1",
      evidence: "Ireland-based AMAX operation; validate current local entity and AI/HPC procurement scope before deeper outreach.",
      hypothesis: "BOTH: AI/HPC integration can create component demand and project inventory if local purchasing is active."
    }
  ];

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const normalize = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");

  async function waitFor(test, timeout = 15000, interval = 80) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const value = test();
      if (value) return value;
      await sleep(interval);
    }
    return null;
  }

  function setField(form, name, value) {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input) return;
    input.value = value ?? "";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function existingNames() {
    return new Set(
      [...document.querySelectorAll(".account-table tbody .company-cell strong")]
        .map((el) => normalize(el.textContent))
        .filter(Boolean)
    );
  }

  function candidateExists(candidate, names) {
    const options = [candidate.company, ...(candidate.aliases || [])].map(normalize).filter(Boolean);
    return options.some((name) => names.has(name));
  }

  function publicChannelNote(candidate) {
    const publicContacts = {
      "Starline Computer GmbH": "公开入口：info@starline.de",
      "AMBER AI & Data Science Solutions GmbH": "公开入口：info@amber.eu",
      "E4 Computer Engineering": "公开入口：info@e4company.com",
      "Stovaris": "公开入口：biuro@stovaris.pl",
      "Gigaserwer Sp. z o.o.": "公开入口：info@gigaserwer.pl",
      "Servodata Elektronik Sp. z o.o.": "公开入口：servodata@servodata.com.pl",
      "Workstation Specialists": "公开入口：contact@wksmail.com",
      "Dynacore Technologies": "公开入口：sales@dynacoretech.com",
      "Avertek Enterprises": "公开入口：enquiry@avertek.com.sg",
      "Escape Technology": "公开入口：sales@escape-technology.com",
      "SabrePC": "公开入口：sales@sabrepc.com",
      "Ban Leong Technologies": "公开入口：sales@banleong.com.sg",
      "Happyware Server": "公开入口：contact@happyware.com",
      "Ibertronica": "公开入口：comercial@ibertronica.es",
      "BEST Systeme GmbH": "公开入口：sales@best.de",
      "m.a.x. Informationstechnologie AG": "公开入口：vertrieb@max-it.de",
      "Azken Muga": "公开入口：comercial@azken.com"
    };
    return publicContacts[candidate.company] || "联系人/邮箱待做二次精准核验";
  }

  async function openClientsView() {
    const nav = await waitFor(() => document.querySelector('[data-view="clients"]'), 120000);
    if (!nav) return false;
    nav.click();
    return !!(await waitFor(() => document.querySelector(".account-table"), 5000));
  }

  async function addOne(candidate) {
    let addButton = document.querySelector('[data-action="client"]');
    if (!addButton) {
      const ok = await openClientsView();
      if (!ok) return false;
      addButton = document.querySelector('[data-action="client"]');
    }
    if (!addButton) return false;

    addButton.click();
    const form = await waitFor(() => document.querySelector("#client-form"), 4000);
    if (!form) return false;

    setField(form, "company", candidate.company);
    setField(form, "website", candidate.website || "");
    setField(form, "country", candidate.country || "");
    setField(form, "accountGrade", candidate.accountGrade || "B");
    setField(form, "accountType", candidate.accountType || "Other");
    setField(form, "direction", candidate.direction || "Two-way");
    setField(form, "products", candidate.products || "");
    setField(form, "commercialHypothesis", candidate.hypothesis || "");
    setField(form, "verifiedEvidence", candidate.evidence || "");
    setField(form, "nextAction", "找 Right Person，完成公司/职位/语言判断后定制第一封开发信");
    setField(form, "notes", `2026-09-03 新开发池｜优先级 ${candidate.priority || "B1"}｜尚未触达｜${publicChannelNote(candidate)}｜先验证 Right Person，不把官网能力当现货。`);

    // Keep channel fields empty: in the current core app a populated email/LinkedIn/WhatsApp
    // automatically becomes a "pending outreach" state, which would create false activity data.
    setField(form, "email", "");
    setField(form, "linkedin", "");
    setField(form, "whatsapp", "");

    form.requestSubmit();
    const closed = await waitFor(() => !document.querySelector("#client-form"), 7000);
    return !!closed;
  }

  function showBatchBanner(message, tone = "ok") {
    const old = document.getElementById("batch-20260903-banner");
    if (old) old.remove();
    const el = document.createElement("div");
    el.id = "batch-20260903-banner";
    el.textContent = message;
    Object.assign(el.style, {
      position: "fixed",
      right: "18px",
      bottom: "18px",
      zIndex: "99999",
      maxWidth: "420px",
      padding: "12px 16px",
      borderRadius: "10px",
      background: tone === "error" ? "#7f1d1d" : "#173a2a",
      color: "#fff",
      fontSize: "14px",
      lineHeight: "1.5",
      boxShadow: "0 8px 30px rgba(0,0,0,.2)"
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 9000);
  }

  async function importNetNewAccounts() {
    if (localStorage.getItem(BATCH_KEY) === "done") return;
    if (!(await openClientsView())) return;

    const names = existingNames();
    let added = 0;
    let skipped = 0;

    for (const candidate of CANDIDATES) {
      if (added >= TARGET_NEW_ACCOUNTS) break;
      if (candidateExists(candidate, names)) {
        skipped += 1;
        continue;
      }

      const ok = await addOne(candidate);
      if (!ok) {
        showBatchBanner(`今日账户批次导入暂停：已新增 ${added} 家。刷新后会自动从未导入账户继续。`, "error");
        return;
      }

      [candidate.company, ...(candidate.aliases || [])].forEach((name) => names.add(normalize(name)));
      added += 1;
      await sleep(120);
    }

    if (added >= TARGET_NEW_ACCOUNTS) {
      localStorage.setItem(BATCH_KEY, "done");
      showBatchBanner(`已导入 ${added} 个净新增账户；自动跳过 ${skipped} 个已有/同名账户。国家列与国家筛选已启用。`);
    } else {
      showBatchBanner(`候选池只找到 ${added} 个净新增账户（跳过 ${skipped} 个已有账户），未强行凑数。`, "error");
    }
  }

  function countryFromCompanyCell(row) {
    const small = row.querySelector(".company-cell small");
    if (!small) return "";
    const raw = small.textContent || "";
    return (raw.split(" · ")[0] || "").trim();
  }

  function enhanceCountryColumn() {
    const table = document.querySelector(".account-table table");
    if (!table || table.dataset.countryEnhanced === "1") return;

    const headerRow = table.querySelector("thead tr");
    if (!headerRow || !headerRow.children.length) return;
    const th = document.createElement("th");
    th.textContent = "国家";
    headerRow.children[0].after(th);

    table.querySelectorAll("tbody tr").forEach((row) => {
      const first = row.children[0];
      if (!first) return;
      const country = countryFromCompanyCell(row) || "待补充";
      const td = document.createElement("td");
      td.className = "country-cell-v3";
      td.textContent = country;
      first.after(td);

      const small = row.querySelector(".company-cell small");
      if (small) {
        const parts = (small.textContent || "").split(" · ");
        if (parts.length > 1) small.textContent = parts.slice(1).join(" · ");
      }
    });

    table.dataset.countryEnhanced = "1";
    ensureCountryFilter();
    applyCountryFilter();
  }

  function ensureCountryFilter() {
    const toolbar = document.querySelector(".account-table")?.previousElementSibling;
    if (!toolbar || !toolbar.classList.contains("toolbar") || toolbar.querySelector("#client-country-v3")) return;

    const countries = [...new Set([...document.querySelectorAll(".country-cell-v3")]
      .map((el) => el.textContent.trim())
      .filter((value) => value && value !== "待补充"))]
      .sort((a, b) => a.localeCompare(b));

    const select = document.createElement("select");
    select.id = "client-country-v3";
    select.innerHTML = `<option value="全部">全部国家</option>${countries.map((country) => `<option value="${country.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;")}">${country}</option>`).join("")}`;
    const saved = localStorage.getItem(COUNTRY_FILTER_KEY) || "全部";
    if ([...select.options].some((option) => option.value === saved)) select.value = saved;
    select.addEventListener("change", () => {
      localStorage.setItem(COUNTRY_FILTER_KEY, select.value);
      applyCountryFilter();
    });

    const grade = toolbar.querySelector("#client-grade");
    if (grade) toolbar.insertBefore(select, grade);
    else toolbar.appendChild(select);
  }

  function applyCountryFilter() {
    const select = document.getElementById("client-country-v3");
    if (!select) return;
    const target = select.value;
    document.querySelectorAll(".account-table tbody tr").forEach((row) => {
      const country = row.querySelector(".country-cell-v3")?.textContent.trim() || "待补充";
      row.style.display = target === "全部" || country === target ? "" : "none";
    });
  }

  function renameCountryFormLabel() {
    const input = document.querySelector('#client-form [name="country"]');
    const label = input?.closest(".field")?.querySelector("label");
    if (label && label.textContent !== "国家") label.textContent = "国家";
  }

  function runUiEnhancements() {
    enhanceCountryColumn();
    renameCountryFormLabel();
  }

  const observer = new MutationObserver(runUiEnhancements);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", runUiEnhancements);
  setTimeout(runUiEnhancements, 300);
  setTimeout(importNetNewAccounts, 800);
})();
