(() => {
  const articles = [
    { cat:'Ecore业务', title:'我们到底做什么？', tags:'公司 主营 buy sell ecore', body:'Ecore 面向企业级服务器与 AI 基础设施供应链，核心是两件事：BUY 项目余料、过剩 allocation、全新未使用的服务器器件库存；SUPPLY 客户急缺、难找的服务器部件。不是只卖一个品牌，也不是消费电子零售。', ask:['对方是有货要卖，还是有项目需求要买？','货/需求对应的 Exact PN、Qty、Location、Timing 是什么？'] },
    { cat:'Ecore业务', title:'我们的核心品类', tags:'ram ssd hdd gpu cpu products', body:'重点：Server RAM（DDR4/DDR5 RDIMM）、Enterprise SSD/HDD、High-End GPU、Server CPU。当前工作里 RAM、Enterprise SSD、GPU 的优先级最高。', ask:['先判断是不是 enterprise/server grade','再确认 Exact PN，不只看笼统型号'] },
    { cat:'产品基础', title:'RDIMM 是什么？', tags:'ram rdimm ecc registered ddr5 memory', body:'RDIMM = Registered DIMM，是服务器常见内存类型。你开发服务器、HPC、AI、Cloud、Datacenter 客户时，看到 DDR5 + ECC/Registered/RDIMM，通常比普通 UDIMM 更贴近 Ecore 的企业级业务。', ask:['Brand / Exact PN','Capacity：64G/96G/128G/256G','Speed：4800/5600/6400','Qty / Condition / Packaging / Location'] },
    { cat:'产品基础', title:'DDR5 5600 / 6400 怎么看？', tags:'5600 6400 speed ram ddr5', body:'5600、6400通常指内存数据速率。不能只凭“64G 5600”就报价或采购，因为同容量同频率仍可能有不同 PN、rank、厂商规格和兼容平台。业务沟通里优先追 Exact PN。', ask:['不要只问“64G 5600有没有”','客户给图片时优先看标签上的完整 PN'] },
    { cat:'产品基础', title:'Enterprise SSD：SATA / SAS / NVMe', tags:'ssd sata sas nvme enterprise u2 u3', body:'SATA 成熟、兼容广；SAS 常见于传统企业存储；NVMe 延迟更低、带宽更高，企业服务器常见 U.2/U.3 等形态。看到容量相同不代表可以互换，接口、form factor、耐久度和固件都要确认。', ask:['Exact PN','Interface / Form Factor','Capacity','DWPD / Endurance','New/Used、D/C、Warranty'] },
    { cat:'产品基础', title:'DWPD 是什么？', tags:'dwpd endurance ssd write drive writes per day', body:'DWPD = Drive Writes Per Day，表示在质保周期内每天允许把整盘写满多少次，是企业 SSD 耐久度的重要指标。不要把容量一样的 SSD 当成同档产品，高写入型和读密集型价格/用途可能明显不同。', ask:['客户应用是 Read Intensive 还是 Mixed/Write Intensive？','比较报价时确认 endurance 档位一致'] },
    { cat:'产品基础', title:'U.2 / U.3 是什么？', tags:'u.2 u2 u.3 u3 nvme form factor', body:'U.2/U.3 是企业级 2.5 英寸 SSD 常见连接/背板形态。做采购时不要因为外观相似就默认兼容，必须结合 PN、接口协议、服务器背板和平台支持判断。', ask:['Exact PN 优先','如果客户问替代料，再核平台兼容'] },
    { cat:'产品基础', title:'HDD：企业盘先确认什么？', tags:'hdd exos sas sata seagate fake', body:'企业 HDD 常见 SAS/SATA。HDD 风险点包括货源真实性、翻新/清零、标签与序列号、保修状态、实际 ownership。尤其陌生供应商给大批量高容量盘时，不要只看报价。', ask:['PN / Qty / D/C / Serial sample','Factory sealed?','Stock ownership / Location','实物图、视频、可验证序列号','Warranty / Traceability'] },
    { cat:'产品基础', title:'RTX 5090 与 RTX PRO 6000 不要混', tags:'gpu 5090 pro 6000 server workstation blackwell', body:'5090 属高端 GeForce 路线；RTX PRO 6000 属专业 GPU 路线。业务里“PRO 6000”还需要确认具体版本/形态与客户应用，不要只用“6000”三个字成交。', ask:['Exact model / PN','Server / workstation 使用场景','Qty / stock location','是否全新、包装、保修'] },
    { cat:'产品基础', title:'CPU：Tray / S-Spec / Stepping', tags:'cpu intel xeon tray sspec stepping', body:'Tray 通常指散装/托盘供货形态；S-Spec 是 Intel 处理器具体规格识别码之一；Stepping 是芯片修订版本。采购 CPU 时完整 Ordering Code、S-Spec、Stepping 能减少“型号看似一样、实际版本不同”的风险。', ask:['Ordering Code','S-Spec','Stepping','Original Intel Tray?','Factory-new?'] },
    { cat:'采购判断', title:'收到库存后，第一轮必须问什么？', tags:'采购 inventory stock checklist pn qty price', body:'不要一开始聊一大堆。第一轮先把能决定“值不值得继续”的信息拿到。', ask:['Exact PN','Qty','Condition / Packaging','Stock Location','Availability：现货还是 ETA','Best price / Incoterm','货是不是对方自己控制'] },
    { cat:'采购判断', title:'什么时候值得继续追供应商？', tags:'supplier qualify follow up stock', body:'优先追：PN 清楚、数量真实、价格有竞争力、库存位置明确、能提供证据、愿意视频/电话确认、公司实体可核验。若一直回避 PN/图片/位置/ownership，只发笼统 stock list，优先级应下降。', ask:['这个人是在卖自己的货，还是转第三手？','如果价格合适，我们能不能真正拿到货？'] },
    { cat:'客户判断', title:'SI / VAR / Distributor 怎么理解？', tags:'si var distributor customer type', body:'SI（System Integrator）做系统集成/项目交付，可能买服务器部件，也可能因 BOM 变化产生余料；VAR 在产品基础上提供方案/服务；Distributor 更偏渠道分销和库存流转。对 Ecore 来说，中型 SI/Server Builder 往往同时存在买货和释放库存的机会。', ask:['官网有没有 Server/HPC/AI/Storage 产品线？','联系人是 Procurement/Supply Chain/Operations 还是泛销售？'] },
    { cat:'客户判断', title:'哪些客户更值得优先开发？', tags:'priority customer hpc ai server builder cloud', body:'优先：Server Builder、HPC/AI Integrator、中型 Distributor/VAR、Cloud/Hosting、Datacenter 相关供应链角色。不是公司越大越好；你当前更需要能回复、能快速确认库存/需求、决策链不太长的账户。', ask:['匹配度高吗？','规模是否大到采购流程很难切入？','能不能找到具体采购/供应链人？'] },
    { cat:'风控', title:'新供应商快速风控', tags:'risk due diligence supplier brc trade reference domain address', body:'先核公司实体与交易主体，再核货。官网、域名邮箱、注册地址、LinkedIn 团队、公司注册信息应尽量相互对应。大额交易进一步看 Trade Reference、仓库/库存证据和付款条件。', ask:['公司名与收款主体一致吗？','邮箱域名与官网一致吗？','地址能否核验？','是否能给 Trade Reference？','库存证据是否对应本次 PN/Qty？'] },
    { cat:'风控', title:'库存真实性红旗', tags:'fake fraud stock red flag ownership', body:'红旗包括：价格明显脱离市场、所有热门型号都有、拒绝提供具体 PN/实物证据、库存地点反复变化、催促异常付款、公司主营与货物完全不匹配、报价像大范围群发但无法回答细节。', ask:['先验证，不因为“便宜”提高可信度','HDD/CPU/GPU 等高风险货尤其要看可追溯证据'] },
    { cat:'商务速查', title:'LinkedIn：没通过就别浪费时间记录', tags:'linkedin pending outreach crm', body:'连接申请发出后，在 CRM 点“LinkedIn 已发送 · 待接受”即可。不要复制发送文本，不要创建冗余跟进记录。对方真正接受/回复后，再进入下一层管理。', ask:['已发送 → 点状态 → 结束','真正回复 → 再写沟通备注和下一步'] },
    { cat:'商务速查', title:'客户回复后，CRM 只记什么？', tags:'reply notes next action crm', body:'只记影响下一步判断的信息，不做聊天全文备份。建议一句话记录：对方现在要什么/有什么 + 数量/价格/时间 + 下一步。', ask:['例：Has 200pcs, HK stock, price not confirmed; ask best EXW price tomorrow.'] },
    { cat:'商务速查', title:'报价/库存沟通的自然顺序', tags:'business conversation quote stock followup', body:'先确认事实，再谈价格，再谈交易条件。不要一上来连续抛十个问题。对方每回复一轮信息，再追最影响成交的 1–3 个问题。', ask:['第一层：PN / Qty / Location','第二层：Condition / Availability / Ownership','第三层：Price / Incoterm / Evidence / Payment'] },
    { cat:'市场信息', title:'市场信息怎么记才有用？', tags:'market ram ssd gpu price intelligence', body:'知识库不存“今天某型号多少钱”这种很快过期的孤立数字。市场信息应该记录：品类/PN、方向（涨/跌/紧缺/释放库存）、地区、来源日期、对采购或销售动作的影响。', ask:['信息日期是什么？','这条信息让我应该去买什么、卖什么、找哪个市场？'] },
  ];

  const categoryOrder = ['Ecore业务','产品基础','采购判断','客户判断','风控','商务速查','市场信息'];
  let active = '全部';
  let query = '';
  const nav = document.getElementById('knowledge-categories');
  const content = document.getElementById('knowledge-content');
  const search = document.getElementById('knowledge-search');

  function renderNav() {
    nav.innerHTML = ['全部', ...categoryOrder].map(cat => `<button class="knowledge-cat ${active === cat ? 'active' : ''}" data-cat="${cat}"><span>${cat}</span><b>${cat === '全部' ? articles.length : articles.filter(a=>a.cat===cat).length}</b></button>`).join('');
  }

  function render() {
    const q = query.trim().toLowerCase();
    const rows = articles.filter(a => (active === '全部' || a.cat === active) && (!q || `${a.cat} ${a.title} ${a.tags} ${a.body} ${a.ask.join(' ')}`.toLowerCase().includes(q)));
    content.innerHTML = rows.length ? `<div class="knowledge-count">${q ? `找到 ${rows.length} 条相关速查` : `${active === '全部' ? '全部' : active} · ${rows.length} 条`}</div><div class="knowledge-grid">${rows.map(a => `<article class="knowledge-card"><div class="knowledge-card-top"><span>${a.cat}</span></div><h2>${a.title}</h2><p>${a.body}</p><div class="knowledge-ask"><strong>工作时这样用</strong>${a.ask.map(x=>`<div>• ${x}</div>`).join('')}</div></article>`).join('')}</div>` : `<div class="knowledge-empty">没找到。先换一个更短的关键词，例如 PN、RDIMM、DWPD、GPU、风控。</div>`;
    renderNav();
  }

  nav.addEventListener('click', e => { const b=e.target.closest('[data-cat]'); if(!b)return; active=b.dataset.cat; render(); });
  search.addEventListener('input', e => { query=e.target.value; render(); });
  render();
})();
