async function draft(req,env){const b=await req.json();const prompt=`당신은 한국어 전문 문서 작성자입니다. 문서 유형은 ${b.type}, 분야는 ${b.domain}, 주제는 ${b.title||'새로운 전문 주제'}입니다. 추가 작성 지시사항: ${String(b.instruction||'').slice(0,3000)}. 공백 포함 반드시 2,000자 이상 3,500자 이하의 전문적인 문서를 작성하세요. 확인되지 않은 사실과 허위 통계는 만들지 마세요. 독자가 실제로 활용할 수 있도록 배경, 핵심 분석, 사례, 실행 방법, 주의점, 결론을 포함하세요. 기사라면 제목과 리드문을 포함하고, 보고서라면 분석과 시사점을 포함하며, 보도자료라면 발표 메시지와 인용문을 포함하고, 사업계획서라면 문제·해결책·시장·수익모델·실행계획을 포함하세요. JSON만 반환하세요. {"title":"제목","body":"2,000자 이상 본문","summary":"150자 요약","outline":"목차 5개","keywords":"키워드 7개"}`;if(!env.GEMINI_API_KEY)return j({ok:false,error:'Gemini API 키가 Worker Secret에 등록되지 않았습니다.'},503);let res,data;const payload={contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.6,responseMimeType:'application/json'}};for(const model of ['gemini-3.5-flash','gemini-3.8-flash','gemini-2.5-flash','gemini-2.0-flash']){res=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:JSON.stringify(payload)});if(res.ok){data=await res.json();break}}if(!res||!res.ok)return j({ok:false,error:'Gemini API 응답 오류'},502);const d=data;const text=d.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'{}';const draft=JSON.parse(text.replace(/^```json\s*/,'').replace(/\s*```$/,'')); if(typeof draft.body!=='string'||[...draft.body.trim()].length<=2000)return j({error:'본문이 2,000자를 넘지 않았습니다. 다시 생성해 주세요.'},502); return j({ok:true,...draft})}
const types=['기사','보고서','보도자료','사업계획서'];
const domains=['경제','금융','IT·AI','산업·에너지','부동산·건설','정치·국제','기업·경영','사회·문화','과학·환경','법률','마케팅'];
const e=(s='')=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const j=(x,status=200)=>Response.json(x,{status});
const html=(s,status=200)=>new Response(s,{status,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
const redirect=path=>new Response(null,{status:303,headers:{location:path}});
const urlFor=d=>'/market/document/'+encodeURIComponent(d.slug);
function mediaRecord(d){
 try{const value=JSON.parse(d?.image_key||'[]');return Array.isArray(value)?{images:value}:value||{}}
 catch{return {}}
}
const images=d=>mediaRecord(d).images||[];
function sourceUrls(value){
 return String(value||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean).slice(0,12).map(line=>{
  try{const url=new URL(line);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:''}catch{return ''}
 }).filter(Boolean);
}
const list=(db,sql,...args)=>db.prepare(sql).bind(...args).all().then(r=>r.results);
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const run=(db,sql,...args)=>db.prepare(sql).bind(...args).run();
function navigation(me,active){
 const links=[['/','홈'],['/market','공개마켓'],['/write','새 문서'],['/prompts','프롬프트'],['/archive','내 보관함']];
 return `<header class="site-header"><a class="brand" href="/"><span class="brand-mark">8</span> HUB STUDIO</a><nav class="site-nav" aria-label="주 메뉴">${links.map(([href,label])=>`<a href="${href}"${active===href?' aria-current="page"':''}>${label}</a>`).join('')}</nav><a class="login-state" href="/login">${me?`<span aria-hidden="true"></span>로그인됨${me.name?' · '+e(me.name):''}`:'로그인'}</a></header>`;
}
function page(title,body,{canonical='',description='',schema=null,image='',me=null,active='',searchTitle=title,articleMeta=false}={}){
 const metadata=canonical?`<link rel="canonical" href="${e(canonical)}"><meta name="description" content="${e(description)}"><meta property="og:title" content="${e(searchTitle)}"><meta property="og:type" content="${articleMeta?'article':'website'}"><meta name="robots" content="max-image-preview:large"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${e(canonical)}"><meta name="twitter:card" content="summary_large_image">${image?`<meta property="og:image" content="${e(image)}">`:''}`:'<meta name="robots" content="noindex">';
 return html(`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${e(searchTitle)} · 허브스튜디오8</title>${metadata}<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" crossorigin>${schema?`<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`:''}<style>
*{box-sizing:border-box}body{margin:0;background:#f7f6f1;color:#172925;font:16px/1.7 system-ui,sans-serif;word-break:keep-all;overflow-wrap:anywhere}a{color:inherit}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #b17742;outline-offset:3px}header,footer{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:16px max(5vw,16px);border-bottom:1px solid #dedfd5;background:#fffdf8}footer{border:0;border-top:1px solid #dedfd5}header a,footer a{text-decoration:none}nav,.actions{display:flex;gap:16px;flex-wrap:wrap;align-items:center}.brand{font-weight:850;letter-spacing:.05em;display:flex;align-items:center;gap:12px}.brand-mark{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:#183f34;color:#fff}.actions form{margin:0}main{max-width:1210px;margin:auto;padding:36px 24px 72px;min-height:74vh}h1{font-size:clamp(29px,4vw,46px);line-height:1.17;letter-spacing:-.045em;margin:.25em 0}h2{font-size:clamp(20px,2vw,26px);line-height:1.35;letter-spacing:-.035em}p{max-width:70ch}.hero{display:flex;justify-content:space-between;align-items:center;gap:28px;background:radial-gradient(ellipse at top right,#36644d,#15382f 65%);color:#fffdf3;padding:clamp(24px,4vw,48px);border-radius:22px;margin-bottom:38px}.hero p{color:#e1e9df}.hero .button{background:#e5eece;color:#18382b}.hero .secondary{background:transparent;color:white;border-color:#a5b8aa}.eyebrow,.category{font-size:14px;font-weight:750;letter-spacing:.04em}.eyebrow{color:#d5e6b2}.category{color:#28604c}.featured{width:min(42%,395px);color:#172925}.featured .card-cover{aspect-ratio:2/1}.featured .card-info p{display:none}.section-head{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:8px 0 16px}.section-head span,.muted,time{color:#526557;font-size:14px}.chips{gap:9px;margin-bottom:16px}.chip{border:1px solid #cdd6cb;border-radius:100px;padding:6px 14px;background:#fffdf8;text-decoration:none}.chip[aria-current]{background:#214d3e;color:#fff}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.card,.panel{background:#fffdf9;border:1px solid #d9e1d8;border-radius:15px}.panel{padding:20px;margin:16px 0}.card{display:flex;flex-direction:column;overflow:hidden;text-decoration:none;box-shadow:0 8px 22px #183c2e0c;transition:box-shadow .18s,border-color .18s}.card:hover{border-color:#668c73;box-shadow:0 12px 26px #183c2e21}.card-cover{aspect-ratio:2.14/1;background:#203e35}.card img,.cover{width:100%;height:100%;object-fit:cover;display:block}.type-cover{height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:20px 24px;color:#f5efdc;background:repeating-linear-gradient(130deg,transparent 0 35px,#ffffff10 36px 37px),linear-gradient(135deg,#1c3b2e,#456b58)}.type-cover strong{font-family:Georgia,serif;font-size:clamp(21px,3vw,40px)}.card-info{padding:18px 22px;display:flex;flex-direction:column;flex:1}.card-info h2{margin:8px 0}.card-info p{margin:0 0 16px;color:#45594e;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.card-foot{display:flex;justify-content:space-between;gap:12px;margin-top:auto;padding-top:10px;border-top:1px solid #dde3dc}.card-foot span{font-weight:700;color:#245a42}.search{display:grid;grid-template-columns:2fr 1fr auto;gap:10px;margin-bottom:22px}button,.button{display:inline-block;border:1px solid #214d3e;background:#214d3e;color:white;border-radius:9px;padding:9px 15px;font:inherit;font-weight:650;cursor:pointer;text-decoration:none;min-height:44px}.secondary{background:#fffdf9;color:#214d3e}.danger{color:#9d233a;background:#fffdf9;border-color:#b9848d}label{display:block;font-weight:650;margin-top:12px}input,select,textarea{display:block;width:100%;font:inherit;padding:10px;border:1px solid #b4c3b7;border-radius:8px;background:white;color:#172925}textarea{min-height:320px}.article{max-width:920px;margin:18px auto 28px;background:#fffdf9;border:1px solid #dce4da;padding:clamp(18px,4vw,52px);border-radius:18px}.article h1{font-size:clamp(26px,3.4vw,39px);margin-bottom:20px}.article-body{max-width:70ch;margin:26px auto}.article p{white-space:pre-wrap;font-size:17px;line-height:1.85}.article h2{margin-top:1.5em}.article .cover{height:auto;aspect-ratio:16/9;border-radius:11px}.article figure{margin:24px 0}.thumb{width:180px;max-width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:8px}.breadcrumb,.review-bar{max-width:920px;margin:0 auto;color:#315744}.archive-item h2{margin:.4em 0 .65em}.actionrow{margin-top:16px}.auth{max-width:480px;margin:35px auto}.error{color:#9d233a}button:disabled{opacity:.6}@media(max-width:680px){main{padding:22px 14px 48px}.hero{display:block}.featured{margin-top:20px;width:100%}.grid{grid-template-columns:1fr}.search{grid-template-columns:1fr auto}.search input:not([type=hidden]){grid-column:1/-1}header nav{gap:12px}}
.site-header{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:12px;padding:12px max(4vw,16px)}.site-header .brand{justify-self:start;font-size:14px;white-space:nowrap}.site-nav{display:flex;justify-content:center;gap:6px;font-size:14px}.site-nav a,.login-state{padding:8px 12px;border:1px solid #dbe2d8;border-radius:9px;background:#fffdf9;font-weight:650}.site-nav a:hover,.site-nav a[aria-current]{background:#214d3e;color:white;border-color:#214d3e}.login-state{justify-self:end;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px}.login-state span{display:inline-block;width:7px;height:7px;border-radius:50%;background:#39774e;margin-right:7px}.grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.card-info{padding:14px 16px}.card-info h2,.archive-item h2{font-size:18px;line-height:1.42}.card-info p{font-size:15px;line-height:1.56;-webkit-line-clamp:2}.card-foot{font-size:14px}.hero h1{font-size:clamp(26px,3vw,37px)}main>h1,.section-head h1{font-size:clamp(25px,3vw,33px)}.archive-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.archive-item{padding:0;overflow:hidden;margin:0;box-shadow:0 8px 22px #183c2e0c}.archive-thumb{width:100%;height:135px;object-fit:cover;display:block}.archive-content{padding:18px}.state{background:#f0eee4;color:#624b26;padding:4px 8px;border-radius:5px;font-size:13px;font-weight:750;margin-right:8px}.state-published{background:#e5f1e7;color:#22543a}.state-deleted{background:#f5e5e9;color:#8a2743}.archive-actions{border-top:1px solid #dce4da;padding-top:12px;gap:8px}.archive-actions .button,.archive-actions button,.editor-grid button{font-size:14px}.editor-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,31%);gap:16px;align-items:start}.editor-grid label,.editor-grid input,.editor-grid select{font-size:14px}.editor-grid input[type=file]{padding:7px}.editor-grid textarea{font-size:16px;line-height:1.75}.field-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.writing-tools{margin-top:14px}.media-panel h2{font-size:18px;margin-top:0}.media-panel fieldset{min-width:0;padding:12px}.article{border-top:4px solid #214d3e}.article h1{font-size:clamp(24px,3vw,34px);text-wrap:balance}.article .dek{font-size:16px;color:#526557;margin:0 0 22px}.article-body{max-width:66ch}.article .cover{aspect-ratio:2/1}.breadcrumb{font-size:14px}.review-bar .button{font-size:14px}@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:740px){.site-header{grid-template-columns:1fr 1fr}.site-nav{grid-column:1/-1;grid-row:2}.editor-grid,.archive-grid{grid-template-columns:1fr}}@media(max-width:560px){.grid{grid-template-columns:1fr}.site-nav a{padding:6px 9px}}
.site-header{padding-block:9px}.site-nav{gap:5px}.site-nav a,.login-state{font-size:13px;padding:5px 9px;border-radius:7px}.brand-mark{width:29px;height:29px}main>h1,.section-head h1{font-size:clamp(22px,2.1vw,26px)}.archive-item h2{font-size:16px}.archive-actions .button,.archive-actions button{font-size:13px;padding:6px 10px;min-height:36px}.editor-grid{grid-template-columns:minmax(0,1fr) minmax(250px,28%)}.writing-panel,.media-panel{background:#fff;border-color:#dde4db;box-shadow:0 8px 24px #162c2010}.writing-panel h2,.media-panel h2{font-size:16px;margin:0 0 10px}.writing-panel label,.media-panel label{font-size:13px;color:#314637}.editor-grid input,.editor-grid select,.editor-grid textarea{margin-top:4px;background:#fbfcfa;border-color:#cdd9cf}.editor-grid textarea{min-height:270px;resize:vertical}.editor-grid input::file-selector-button{background:#eaf0e8;color:#244b38;border:0;border-radius:5px;padding:5px 7px;margin-right:8px}.image-slot{border-top:1px solid #e1e8df;padding:9px 0;font-size:14px}.image-slot summary{cursor:pointer;font-weight:650}.image-slot img{margin-top:8px}.media-panel .muted{font-size:13px}.studio-hero{display:grid;grid-template-columns:minmax(0,1.28fr) minmax(0,.72fr);align-items:center;gap:clamp(24px,5vw,66px);padding:clamp(26px,5vw,64px);min-height:350px;border-radius:20px;background:radial-gradient(ellipse at 92% 10%,#47745a,#173b31 58%,#102e27);color:#fffdf8;overflow:hidden}.studio-kicker,.preview-label{font-size:13px;font-weight:750;letter-spacing:.07em;color:#d3e6ba}.studio-hero h1{font-size:clamp(32px,4.4vw,56px);line-height:1.13;margin:13px 0 16px}.studio-hero p{color:#e0ebde;margin:0 0 24px}.studio-hero .button{background:#dcebc7;color:#163a2b;border-color:#dcebc7;font-size:14px}.studio-hero .secondary{background:transparent;color:#fff;border-color:#91aa96}.hero-preview{padding:14px;border:1px solid #ffffff42;border-radius:16px;background:#ffffff14;color:#172925}.hero-preview .card{margin-top:8px}.hero-preview .card-cover{aspect-ratio:2.65/1}.hero-preview .card-info p{display:none}.hero-preview .card-info h2{font-size:16px}.formats{display:grid;gap:9px;color:white}.formats span{padding:5px 10px;background:#ffffff19;border-radius:6px}.studio-guide{margin:34px 0 42px}.studio-guide h2{font-size:22px}.guide-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.guide-grid>div{padding:16px 18px;background:#fffdf9;border:1px solid #d9e1d8;border-top:3px solid #537b60;border-radius:10px}.guide-grid h3{font-size:16px;margin:0 0 5px}.guide-grid p{font-size:15px;margin:0;color:#45594e}@media(max-width:740px){.studio-hero,.guide-grid,.editor-grid{grid-template-columns:1fr}.studio-guide{margin:24px 0 32px}}
body{font-family:"Pretendard Variable",Pretendard,system-ui,sans-serif;font-size:15px}input,textarea,select,button,input::file-selector-button{font-family:inherit}.site-nav,.site-nav a,.login-state,.chip,.button,button,.search input,.search select{font-size:14px}.site-nav a,.login-state{padding:5px 10px}.studio-hero h1{font-size:clamp(28px,4vw,42px);font-weight:760}.studio-hero p,.guide-grid p{font-size:15px}main>h1,.section-head h1,.hero h1{font-size:clamp(23px,3vw,30px)}h2,.studio-guide h2{font-size:21px}.card-info h2,.archive-item h2,.hero-preview .card-info h2{font-size:17px;line-height:1.45}.card-info p{font-size:14px}.type-cover strong{font-family:inherit;font-size:clamp(22px,3vw,32px)}.article h1{font-size:clamp(25px,3vw,31px)}.article p{font-size:16px}.article .dek{font-size:15px}.editor-grid textarea{font-size:15px}.auth h1{font-size:26px}.studio-footer{display:block;padding:0;border:0;background:#172423;color:#eef4ee}.footer-main,.footer-base>div{max-width:1210px;margin:auto;padding-inline:24px}.footer-main{display:grid;grid-template-columns:2fr 1fr 1fr;gap:28px;padding-block:32px}.footer-main a{display:block;width:fit-content;font-size:14px;color:#c5d3ca;margin-bottom:6px}.footer-main a:hover{text-decoration:underline;color:white}.footer-main .footer-brand{font-size:17px;font-weight:800;color:white;letter-spacing:.035em}.footer-main h2{font-size:14px;margin:0 0 10px}.footer-main p{margin:8px 0 0;font-size:14px;color:#c5d3ca}.footer-base{background:#0f1b1a;color:#b4c5ba;border-top:1px solid #2e3e36;font-size:13px}.footer-base>div{padding-block:12px}@media(max-width:560px){.footer-main{grid-template-columns:1fr 1fr;gap:18px}.footer-main>div:first-child{grid-column:1/-1}.site-nav a{padding:5px 8px}}
.workspace{max-width:1040px}.workspace-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid #dde4db;padding-bottom:11px;margin-bottom:14px;color:#234638}.workspace-heading h1{margin:0;font-size:19px;font-weight:750;letter-spacing:-.035em}.workspace-heading h1 span{font-size:12px;font-weight:600;color:#526557;margin-left:7px}.workspace-heading>a{font-size:13px}.workspace .button,.workspace button{font-size:13px;padding:5px 9px;min-height:34px}.workspace .editor-grid{gap:12px;grid-template-columns:minmax(0,1fr) minmax(220px,27%)}.workspace .editor-grid .panel{margin:0;padding:14px;border-radius:9px;box-shadow:none}.workspace .writing-panel h2,.workspace .media-panel h2{font-size:14px}.workspace .editor-grid label,.workspace .editor-grid input,.workspace .editor-grid select,.workspace .image-slot{font-size:13px}.workspace .editor-grid label{margin-top:8px}.workspace .editor-grid input,.workspace .editor-grid select{padding:6px 8px}.workspace .editor-grid textarea{font-size:14px;min-height:250px;line-height:1.65}.workspace .writing-tools{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:10px}.workspace .writing-tools label{margin:0}.editor-save{border-top:1px solid #dde4db;padding-top:10px}.workspace .archive-grid{grid-template-columns:1fr;gap:9px}.workspace .archive-item{display:flex;align-items:stretch;border-radius:9px;box-shadow:none}.workspace .archive-thumb{width:84px;height:auto;min-height:84px;object-fit:cover}.workspace .archive-content{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:3px 12px;flex:1;min-width:0;padding:10px 12px}.workspace .archive-content .state{justify-self:start;grid-column:1;font-size:11px}.workspace .archive-content .category{grid-column:1;font-size:12px}.workspace .archive-item h2{grid-column:1;margin:0;font-size:14px;line-height:1.45}.workspace .archive-actions{grid-column:2;grid-row:1/4;border:0;padding:0;gap:5px;font-size:13px}@media(max-width:740px){.workspace .editor-grid,.workspace .archive-content{grid-template-columns:1fr}.workspace .archive-actions{grid-column:1;grid-row:auto;margin-top:5px}.workspace .archive-thumb{width:60px}}
.detail-nav{max-width:920px;margin:0 auto 16px;padding:10px 12px;gap:10px;border:1px solid #dce5dc;border-radius:13px;background:#fffdf9;box-shadow:0 3px 14px #1f423609}.detail-nav a{text-decoration:none;border-radius:8px;padding:5px 12px;font-size:14px;font-weight:700}.detail-home{color:#264c3e}.detail-category{background:#214d3e;color:#fff}.detail-divider{color:#65766a}.detail-home:hover{background:#eaf1e9}.detail-category:hover{background:#163b30}.article .byline{display:flex;gap:10px;flex-wrap:wrap;font-size:14px;color:#526557}.sources,.search-settings{border-top:1px solid #dce4db;padding:12px 0;margin-top:14px}.search-settings summary{font-size:14px;cursor:pointer;font-weight:700}.workspace .source-input{min-height:72px}.sources li{overflow-wrap:anywhere}</style><body>${navigation(me,active)}<main${active==='/write'||active==='/archive'?' class="workspace"':''}>${body}</main><footer class="studio-footer"><div class="footer-main"><div><a class="footer-brand" href="/">HUB STUDIO 8</a><p>전문 문서를 작성하고 공개마켓에서 공유하는 문서 스튜디오</p></div><div><h2>스튜디오</h2><a href="/write">새 문서</a><a href="/archive">내 보관함</a></div><div><h2>공개마켓</h2><a href="/market">전체 자료</a>${domains.map(domain=>`<a href="/market?domain=${encodeURIComponent(domain)}">${e(domain)}</a>`).join('')}</div></div><div class="footer-base"><div>© HUB STUDIO 8</div></div></footer></body></html>`);
}
const sessionCookie=(id,maxAge)=>`hs8_session=${id}; Max-Age=${maxAge}; Path=/; Secure; HttpOnly; SameSite=Lax`;
const cookie=req=>req.headers.get('cookie')?.match(/(?:^|;\s*)hs8_session=([a-f0-9-]+)/)?.[1]||'';
const user=(req,db)=>cookie(req)?one(db,"SELECT users.id,users.name FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.id=? AND expires_at>datetime('now')",cookie(req)):null;
const digest=async (password,salt)=>{const enc=new TextEncoder();const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:100000,salt:enc.encode(salt)},key,256);return [...new Uint8Array(bits)].map(n=>n.toString(16).padStart(2,'0')).join('')};
function loginPage(next,me,signup=false,message=''){
 return page('계정',`<section class="panel auth"><h1>${me?'내 계정':signup?'회원가입':'이메일 로그인'}</h1>${message?`<p class="error" role="alert">${e(message)}</p>`:''}${me?`<p>${e(me.name)}</p><form method="post" action="/logout"><button>로그아웃</button></form>`:`<form method="post" action="/login"><input type="hidden" name="next" value="${e(next)}"><input type="hidden" name="mode" value="${signup?'signup':'login'}">${signup?'<label>이름<input name="name" maxlength="80" required></label>':''}<label>이메일<input type="email" name="email" autocomplete="email" required></label><label>비밀번호<input type="password" name="password" autocomplete="${signup?'new-password':'current-password'}" ${signup?'minlength="8"':''} required></label><div class="actions actionrow"><button>${signup?'가입하기':'로그인'}</button><a href="/login?next=${encodeURIComponent(next)}${signup?'':'&signup=1'}">${signup?'로그인':'회원가입'}</a></div></form>`}</section>`,{me,active:'/login'});
}
const nextPath=x=>typeof x==='string'&&/^\/(?:write|archive)(?:\?id=[a-f0-9-]+)?$/.test(x)?x:'/write';
const select=(name,values,value,all='')=>`<select name="${name}" aria-label="${name==='type'?'문서 유형':'분야'}">${all?`<option value="">${all}</option>`:''}${values.map(v=>`<option${v===value?' selected':''}>${v}</option>`).join('')}</select>`;
const statusLabel={draft:'임시저장',published:'공개 중',deleted:'휴지통'};
const imageTag=(d,i,cls='',lazy=true)=>{const im=images(d)[i]||{};const src=im.url||('/media/'+encodeURIComponent(d.id)+'/'+i);return `<img class="${cls}" src="${e(src)}" width="960" height="540" decoding="async" alt="${e(im.alt||d.title)}" referrerpolicy="no-referrer"${lazy?' loading="lazy"':' fetchpriority="high"'}>`;};
function editor(d,message='',me=null,topic=null){
 return page(d?'문서 수정':'새 문서',`<div class="workspace-heading"><h1>${d?'문서 수정':'새 문서'}</h1><a href="/archive">내 보관함</a></div><form class="editor-grid" method="post" action="/save" enctype="multipart/form-data"><input type="hidden" name="id" value="${e(d?.id)}"><section class="panel writing-panel"><h2>문서 내용</h2><div class="field-pair"><label>문서 유형${select('type',types,d?.type||topic?.type)}</label><label>분야${select('domain',domains,d?.domain||topic?.domain)}</label></div><label>제목<input name="title" required maxlength="200" value="${e(d?.title||topic?.title)}"></label><label>작성 프롬프트<textarea name="instruction" class="source-input" placeholder="선택한 주제의 작성 방향과 핵심 요구사항">${e(topic?.prompt||'')}</textarea></label><div class="writing-tools"><label for="editor-body">본문</label><button type="button" class="secondary" id="generate">Gemini 초안 생성</button></div><textarea id="editor-body" name="body" required>${e(d?.body)}</textarea><details class="search-settings"${d?.seo_title||mediaRecord(d).sources?.length?" open":""}><summary>검색 및 출처 설정</summary><label>검색 제목<input name="searchTitle" maxlength="75" value="${e(d?.seo_title)}" placeholder="비워 두면 문서 제목 사용"></label><label>공개 작성자<input name="byline" maxlength="80" value="${e(mediaRecord(d).byline)}"></label><label>출처 URL · 한 줄에 하나<textarea class="source-input" name="sources">${e((mediaRecord(d).sources||[]).join("\n"))}</textarea></label><label>검색 설명<input name="description" maxlength="170" value="${e(d?.seo_description)}"></label></details><p class="error" role="status" id="message">${e(message)}</p><div class="actions editor-save"><button>저장</button></div></section><aside class="panel media-panel"><h2>문서 이미지</h2><p class="muted">이미지 URL을 입력하세요. 최대 3장까지 지원하며 이미지 없이도 저장·공개할 수 있습니다. 첫 번째 이미지가 대표 이미지입니다.</p>
 ${Array.from({length:3},(_,i)=>`<details class="image-slot"${i===0||images(d)[i]?" open":""}><summary>${i===0?"대표 이미지":"추가 이미지 "+i}</summary>${images(d)[i]&&d?.id?`${imageTag(d,i,'thumb')}<label><input style="width:auto;display:inline" type="checkbox" name="remove${i}"> 삭제</label>`:''}<label>이미지 주소 (https://)<input type="url" name="imageUrl${i}" maxlength="2048" placeholder="https://example.com/image.jpg" value="${e(images(d)[i]?.url||'')}" inputmode="url"></label><label>이미지 설명<input name="alt${i}" maxlength="160" value="${e(images(d)[i]?.alt)}"></label></details>`).join('')}
 </aside></form><script>
 const editorForm=document.querySelector('.editor-grid');
 editorForm.querySelectorAll('input[name^="imageUrl"]').forEach(input=>{
  input.addEventListener('input',()=>{
   const slot=input.closest('.image-slot');
   let preview=slot.querySelector('.url-preview');
   if(!preview){preview=document.createElement('img');preview.className='thumb url-preview';preview.alt='이미지 미리보기';preview.loading='lazy';slot.append(preview)}
   const value=input.value.trim();
   try{const url=new URL(value);preview.hidden=!(url.protocol==='https:'||url.protocol==='http:');if(!preview.hidden)preview.src=url.href;else preview.removeAttribute('src')}
   catch{preview.hidden=true;preview.removeAttribute('src')}
  });
 });
 document.querySelector('#generate').onclick=async function(){
 const form=this.form,status=document.querySelector('#message');
 if(form.body.value.trim()&&!confirm('기존 본문을 Gemini 초안으로 교체할까요?'))return;
 this.disabled=true;status.textContent='Gemini가 초안을 작성 중입니다.';
 try{const r=await fetch('/api/ai/draft',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:form.type.value,domain:form.domain.value,title:form.elements.namedItem("title").value,instruction:form.elements.namedItem("instruction").value})});
 const d=await r.json();if(!r.ok)throw Error(d.error||'생성 실패');
 form.elements.namedItem("title").value=d.title;form.body.value=d.body;form.description.value=String(d.summary||'').slice(0,170);status.textContent='초안 생성 완료 · '+[...d.body].length+'자';
 }catch(error){status.textContent=error.message}finally{this.disabled=false}
 };
 </script>`,{me,active:'/write'});
}
function action(d,operation,label,cls='secondary'){return `<form method="post" action="/document-action"><input type="hidden" name="id" value="${e(d.id)}"><button class="${cls}" name="operation" value="${operation}">${label}</button></form>`}
function archive(rows,me){
 return page('내 보관함',`<div class="workspace-heading"><div><h1>내 보관함 <span>${rows.length}개</span></h1></div><a class="button" href="/write">새 문서</a></div><div class="archive-grid">${rows.length?rows.map(d=>`<article class="panel archive-item">${images(d).length?imageTag(d,0,"archive-thumb"):""}<div class="archive-content"><span class="state state-${e(d.status)}">${e(statusLabel[d.status])}</span><small class="category">${e(d.type)} · ${e(d.domain)} · ${e(d.updated_at.slice(0,10))}</small><h2>${e(d.title)}</h2><div class="actions archive-actions">${d.status==='deleted'?action(d,'restore','복구'):`<a class="button secondary" href="/write?id=${e(d.id)}">수정</a><a class="button secondary" href="/review?id=${e(d.id)}">미리보기</a>${d.status==="draft"?`<a class="button" href="/review?id=${e(d.id)}">공개 배포</a>`:""}${d.status==='published'?`<a href="${urlFor(d)}">공개 상세</a>${action(d,'unpublish','공개 취소')}`:''}<a class="button danger" href="/review?id=${e(d.id)}&delete=1">삭제</a>`}</div></div></article>`).join(''):'<p>저장한 문서가 없습니다.</p>'}</div>`,{me,active:'/archive'});
}
function card(d){
 const cover=images(d).length?imageTag(d,0):`<div class="type-cover" aria-hidden="true"><span>${e(d.domain)}</span><strong>${e(d.type)}</strong></div>`;
 return `<a class="card" href="${urlFor(d)}"><div class="card-cover">${cover}</div><div class="card-info"><small class="category">${e(d.domain)} · ${e(d.type)}</small><h2>${e(d.title)}</h2><p>${e(d.seo_description||d.body.slice(0,145))}</p><div class="card-foot"><time>${e(d.published_at?.slice(0,10))}</time><span>전문 읽기</span></div></div></a>`;
}
const starterPrompts=[
{type:'기사',domain:'경제',title:'2026년 글로벌 금리 변화가 한국 기업의 자금조달에 미치는 영향',prompt:'미국과 주요국의 통화정책 변화, 시장금리, 회사채 및 대출 조달비용을 연결해 분석하고 기업 재무담당자가 주목할 대응전략을 제시하세요.'},
{type:'보고서',domain:'금융',title:'원화 환율 변동성 확대와 수출기업의 환리스크 관리',prompt:'환율 변동 요인, 수출기업의 손익 및 현금흐름 영향, 선물환·옵션 등 헤지수단과 실무상 유의점을 체계적으로 분석하세요.'},
{type:'기사',domain:'IT·AI',title:'생성형 AI 에이전트가 기업 업무 프로세스를 바꾸는 방식',prompt:'기업 현장에서의 AI 에이전트 활용 사례, 생산성 개선 영역, 도입 비용과 보안·책임 리스크를 균형 있게 다루세요.'},
{type:'보고서',domain:'산업·에너지',title:'AI 데이터센터 확산에 따른 전력 수요와 발전 인프라 투자 전망',prompt:'데이터센터 전력수요, 송전망 병목, 가스발전·재생에너지·ESS의 역할과 프로젝트 금융 관점의 투자 포인트를 분석하세요.'},
{type:'기사',domain:'부동산·건설',title:'미국 데이터센터 임대차 시장의 트리플넷 구조와 임대인·임차인 부담',prompt:'NNN 임대차의 비용 배분, 임대료 구조, 운영비·세금·보험·유지보수 부담 및 계약 협상 시 확인사항을 설명하세요.'},
{type:'보고서',domain:'정치·국제',title:'미중 기술 경쟁이 글로벌 공급망과 한국 산업에 미치는 파급효과',prompt:'수출통제와 관세, 핵심광물 및 반도체 공급망 재편을 살피고 한국 기업의 기회와 위험을 구분해 제시하세요.'},
{type:'보도자료',domain:'기업·경영',title:'기업의 신규 전략사업 진출 및 투자계획 발표',prompt:'사업 진출 배경, 투자 규모와 일정, 기대효과, 파트너십 및 향후 실행계획을 신뢰감 있는 기업 보도자료 형식으로 작성하세요.'},
{type:'기사',domain:'사회·문화',title:'고령화와 인구구조 변화가 소비시장에 가져오는 새로운 기회',prompt:'인구구조와 가구 형태 변화가 주거·의료·금융·여가 소비에 미치는 영향을 데이터 확인이 가능한 범위에서 분석하세요.'},
{type:'보고서',domain:'과학·환경',title:'탄소포집·활용·저장(CCUS) 산업의 상용화 조건과 사업 리스크',prompt:'포집·수송·저장 단계별 기술 및 비용, 인허가, 오프테이크, 세액공제와 프로젝트 파이낸싱의 핵심 리스크를 구분하세요.'},
{type:'보고서',domain:'법률',title:'AI 활용 기업의 개인정보·저작권·책임 관련 컴플라이언스 점검',prompt:'기업이 AI 서비스를 도입하거나 개발할 때 확인할 개인정보, 저작권, 영업비밀, 결과물 책임과 내부통제 항목을 정리하세요.'},
{type:'기사',domain:'마케팅',title:'검색에서 AI 답변으로 이동하는 시대의 브랜드 콘텐츠 전략',prompt:'검색엔진과 생성형 AI 답변 환경의 변화를 설명하고 브랜드가 신뢰도 높은 콘텐츠와 전문성을 확보하는 방법을 제시하세요.'},
{type:'사업계획서',domain:'IT·AI',title:'중소기업용 업무 자동화 AI SaaS 서비스 사업계획',prompt:'고객 문제, 핵심 기능, 목표시장, 경쟁우위, 과금모델, 고객 확보전략, 운영비용 및 12개월 실행계획을 구체화하세요.'},
{type:'보고서',domain:'경제',title:'미국 재정정책과 국채 발행 확대가 글로벌 금융시장에 미치는 영향',prompt:'재정적자와 국채 공급, 장단기 금리, 달러 및 위험자산에 미치는 경로를 구분해 분석하세요.'},
{type:'기사',domain:'산업·에너지',title:'전력망 접속 대기와 변전설비 부족이 신규 발전사업에 미치는 영향',prompt:'계통연계 절차, 송전·변전 설비 투자, 인허가 지연과 프로젝트 일정·금융조달에 미치는 영향을 설명하세요.'},
{type:'보고서',domain:'부동산·건설',title:'미국 상업용 부동산 대출의 리파이낸싱 리스크와 대응방안',prompt:'만기 집중, 금리·DSCR·LTV 변화, 감정평가와 대주단 협의, 자본확충 및 대환 구조를 분석하세요.'},
{type:'기사',domain:'금융',title:'사모대출 시장 성장과 은행 대출시장에 미치는 경쟁 효과',prompt:'사모대출의 구조와 성장 배경, 차주·대주 관점의 장단점, 은행 및 신디케이트론 시장과의 관계를 설명하세요.'},
{type:'사업계획서',domain:'사회·문화',title:'지역 기반 시니어 케어 서비스 플랫폼 사업계획',prompt:'고객과 보호자의 미충족 수요, 서비스 구성, 공급자 네트워크, 수익모델, 규제 고려사항 및 확장전략을 작성하세요.'},
{type:'보고서',domain:'정치·국제',title:'주요국 산업정책과 보조금 경쟁이 해외투자 의사결정에 미치는 영향',prompt:'미국·유럽·아시아의 산업지원 정책과 현지생산 요건, 세제 혜택, 공급망 요건을 비교하고 투자 시사점을 제시하세요.'},
{type:'보도자료',domain:'과학·환경',title:'친환경 기술 실증사업 착수 및 민관 협력 발표',prompt:'기술의 목적과 실증 범위, 참여기관 역할, 일정, 환경적 기대효과 및 후속 상용화 계획을 명료하게 작성하세요.'},
{type:'기사',domain:'기업·경영',title:'기업의 현금흐름 중심 경영과 투자 우선순위 재편',prompt:'고금리·불확실성 환경에서 기업이 투자심사, 운전자본, 배당, 차입금 관리와 사업 포트폴리오를 어떻게 조정하는지 분석하세요.'}
];
async function ensurePromptStore(db){
 await db.prepare("CREATE TABLE IF NOT EXISTS prompt_topics(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,type TEXT NOT NULL,domain TEXT NOT NULL,title TEXT NOT NULL,prompt TEXT NOT NULL,source TEXT NOT NULL DEFAULT 'ai',created_at TEXT NOT NULL)").run();
 await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS prompt_topics_unique_title ON prompt_topics(user_id,lower(title))").run();
 await db.prepare("CREATE INDEX IF NOT EXISTS prompt_topics_recent ON prompt_topics(user_id,created_at DESC)").run();
}
async function seedPromptTopics(db,userId){
 await ensurePromptStore(db);
 const count=await one(db,'SELECT COUNT(*) AS n FROM prompt_topics WHERE user_id=?',userId);
 if(Number(count?.n||0)>0)return;
 const now=new Date().toISOString();
 for(const p of starterPrompts)await run(db,"INSERT OR IGNORE INTO prompt_topics(id,user_id,type,domain,title,prompt,source,created_at) VALUES(?,?,?,?,?,?,?,?)",crypto.randomUUID(),userId,p.type,p.domain,p.title,p.prompt,'starter',now);
}
function promptCard(p){
 return '<a class="card prompt-card" href="/write?promptId='+encodeURIComponent(p.id)+'"><div class="card-info"><small class="category">'+e(p.type)+' · '+e(p.domain)+(p.source==='ai'?' · AI 추천':' · 기본 주제')+'</small><h2>'+e(p.title)+'</h2><p>'+e(p.prompt)+'</p><div class="card-foot"><time>'+e((p.created_at||'').slice(0,10))+'</time><span>이 주제로 작성 →</span></div></div></a>';
}
async function promptsPage(db,me){
 await seedPromptTopics(db,me.id);
 const topics=await list(db,'SELECT * FROM prompt_topics WHERE user_id=? ORDER BY created_at DESC LIMIT 300',me.id);
 return page('프롬프트 라이브러리','<section class="hero"><div><span class="eyebrow">HUB STUDIO 8 · PROMPT LIBRARY</span><h1>좋은 주제에서<br>좋은 문서가 시작됩니다.</h1><p>분야별 기본 주제를 골라 바로 글을 쓰거나, AI에게 새로운 주제 10개를 추천받으세요. 추천 주제는 내 라이브러리에 자동 저장됩니다.</p></div></section><section class="panel"><div class="section-head"><div><h2>AI 주제 추천</h2><span>새 추천 10개를 생성하고 자동으로 보관합니다.</span></div></div><div class="field-pair"><label>문서 유형'+select('type',types,'','전체 유형')+'</label><label>분야'+select('domain',domains,'','전체 분야')+'</label></div><div class="actions actionrow"><button id="recommend">AI 추천 10개 받기</button><span id="recommend-status" class="muted" role="status"></span></div></section><section><div class="section-head"><h2>내 주제 라이브러리</h2><span id="topic-count">'+topics.length+'개 누적</span></div><div class="grid" id="prompt-list">'+topics.map(promptCard).join('')+'</div></section><script>
const recommendButton=document.querySelector('#recommend');
recommendButton.addEventListener('click',async()=>{
 recommendButton.disabled=true;
 const status=document.querySelector('#recommend-status');
 status.textContent='AI가 새로운 주제를 구상하고 있습니다…';
 try{
  const response=await fetch('/api/prompts/recommend',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:document.querySelector('select[name=type]').value,domain:document.querySelector('select[name=domain]').value})});
  const data=await response.json();
  if(!response.ok||!data.ok)throw new Error(data.error||'추천을 생성하지 못했습니다.');
  const list=document.querySelector('#prompt-list');
  data.topics.forEach(topic=>{
   const a=document.createElement('a');a.className='card prompt-card';a.href='/write?promptId='+encodeURIComponent(topic.id);
   const info=document.createElement('div');info.className='card-info';
   const meta=document.createElement('small');meta.className='category';meta.textContent=topic.type+' · '+topic.domain+' · AI 추천';
   const title=document.createElement('h2');title.textContent=topic.title;
   const desc=document.createElement('p');desc.textContent=topic.prompt;
   const foot=document.createElement('div');foot.className='card-foot';const date=document.createElement('time');date.textContent=(topic.created_at||'').slice(0,10);const action=document.createElement('span');action.textContent='이 주제로 작성 →';
   foot.append(date,action);info.append(meta,title,desc,foot);a.append(info);list.prepend(a);
  });
  document.querySelector('#topic-count').textContent=data.total+'개 누적';
  status.textContent='새 주제 '+data.topics.length+'개를 저장했습니다.';
 }catch(error){status.textContent=error.message}
 finally{recommendButton.disabled=false}
});
</script>',{me,active:'/prompts'});
}
async function recommendPrompts(req,env,db,me){
 await ensurePromptStore(db);
 if(!env.GEMINI_API_KEY)return j({ok:false,error:'Gemini API 키가 Worker Secret에 등록되지 않았습니다.'},503);
 const b=await req.json(),wantedType=types.includes(b.type)?b.type:'',wantedDomain=domains.includes(b.domain)?b.domain:'';
 const prompt='당신은 한국어 전문 콘텐츠 기획자입니다. 기사·보고서·보도자료·사업계획서에 적합한 참신하고 구체적인 주제 10개를 만드세요. 분야는 '+(wantedDomain||domains.join(', '))+' 중에서 다양하게 고르고, 문서 유형은 '+(wantedType||types.join(', '))+'를 고르게 섞으세요. 이미 흔한 일반론보다 구체적인 쟁점과 분석 관점이 드러나는 주제를 만드세요. 제목은 실제 전문 문서 제목처럼 작성하고, prompt에는 작성 방향·핵심 분석 항목·독자에게 줄 가치를 2~4문장으로 적으세요. 허위 통계나 현재 사실을 단정하지 마세요. 정확히 10개를 JSON으로 반환하세요. 형식: {"topics":[{"type":"기사","domain":"경제","title":"제목","prompt":"작성 지시사항"}]}';
 let response,data;
 const payload={contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.9,responseMimeType:'application/json'}};
 for(const model of ['gemini-3.8-flash','gemini-3.5-flash','gemini-2.5-flash']){
  response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:JSON.stringify(payload)});
  if(response.ok){data=await response.json();break}
 }
 if(!response||!response.ok)return j({ok:false,error:'Gemini 주제 추천 API 응답 오류'},502);
 try{
  const raw=data.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'{}';
  const parsed=JSON.parse(raw.replace(/^\`\`\`json\\s*/,'').replace(/\\s*\`\`\`$/,''));
  const incoming=Array.isArray(parsed.topics)?parsed.topics:[];
  const now=new Date().toISOString();
  for(const item of incoming.slice(0,15)){
   const type=types.includes(item.type)?item.type:(wantedType||'기사');
   const domain=domains.includes(item.domain)?item.domain:(wantedDomain||'경제');
   const title=String(item.title||'').trim().slice(0,200),instruction=String(item.prompt||'').trim().slice(0,2000);
   if(title.length<8||instruction.length<15)continue;
   await run(db,"INSERT OR IGNORE INTO prompt_topics(id,user_id,type,domain,title,prompt,source,created_at) VALUES(?,?,?,?,?,?,?,?)",crypto.randomUUID(),me.id,type,domain,title,instruction,'ai',now);
  }
  const topics=await list(db,"SELECT * FROM prompt_topics WHERE user_id=? AND created_at=? AND source='ai' ORDER BY rowid DESC",me.id,now);
  const total=await one(db,'SELECT COUNT(*) AS n FROM prompt_topics WHERE user_id=?',me.id);
  return j({ok:true,topics,total:Number(total?.n||0)});
 }catch(error){return j({ok:false,error:'AI 응답을 주제 목록으로 변환하지 못했습니다. 다시 시도해 주세요.'},502)}
}
async function marketPage(u,db,home=false,me=null){
 const q=(u.searchParams.get('q')||'').slice(0,100),t=u.searchParams.get('type')||'',d=u.searchParams.get('domain')||'';
 const rows=await list(db,"SELECT * FROM documents WHERE status='published' AND (?='' OR type=?) AND (?='' OR domain=?) AND instr(lower(title||' '||coalesce(seo_description,'')),lower(?))>0 ORDER BY published_at DESC LIMIT 100",t,t,d,d,q);
 const first=home?rows[0]:null;
 const tabs=['',...domains].map(v=>{
  const params=new URLSearchParams();
  if(v)params.set('domain',v);if(t)params.set('type',t);if(q)params.set('q',q);
  return `<a class="chip" ${v===d?'aria-current="true"':''} href="/market${params.size?'?'+e(params.toString()):''}">${e(v||'전체 분야')}</a>`;
 }).join('');
 return page(home?'허브스튜디오8':'공개마켓',`${home?`<section class="studio-hero"><div class="hero-text"><span class="studio-kicker">HUB STUDIO 8 · 문서 스튜디오</span><h1>초안부터 공개까지,<br>한곳에서.</h1><p>Gemini로 초안을 쓰고, 내 보관함에서 다듬고, 공개마켓에서 전문 자료를 나누세요.</p><div class="actions"><a class="button" href="/write">새 문서 작성</a><a class="button secondary" href="/market">공개마켓 둘러보기</a></div></div><div class="hero-preview">${first?`<span class="preview-label">최근 공개 문서</span>${card(first)}`:`<div class="formats"><strong>작성할 문서</strong>${types.map(type=>`<span>${type}</span>`).join('')}</div>`}</div></section><section class="studio-guide" aria-labelledby="guide-title"><h2 id="guide-title">허브스튜디오8에서 할 수 있는 일</h2><div class="guide-grid"><div><h3>Gemini로 초안 작성</h3><p>경제·IT·법률·마케팅 분야의 기사, 보고서, 보도자료, 사업계획서를 작성하세요.</p></div><div><h3>내 보관함에서 편집</h3><p>문서를 임시저장하고, 본문과 검색 설명을 수정하거나 이미지를 최대 3장까지 추가하세요.</p></div><div><h3>공개마켓에 발행</h3><p>미리보기에서 확인한 뒤 무료 자료로 공개하고 문서 링크를 공유하세요.</p></div></div></section>`:`<section class="hero"><div><span class="eyebrow">HUB STUDIO 8 · 공개마켓</span><h1>오늘 읽을 전문 자료</h1><p>경제·IT·법률·마케팅의 기사, 보고서, 보도자료, 사업계획서를 무료로 만나보세요.</p></div></section>`}<section aria-label="공개 자료"><div class="section-head"><h2>${home?'최신 공개 자료':'자료 탐색'}</h2><span>${rows.length===100?'100+':rows.length}개 자료</span></div><nav class="chips" aria-label="분야">${tabs}</nav><form class="search" action="/market"><input name="q" aria-label="문서 검색" placeholder="제목 또는 요약 검색" value="${e(q)}"><input type="hidden" name="domain" value="${e(d)}">${select('type',types,t,'모든 유형')}<button>검색</button></form><div class="grid">${rows.map(card).join('')||'<p class="panel">조건에 맞는 공개 문서가 없습니다.</p>'}</div></section>`,{me,active:home?'/':'/market',canonical:u.origin+(home?'/':'/market'),description:'경제·IT·법률·마케팅 분야의 전문 문서 스튜디오와 무료 공개마켓'});
}
function article(d,imagesEnabled=true){
 const lines=d.body.split(/\r?\n/);
 const headings=lines.flatMap((line,i)=>/^#{1,4}\s+\S/.test(line)?[{i,text:line.replace(/^#+\s+/, '')}]:[]);
 const record=mediaRecord(d);
 const body=lines.map((line,i)=>/^#{1,4}\s+\S/.test(line)?`<h2 id="section-${i}">${e(line.replace(/^#+\s+/,''))}</h2>`:line.trim()?`<p>${e(line)}</p>`:'').join('');
 return `<article class="article"><small class="category">${e(d.domain)} · ${e(d.type)}</small><h1>${e(d.title)}</h1>${record.byline||d.published_at?`<p class="byline">${record.byline?e(record.byline):""}${d.published_at?` <time datetime="${e(d.published_at)}">발행 ${e(d.published_at.slice(0,10))}</time>`:""}${d.published_at&&d.updated_at>d.published_at?` <time datetime="${e(d.updated_at)}">수정 ${e(d.updated_at.slice(0,10))}</time>`:""}</p>`:""}${d.seo_description?`<p class="dek">${e(d.seo_description)}</p>`:""}${imagesEnabled&&images(d).length?imageTag(d,0,'cover',false):''}${headings.length?`<details open class="panel"><summary>목차</summary><ol>${headings.map(h=>`<li><a href="#section-${h.i}">${e(h.text)}</a></li>`).join('')}</ol></details>`:''}<div class="article-body">${body}</div>${record.sources?.length?`<section class="sources"><h2>참고 출처</h2><ul>${record.sources.map(url=>`<li><a rel="nofollow ugc" href="${e(url)}">${e(url)}</a></li>`).join("")}</ul></section>`:""}${imagesEnabled?images(d).slice(1).map((im,i)=>`<figure>${imageTag(d,i+1,'cover')}${im.alt?`<figcaption>${e(im.alt)}</figcaption>`:''}</figure>`).join(''):''}</article>`;
}
async function save(req,env,me){
 const f=await req.formData(), db=env.DB, id=String(f.get('id')||'');
 const old=id?await one(db,"SELECT * FROM documents WHERE id=? AND user_id=? AND status!='deleted'",id,me.id):null;
 if(id&&!old)return html('문서를 찾을 수 없습니다.',404);
 const doc={id:id||crypto.randomUUID(),title:String(f.get('title')||'').trim(),body:String(f.get('body')||'').trim(),type:f.get('type'),domain:f.get('domain'),seo_description:String(f.get('description')||'').slice(0,170)};
 const reject=message=>editor({...doc,id,image_key:old?.image_key},message,me);
 if(!doc.title||doc.title.length>200||!doc.body||doc.body.length>100000||!types.includes(doc.type)||!domains.includes(doc.domain))return reject('제목, 본문, 문서 유형과 분야를 확인해 주세요.');
 const before=images(old),next=[];
 for(let i=0;i<3;i++){
  const raw=String(f.get('imageUrl'+i)||'').trim(),alt=String(f.get('alt'+i)||'').slice(0,160);
  if(f.has('remove'+i))continue;
  if(raw){
   let parsed;
   try{parsed=new URL(raw)}catch{return reject('이미지 주소 형식이 올바르지 않습니다.')}
   if(!['https:','http:'].includes(parsed.protocol)||parsed.username||parsed.password||raw.length>2048)return reject('이미지 주소는 올바른 HTTP 또는 HTTPS 주소여야 합니다.');
   next.push({url:parsed.href,alt});
  }else if(before[i]&&!before[i].url)next.push({...before[i],alt});
 }
 const time=new Date().toISOString();
 const searchTitle=String(f.get('searchTitle')||'').trim().slice(0,75);
 const byline=String(f.get('byline')||'').trim().slice(0,80);
 const sources=sourceUrls(f.get('sources'));
 const data=[doc.type,doc.domain,doc.title,doc.body,JSON.stringify({images:next,byline,sources}),doc.seo_description,searchTitle,time];
 if(old){
  const result=await run(db,"UPDATE documents SET type=?,domain=?,title=?,body=?,image_key=?,seo_description=?,seo_title=?,updated_at=? WHERE id=? AND user_id=? AND updated_at=? AND status=?",...data,id,me.id,old.updated_at,old.status);
  if(!result.meta.changes)return reject('다른 화면에서 문서가 변경되었습니다. 보관함에서 다시 열어 주세요.');
 }else await run(db,"INSERT INTO documents(type,domain,title,body,image_key,seo_description,seo_title,updated_at,id,user_id,slug,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",...data,doc.id,me.id,doc.id,time);
 return redirect('/write?id='+doc.id);
}
export default {async fetch(req,env){
 const u=new URL(req.url),path=u.pathname,db=env.DB;
 try{
  if(req.method==='POST'&&req.headers.get('origin')!==u.origin)return html('요청 출처를 확인해 주세요.',403);
  const me=await user(req,db);
  if(path==='/')return await marketPage(u,db,true,me);
  if(path==='/robots.txt')return new Response('User-agent: *\nAllow: /market\nSitemap: '+u.origin+'/sitemap.xml\n',{headers:{'content-type':'text/plain'}});
  if(path==='/sitemap.xml'){
   const rows=await list(db,"SELECT slug,updated_at FROM documents WHERE status='published'");
   return new Response(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${e(u.origin+'/')}</loc></url><url><loc>${e(u.origin+'/market')}</loc></url>${rows.map(d=>`<url><loc>${e(u.origin+urlFor(d))}</loc><lastmod>${e(d.updated_at)}</lastmod></url>`).join('')}</urlset>`,{headers:{'content-type':'application/xml'}});
  }
  if(path==='/market')return await marketPage(u,db,false,me);
  if(path.startsWith('/market/document/')){
   const d=await one(db,"SELECT * FROM documents WHERE slug=? AND status='published'",decodeURIComponent(path.split('/').at(-1)));
   if(!d)return html('공개 문서를 찾을 수 없습니다. <a href="/market">공개마켓</a>',404);
   const canonical=u.origin+urlFor(d),description=d.seo_description||d.body.slice(0,150),image=images(d).length?(images(d)[0].url||u.origin+'/media/'+d.id+'/0'):'';
   const related=await list(db,"SELECT * FROM documents WHERE status='published' AND domain=? AND id!=? ORDER BY published_at DESC LIMIT 3",d.domain,d.id);
   return page(d.title,`<nav class="detail-nav" aria-label="문서 탐색"><a class="detail-home" href="/market">공개마켓</a><span class="detail-divider" aria-hidden="true">/</span><a class="detail-category" href="/market?domain=${encodeURIComponent(d.domain)}">${e(d.domain)}</a></nav>${article(d)}<div class="actions"><button id="copy">공유 링크 복사</button><output id="copied"></output></div>${related.length?`<h2>관련 문서</h2><div class="grid">${related.map(card).join('')}</div>`:''}<script>document.querySelector('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+location.pathname);document.querySelector('#copied').textContent='링크를 복사했습니다.'}catch{document.querySelector('#copied').textContent=location.href}}</script>`,{me,active:'/market',canonical,description,image,searchTitle:d.seo_title||d.title,articleMeta:true,schema:[{'@context':'https://schema.org','@type':d.type==='보고서'?'Report':'Article',headline:d.title,description,url:canonical,datePublished:d.published_at,dateModified:d.updated_at,...(mediaRecord(d).byline?{author:{'@type':'Person',name:mediaRecord(d).byline}}:{}),...(mediaRecord(d).sources?.length?{citation:mediaRecord(d).sources}:{}),...(image?{image}:{})},{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'공개마켓',item:u.origin+'/market'},{'@type':'ListItem',position:2,name:d.title,item:canonical}]}]});
  }

  if(path==='/login'){
   if(req.method==='GET')return loginPage(nextPath(u.searchParams.get('next')),me,u.searchParams.has('signup'));
   const f=await req.formData(),next=nextPath(f.get('next')),signup=f.get('mode')==='signup',email=String(f.get('email')||'').trim().toLowerCase(),pw=String(f.get('password')||'');
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!pw||pw.length>256||signup&&pw.length<8)return loginPage(next,null,signup,'이메일과 비밀번호를 확인해 주세요.');
   let row=await one(db,'SELECT * FROM users WHERE email=?',email);
   if(signup&&row)return loginPage(next,null,true,'이미 가입된 이메일입니다.');
   const salt=crypto.randomUUID();
   if(signup){row={id:crypto.randomUUID()};await run(db,"INSERT INTO users(id,email,name,password_hash,created_at) VALUES(?,?,?,?,datetime('now'))",row.id,email,String(f.get('name')||email.split('@')[0]).slice(0,80),salt+':'+await digest(pw,salt))}
   else{
    const [oldSalt,hash]=(row?.password_hash||'').split(':');
    const computed=await digest(pw,hash?oldSalt:salt);
    if(!row||(hash?computed!==hash:row.password_hash!==pw))return loginPage(next,null,false,'이메일 또는 비밀번호가 올바르지 않습니다.');
    if(!hash)await run(db,'UPDATE users SET password_hash=? WHERE id=?',salt+':'+computed,row.id);
   }
   const sid=crypto.randomUUID();await run(db,"INSERT INTO sessions(id,user_id,expires_at,created_at) VALUES(?,?,datetime('now','+30 day'),datetime('now'))",sid,row.id);
   const response=redirect(next);response.headers.set('set-cookie',sessionCookie(sid,2592000));return response;
  }
  const media=path.match(/^\/media\/([a-f0-9-]+)\/([0-2])$/);
  if(media){
   const d=await one(db,'SELECT * FROM documents WHERE id=?',media[1]);
   const image=d&&(d.status==='published'||d.user_id===me?.id)&&images(d)[Number(media[2])];
   const file=image?.key&&env.BUCKET?await env.BUCKET.get(image.key):null;
   return file?new Response(file.body,{headers:{'content-type':file.httpMetadata.contentType,'cache-control':'private, no-store','x-content-type-options':'nosniff'}}):html('이미지를 찾을 수 없습니다.',404);
  }
  if(!me)return path.startsWith('/api/')?j({error:'로그인이 필요합니다.'},401):redirect('/login?next='+encodeURIComponent(nextPath(path+u.search)));
  if(path==='/logout'&&req.method==='POST'){await run(db,'DELETE FROM sessions WHERE id=?',cookie(req));const response=redirect('/market');response.headers.set('set-cookie',sessionCookie('',0));return response}
  if(path==='/api/ai/draft'&&req.method==='POST')return await draft(req,env);\n  if(path==='/prompts')return await promptsPage(db,me);\n  if(path==='/api/prompts/recommend'&&req.method==='POST')return await recommendPrompts(req,env,db,me);
  if(path==='/archive')return archive(await list(db,'SELECT * FROM documents WHERE user_id=? ORDER BY updated_at DESC',me.id),me);
  if(path==='/write'||path==='/review'){
   const id=u.searchParams.get('id');
   const d=id?await one(db,"SELECT * FROM documents WHERE id=? AND user_id=? AND status!='deleted'",id,me.id):null;
   if(id&&!d)return html('문서를 찾을 수 없습니다.',404);
   if(path==='/write'){let topic=null;const promptId=u.searchParams.get('promptId');if(promptId){await seedPromptTopics(db,me.id);topic=await one(db,'SELECT * FROM prompt_topics WHERE id=? AND user_id=?',promptId,me.id);if(!topic)return html('선택한 프롬프트를 찾을 수 없습니다. <a href="/prompts">프롬프트 라이브러리</a>',404)}return editor(d,'',me,topic)}
   if(!d)return redirect('/archive');
   return page('문서 미리보기',`<div class="actions review-bar"><a href="/archive">내 보관함</a>${u.searchParams.has('delete')?action(d,'delete','휴지통으로 이동','danger'):d.status!=='published'?action(d,'publish','공개마켓 배포','button'):''}</div>${article(d)}`,{me,active:'/archive'});
  }
  if(path==='/save'&&req.method==='POST')return await save(req,env,me);
  if(path==='/document-action'&&req.method==='POST'){
   const f=await req.formData(),id=String(f.get('id')),op=f.get('operation');
   const d=await one(db,'SELECT * FROM documents WHERE id=? AND user_id=?',id,me.id);
   if(!d)return html('문서를 찾을 수 없습니다.',404);
   const target={publish:'published',unpublish:'draft',delete:'deleted',restore:'draft'}[op];
   if(!target||(op==='restore')!==(d.status==='deleted'))return html('문서 상태를 확인해 주세요.',400);
   const time=new Date().toISOString();
   const result=await run(db,'UPDATE documents SET status=?,published_at=?,updated_at=? WHERE id=? AND user_id=? AND status=?',target,target==='published'?d.published_at||time:null,time,id,me.id,d.status);
   if(!result.meta.changes)return html('공개 배포에 실패했습니다. 문서 상태가 변경되었을 수 있으니 보관함에서 다시 열어 주세요.',409);
   return redirect(target==='published'?urlFor(d):'/archive');
  }
  return html('페이지를 찾을 수 없습니다.',404);
 }catch(error){console.error('HubStudio8 request failed',path,error.name);return path.startsWith('/api/')?j({error:'요청을 처리하지 못했습니다.'},500):html('요청을 처리하지 못했습니다. <a href="/archive">보관함으로 돌아가기</a>',500)}
}};
