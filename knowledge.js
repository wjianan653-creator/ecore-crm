(() => {
  const articles = [
    {cat:'公司与业务',title:'Ecore 到底做什么？',tags:'ecore 主营 buy sell surplus urgent hard to source',summary:'核心不是“卖某一个品牌”，而是围绕企业级服务器与 AI 基础设施器件做双向供应链：BUY 可追溯的项目余料/过剩库存；SUPPLY 客户急缺、难找的服务器部件。',biz:'先判断对方更像“能卖给我们”还是“会向我们买”，再决定切入点。',ask:['你们目前是有 excess / released stock，还是有 active requirement？','如果有具体项目，先给 Exact PN + Qty + Location。'],risk:'不要一上来同时讲买、卖、公司介绍、所有产品线；先围绕对方最可能有反应的一件事聊。'},
    {cat:'公司与业务',title:'我们重点看的产品',tags:'ram ssd hdd gpu cpu server enterprise',summary:'Server RAM、Enterprise SSD/HDD、High-End GPU、Server CPU。日常开发时优先判断是不是 enterprise / server grade，而不是消费级配件。',biz:'客户官网有 Server / HPC / AI / Storage / Cloud / Datacenter 线，通常比普通电子贸易公司更值得深入。',ask:['Exact PN 是什么？','数量、货况、位置、时间分别是什么？'],risk:'“64G 5600”“3.84TB SSD”“6000 GPU”都还不够精确，不能直接当成完整规格。'},
    {cat:'公司与业务',title:'Buy-from / Sell-to / Two-way',tags:'buy from sell to two way 客户方向',summary:'Buy-from = 我们向对方采购；Sell-to = 对方向我们采购；Two-way = 双向都有可能。',biz:'同一家 SI/Distributor 既可能买我们的急货，也可能释放项目余料，不要永久贴死标签。',ask:['这次具体机会是我们买还是我们卖？','下一步需要的是报价、库存证明还是需求确认？'],risk:'公司“理论上可双向”不等于当前机会双向，CRM 里以本次真实机会为准。'},

    {cat:'料号与缩写',title:'PN / Part Number',tags:'pn part number 料号 exact pn',summary:'PN 是具体料号，是硬件交易里最重要的识别信息之一。',biz:'容量、频率、品牌相同，也可能因为 PN 不同而不能直接替代。看到图片时优先找标签上的完整 PN。',ask:['Could you share the exact PN?','图片上的 PN 和报价单 PN 是否一致？'],risk:'不要只凭产品名称、容量或营销型号判断就是同一件货。'},
    {cat:'料号与缩写',title:'D/C / Date Code',tags:'dc date code production date 批次',summary:'D/C 一般指 Date Code，用来识别生产时间/批次。不同厂商标签写法可能不同。',biz:'做企业级 RAM、SSD、CPU、HDD 时，D/C 可以帮助判断批次、新旧程度及一批货是否一致。',ask:['What is the D/C?','同批货 D/C 是否一致或接近？'],risk:'D/C 不是唯一真伪判断依据，仍需结合标签、序列号、包装和来源。'},
    {cat:'料号与缩写',title:'COO / Country of Origin',tags:'coo country of origin 原产地',summary:'COO = Country of Origin，原产国/地区。',biz:'在报关、客户合规、供应链来源判断时可能会被问到。',ask:['COO 是哪里？','包装/标签/文件上的 COO 是否一致？'],risk:'不要把“库存所在地”当成 COO；Hong Kong stock 不代表 Hong Kong origin。'},
    {cat:'料号与缩写',title:'ETA / Lead Time',tags:'eta lead time availability delivery',summary:'ETA 通常表示预计到达时间；渠道报价里也常被用来表达“预计什么时候能到货/可交付”。Lead Time 是从确认到可交付所需时间。',biz:'“ETA 10–12 days”不等于现在就在对方仓库。',ask:['Is it physical stock now or incoming stock?','ETA 是到哪里？卖家仓库、香港还是最终交付地？'],risk:'把 ETA 货误认为现货，是采购判断里很常见的坑。'},
    {cat:'料号与缩写',title:'EXW',tags:'exw incoterm ex works 贸易条款',summary:'EXW = Ex Works，卖方通常在其场所/约定地点交货，后续提货、运输等责任更多由买方承担。',biz:'比较价格时必须连同 Incoterm 一起看；EXW 1070 和 delivered HK 1070 不是一个成本。',ask:['EXW location 是哪里？','提货、出口、运费由谁负责？'],risk:'只比较裸单价，不比较交付条款，会误判真正采购成本。'},
    {cat:'料号与缩写',title:'RMA / Warranty',tags:'rma warranty return 售后',summary:'RMA 是退换/返修授权流程；Warranty 是保修承诺。企业硬件交易里要确认“谁提供、多久、怎么执行”。',biz:'尤其 SSD/HDD/GPU/CPU，不要只听“有保修”，要知道是 manufacturer warranty 还是 seller warranty。',ask:['Warranty period? By manufacturer or seller?','RMA 发生时退到哪里、谁承担运费？'],risk:'“5 years warranty”如果没有主体、起算方式和执行路径，信息是不完整的。'},
    {cat:'料号与缩写',title:'Factory Sealed / New / Open Box',tags:'factory sealed new open box condition packaging',summary:'Factory Sealed 强调原厂封装/封签未开；New 只表示“全新”口径，未必等于原厂密封；Open Box 则通常包装已打开。',biz:'采购前把 Condition 和 Packaging 分开问，更容易避免双方理解不一致。',ask:['Factory sealed or new open box?','Original packaging? Any broken seals?'],risk:'“Brand new”不自动等于 factory sealed。'},
    {cat:'料号与缩写',title:'MOQ',tags:'moq minimum order quantity 最小起订量',summary:'MOQ = Minimum Order Quantity，最小起订量。',biz:'有些价格只有达到 MOQ 才成立；询价时要把价格和数量绑定看。',ask:['MOQ for this price?','如果数量提高，best price 能到多少？'],risk:'不要拿 1000pcs 的价格去推断 20pcs 也能成交。'},

    {cat:'RAM',title:'RDIMM 是什么？',tags:'ram rdimm registered ecc server memory',summary:'RDIMM = Registered DIMM，是服务器常见内存类型。',biz:'看到 DDR4/DDR5 + RDIMM / Registered / ECC，通常比普通 UDIMM 更贴近服务器业务。',ask:['Brand / Exact PN','Capacity / Speed / Qty','Condition / Packaging / Location'],risk:'RDIMM 和 UDIMM 不能因为容量、代际相同就默认可互换。'},
    {cat:'RAM',title:'ECC 是什么？',tags:'ecc error correcting code memory',summary:'ECC 是 Error-Correcting Code，用于检测并纠正部分内存错误，服务器内存里很常见。',biz:'“ECC”只是一个属性，不等于完整型号；还要看是否 Registered、容量、速度、PN。',ask:['Is it ECC RDIMM?','Exact PN?'],risk:'不要把“ECC 内存”当成一个统一产品。'},
    {cat:'RAM',title:'DDR5 5600 / 6400 怎么看？',tags:'ddr5 5600 6400 speed mt/s',summary:'5600、6400一般指 DDR5 的数据速率等级。',biz:'客户说“64G 5600”时，你已经知道了容量和速度，但仍缺 PN、品牌、rank/组织方式、数量与货况。',ask:['Exact PN please','Same batch / same D/C?'],risk:'同容量同频率仍可能不是同一料。'},
    {cat:'RAM',title:'容量不是完整规格',tags:'64g 96g 128g 256g capacity ram',summary:'64G/96G/128G/256G 只是单条容量。',biz:'真正采购至少组合看：Brand + Exact PN + Capacity + Speed + Qty + Condition。',ask:['请客户/供应商直接发标签图，通常比口头描述更快。'],risk:'“海力士 64G 5600 全新”依旧不够完整。'},

    {cat:'SSD / HDD',title:'SATA / SAS / NVMe',tags:'ssd sata sas nvme interface',summary:'SATA、SAS、NVMe 是不同接口/协议路线；企业存储里都很常见。',biz:'容量相同不代表能替代。接口、form factor、耐久度、固件与平台兼容都可能不同。',ask:['Exact PN','Interface / Form Factor','Capacity / Endurance'],risk:'“3.84TB SSD”远远不是完整规格。'},
    {cat:'SSD / HDD',title:'U.2 / U.3',tags:'u2 u.2 u3 u.3 nvme form factor',summary:'U.2/U.3 常见于企业级 2.5 英寸 NVMe SSD 连接/背板形态。',biz:'外观看起来像普通 2.5 英寸盘，也不代表接口/兼容性相同。',ask:['Exact PN','Server/backplane compatibility if replacement is requested'],risk:'替代料一定要核平台兼容，不要只看外形。'},
    {cat:'SSD / HDD',title:'DWPD',tags:'dwpd drive writes per day endurance',summary:'DWPD = Drive Writes Per Day，衡量 SSD 在保修周期内的写入耐久度。',biz:'同容量 SSD 可能因为 Read Intensive / Mixed Use / Write Intensive 定位不同而价值差很多。',ask:['DWPD / endurance rating?','客户应用是读密集还是写密集？'],risk:'比较两个 SSD 报价时，如果 endurance 档位不同，不能只比容量和价格。'},
    {cat:'SSD / HDD',title:'企业 SSD 的 OEM 固件',tags:'oem firmware dell hp lenovo samsung micron ssd',summary:'同一底层硬件可能存在不同 OEM 固件/标签版本。',biz:'客户如果指定 Dell/HPE/Lenovo 等系统环境，不能只凭 NAND/主控或容量判断可替代。',ask:['Exact OEM PN?','Generic or OEM firmware?'],risk:'“原厂品牌一样”不代表 OEM 系统一定识别。'},
    {cat:'SSD / HDD',title:'HDD 第一轮怎么验',tags:'hdd sas sata exos serial smart warranty',summary:'企业 HDD 常见 SAS/SATA，高容量盘尤其要重视序列号、保修、翻新/清零、ownership。',biz:'陌生供应商给大批高容量盘时，先验证“货是不是真的在、是不是他的、是不是描述的 condition”。',ask:['Exact PN / Qty / D/C','Serial sample / warranty check','Stock photo/video / location / ownership'],risk:'报价便宜、热门型号齐全、但不给序列号和实物证据，是明显红旗。'},

    {cat:'GPU / CPU',title:'RTX 5090 与 RTX PRO 6000',tags:'gpu rtx 5090 pro 6000 workstation server',summary:'5090 偏高端 GeForce 路线；RTX PRO 6000 属专业产品线。实际交易必须确认完整型号、版本/形态与应用场景。',biz:'客户说“6000”或“Pro 6000”时先确认具体版本，不要直接默认就是你们要的那一款。',ask:['Exact model / PN','Server or workstation use?','Qty / Location / Condition / Warranty'],risk:'营销名称接近，不代表产品形态和客户用途一致。'},
    {cat:'GPU / CPU',title:'GPU 现货最先确认什么？',tags:'gpu stock sourcing 5090 pro 6000',summary:'GPU 高价值、价格波动快，第一轮最重要的是确认真实库存与可交付性。',biz:'先把 Qty、Location、Condition、Ownership、Evidence、Price 问清，再谈大批量。',ask:['Physical stock now?','Can you share timestamped photos / serial samples?'],risk:'只给 stock list、不肯验证 ownership 的货不要快速推进付款。'},
    {cat:'GPU / CPU',title:'CPU：Ordering Code / S-Spec / Stepping',tags:'cpu intel xeon ordering code sspec stepping',summary:'Ordering Code、S-Spec、Stepping 都可以帮助识别更具体的 CPU 版本。',biz:'服务器 CPU 采购时，不要只看“Xeon 6767P”这种市场型号。',ask:['Ordering Code','S-Spec','Stepping','Original tray / factory-new?'],risk:'型号相同但具体 revision/包装状态不一致，可能影响客户接受。'},
    {cat:'GPU / CPU',title:'Tray 是什么？',tags:'tray cpu original tray packaging',summary:'Tray 通常指托盘/散装供货形态，与零售盒装不同。',biz:'“Original Intel Tray”既涉及包装形态，也涉及来源真实性，需要结合标签、批次和供应链证据看。',ask:['Original tray?','Factory-new or pulled?','D/C and label photo?'],risk:'Tray 不等于二手，但也不能仅凭“tray”判断全新。'},

    {cat:'采购判断',title:'收到库存：第一轮 7 问',tags:'inventory stock sourcing checklist first questions',summary:'目标不是一次问完所有资料，而是快速判断值不值得继续。',biz:'先抓最影响成交的 7 个信息。',ask:['1. Exact PN','2. Qty','3. Condition / Packaging','4. Physical stock or ETA','5. Location','6. Best price + Incoterm','7. Ownership / evidence'],risk:'第一轮就丢十几二十个问题，会降低对方回复率。'},
    {cat:'采购判断',title:'Physical Stock vs Incoming Stock',tags:'physical stock incoming eta inventory',summary:'Physical Stock = 实际已经在仓/可验证；Incoming = 在途或预计到货。',biz:'这两个状态对价格、可交付性和风险判断完全不同。',ask:['Is it physical stock now?','Can it be inspected / picked up?'],risk:'“Available”这个词本身不够，要追问 available now 还是 incoming。'},
    {cat:'采购判断',title:'Ownership 为什么重要？',tags:'ownership stock owner broker middleman',summary:'Ownership 是确认货到底由谁控制。供应商能报价，不代表他实际拥有或控制货。',biz:'越多层转手，价格、库存真实性、响应速度和交易风险通常越难控制。',ask:['Is this your own stock?','Can you arrange inspection / pickup directly?'],risk:'如果对方每个细节都要“问上家”，大概率不是一手库存。'},
    {cat:'采购判断',title:'什么时候值得继续追供应商？',tags:'supplier priority qualify follow up',summary:'PN 清楚、货真实、价格有竞争力、库存位置明确、能提供证据、公司实体可核验，这类供应商才值得投入时间。',biz:'给每个供应商按“货的真实性 + 价格 + 响应 + 公司可信度”综合看，不按聊天热情判断。',ask:['如果价格合适，我们能不能真正拿到货？','这批货有没有足够证据支持交易？'],risk:'回复很快、说话很热情，不等于供应链质量高。'},
    {cat:'采购判断',title:'报价怎么比较才公平？',tags:'price compare incoterm landed cost quote',summary:'比较报价不能只看 Unit Price，要一起看 Qty、Condition、Location、Incoterm、Lead Time、Warranty、付款条件。',biz:'真正该比较的是“同规格、同条件下的可成交成本”。',ask:['Same PN? Same condition? Same delivery term?'],risk:'EXW、FOB、Delivered HK 混着比较，结论会失真。'},

    {cat:'客户开发',title:'SI / System Integrator',tags:'si system integrator 客户类型',summary:'SI 做系统集成/项目交付，常采购服务器、内存、SSD、GPU，也可能因 BOM/项目变化产生余料。',biz:'对 Ecore 来说通常是很值得开发的一类，因为既可能买也可能卖。',ask:['官网是否有 Server / HPC / AI / Storage 项目？','找 Procurement / Supply Chain / Operations，而不只找 Sales。'],risk:'大型 SI 决策链可能很长；中型 SI 往往更适合追求真实回复和快速机会。'},
    {cat:'客户开发',title:'Distributor',tags:'distributor channel distribution 客户类型',summary:'Distributor 以渠道分销和库存流转为核心。',biz:'通常库存意识强、报价快，但也更懂市场价格，利润空间和竞争会更直接。',ask:['他们是授权分销、独立分销还是广泛贸易？','有没有服务器/enterprise component 专线？'],risk:'“Distributor”三个字不自动等于优质货源，仍要核库存 ownership 和公司实体。'},
    {cat:'客户开发',title:'VAR',tags:'var value added reseller 客户类型',summary:'VAR = Value Added Reseller，在硬件基础上增加方案、集成、服务后再销售。',biz:'可能有项目型需求，也可能出现配置变更和 spare stock。',ask:['他们卖整机方案还是部件也单独采购？','哪些品牌/平台是主力？'],risk:'只找销售人员可能得到客户项目线索，但不一定拿得到采购/库存信息。'},
    {cat:'客户开发',title:'OEM / ODM',tags:'oem odm manufacturer 客户类型',summary:'OEM/ODM 通常参与品牌制造、设计或生产，供应链体系相对正式。',biz:'量可能大，但供应商准入、合规和账期流程也往往更复杂。',ask:['是否接受独立渠道/spot buy？','谁负责 commodity / procurement / excess inventory？'],risk:'不要把“大公司”自动等同于“本周容易出单”。'},
    {cat:'客户开发',title:'Cloud / Datacenter / HPC AI',tags:'cloud datacenter hpc ai customer priority',summary:'这类终端/集成生态对高容量 RAM、Enterprise SSD、GPU、CPU 的需求匹配度高。',biz:'但真正能触达的往往不是泛 IT 人员，而是 Infrastructure / Procurement / Supply Chain / Hardware 相关角色。',ask:['他们自建硬件还是通过 SI/VAR 采购？','当前是扩容、刷新还是新项目？'],risk:'技术匹配度高，不等于联系人回复率高；职位和切入点仍然决定效率。'},
    {cat:'客户开发',title:'什么样的账户优先级最高？',tags:'priority account scoring reply decision',summary:'不是规模越大越好。你当前更需要“业务匹配 + 决策链较短 + 能找到具体人 + 有真实库存/需求信号”的账户。',biz:'中型 Server Builder、HPC/AI Integrator、专业 Distributor/VAR 往往比超大型品牌更适合高频开发。',ask:['匹配度？联系人？真实信号？回复可能性？'],risk:'只因为公司很知名就投入大量时间，容易导致开发效率低。'},

    {cat:'风控与交易',title:'新供应商 5 项快速核验',tags:'risk due diligence supplier company verification',summary:'先核“人和公司”，再核“货”。',biz:'最低限度看公司实体、官网/域名、地址、团队/业务一致性、交易主体。',ask:['公司名与收款主体一致？','域名邮箱与官网一致？','注册地址/仓库可核？','主营与所卖产品合理？','能否提供 Trade Reference / 库存证据？'],risk:'网页做得漂亮不等于公司可靠；必须做交叉验证。'},
    {cat:'风控与交易',title:'库存真实性红旗',tags:'fraud fake stock red flag scam',summary:'低价不是证据，库存清单也不是证据。',biz:'重点观察信息是否可验证、是否前后一致、是否能落到具体 PN/Qty/Location。',ask:['实物图/视频？','序列号 sample？','仓库地点？','可否 inspection/pickup？'],risk:'所有热门料都有、价格异常低、拒绝验证、库存地点变化、催款异常——优先降级。'},
    {cat:'风控与交易',title:'Trade Reference 有什么用？',tags:'trade reference credit verification company',summary:'Trade Reference 是其他交易伙伴提供的商业往来参考，可辅助验证公司交易历史。',biz:'适合陌生公司、大额首次交易时作为辅助证据。',ask:['Reference company / contact / relationship duration?'],risk:'Trade Reference 不是绝对担保；仍要核付款主体和货本身。'},
    {cat:'风控与交易',title:'付款前最后检查',tags:'payment checklist bank account invoice risk',summary:'付款前把公司、货、合同/PI、银行信息和交付条件再对一遍。',biz:'尤其首次合作，不要因为“价格马上失效”跳过核验。',ask:['PI company = verified entity?','Bank beneficiary = agreed entity?','PN/Qty/Condition/Incoterm 写清？','Evidence 已核？'],risk:'临时更换收款账户、第三方个人账户、极端催付款都需要提高警惕。'},
    {cat:'风控与交易',title:'Warranty / RMA 要写清',tags:'warranty rma after sales 售后 退货',summary:'售后不是一句“有保修”就结束，要明确期限、主体、条件、地点和流程。',biz:'客户或供应商一旦有争议，真正起作用的是可执行的书面条款。',ask:['Warranty by whom?','Start date?','RMA destination and freight?'],risk:'口头承诺与 PI/合同不一致时，以正式文件为准。'},

    {cat:'商务沟通',title:'LinkedIn 没通过：CRM 怎么记？',tags:'linkedin pending no reply crm',summary:'只记“LinkedIn 已发送 · 待接受”。',biz:'这类情况占比高，不应该消耗你的记录时间。',ask:['点一次状态 → 保存 → 结束。'],risk:'不要复制发送文本，不要为了“完整”创建无意义沟通摘要和跟进任务。'},
    {cat:'商务沟通',title:'客户真正回复后只记 1 句话',tags:'reply note crm summary',summary:'CRM 不做聊天全文备份，只记影响下一步的信息。',biz:'最好结构：对方有什么/要什么 + Qty/Price/Timing + 下一步。',ask:['例：Has 200pcs HK stock, price pending; ask best EXW tomorrow.'],risk:'长篇复制聊天记录会让 CRM 变成“存档库”，反而难看重点。'},
    {cat:'商务沟通',title:'询库存的自然顺序',tags:'conversation sourcing questions order',summary:'先事实、再价格、再交易条件，不要一口气审问。',biz:'对方每回复一轮，再追最影响成交的 1–3 个问题。',ask:['第一轮：PN / Qty / Location','第二轮：Condition / Availability / Ownership','第三轮：Price / Incoterm / Evidence / Payment'],risk:'问题过多会显著降低回复率，尤其刚建立联系时。'},
    {cat:'商务沟通',title:'什么时候才值得设跟进任务？',tags:'follow up task crm reminder priority',summary:'不是每一个“已发送”都值得自动提醒。',biz:'真正值得设任务：已回复、报价待确认、有库存待验证、有价格待审批、有明确日期节点。',ask:['下一次动作是什么？','哪一天不跟就可能丢机会？'],risk:'给所有 LinkedIn Pending 自动建任务，会让任务列表迅速失去价值。'},
    {cat:'商务沟通',title:'市场信息怎么记才有用？',tags:'market intelligence ram ssd gpu price trend',summary:'不要只存一个会过期的价格数字，要存“时间 + PN/品类 + 地区 + 方向 + 对行动的影响”。',biz:'好的市场情报最终要回答：现在该找什么货、去哪里找、卖给谁。',ask:['信息日期？','涨/跌/紧缺/释放库存？','对采购/销售动作有什么影响？'],risk:'没有日期和来源背景的价格，几周后几乎没有参考价值。'},
  ];

  const categoryOrder = ['公司与业务','料号与缩写','RAM','SSD / HDD','GPU / CPU','采购判断','客户开发','风控与交易','商务沟通'];
  const scenarios = [
    ['收到一批库存', '采购判断'],
    ['看不懂缩写', '料号与缩写'],
    ['判断客户类型', '客户开发'],
    ['担心供应商不靠谱', '风控与交易'],
    ['查 RAM', 'RAM'],
    ['查 SSD / HDD', 'SSD / HDD'],
    ['查 GPU / CPU', 'GPU / CPU'],
    ['怎么记 CRM', '商务沟通'],
  ];

  let active = '全部';
  let query = '';
  const nav = document.getElementById('knowledge-categories');
  const content = document.getElementById('knowledge-content');
  const search = document.getElementById('knowledge-search');
  const scenarioBox = document.getElementById('knowledge-scenarios');

  function renderNav() {
    nav.innerHTML = ['全部', ...categoryOrder].map(cat => `<button class="knowledge-cat ${active === cat ? 'active' : ''}" data-cat="${cat}"><span>${cat}</span><b>${cat === '全部' ? articles.length : articles.filter(a=>a.cat===cat).length}</b></button>`).join('');
  }

  function renderScenarios() {
    scenarioBox.innerHTML = scenarios.map(([label,cat]) => `<button type="button" data-scenario="${cat}">${label}</button>`).join('');
  }

  function render() {
    const q = query.trim().toLowerCase();
    const rows = articles.filter(a => (active === '全部' || a.cat === active) && (!q || `${a.cat} ${a.title} ${a.tags} ${a.summary} ${a.biz} ${a.ask.join(' ')} ${a.risk}`.toLowerCase().includes(q)));
    content.innerHTML = rows.length ? `<div class="knowledge-count">${q ? `找到 ${rows.length} 条相关速查` : `${active === '全部' ? '全部知识' : active} · ${rows.length} 条`}</div><div class="knowledge-grid">${rows.map(a => `<article class="knowledge-card"><div class="knowledge-card-top"><span>${a.cat}</span><em>30 秒速查</em></div><h2>${a.title}</h2><p>${a.summary}</p><div class="knowledge-section"><strong>业务上怎么看</strong><div>${a.biz}</div></div><div class="knowledge-section"><strong>下一步 / 必问</strong>${a.ask.map(x=>`<div>• ${x}</div>`).join('')}</div><div class="knowledge-section risk"><strong>别踩坑</strong><div>${a.risk}</div></div></article>`).join('')}</div>` : `<div class="knowledge-empty">没找到。换一个更短的关键词，例如 PN、D/C、EXW、RDIMM、DWPD、库存、RMA。</div>`;
    renderNav();
  }

  nav.addEventListener('click', e => { const b=e.target.closest('[data-cat]'); if(!b)return; active=b.dataset.cat; query=''; search.value=''; render(); });
  scenarioBox.addEventListener('click', e => { const b=e.target.closest('[data-scenario]'); if(!b)return; active=b.dataset.scenario; query=''; search.value=''; render(); window.scrollTo({top:0,behavior:'smooth'}); });
  search.addEventListener('input', e => { query=e.target.value; active='全部'; render(); });
  renderScenarios();
  render();
})();
