// Phase 2: playable offense. Defense and the opponent's drives are simulated.
(()=>{
const FW=53.3,PPY=11,CLK=1.5,GAIN=2.3,U=2;
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),rr=(a,b)=>a+Math.random()*(b-a),ri=(a,b)=>Math.floor(rr(a,b+1)),D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
const SKIN=["#f2c9a0","#e0a878","#c68642","#8d5524","#5c3a21","#3b2416"];
// routes: [yards forward, yards lateral] from the start spot (lateral: + toward middle, - toward sideline)
const RT={go:[[35,0]],slant:[[4,0],[12,9]],out:[[8,0],[8,-9]],curl:[[10,0],[7.5,0]],flat:[[1,-9],[3,-17]],post:[[10,0],[24,9]]};
const PLAYS={quick:{WR1:"out",WR2:"slant",WR3:"curl",TE1:"flat",RB:"flat"},deep:{WR1:"go",WR2:"post",WR3:"go",TE1:"out",RB:"flat"}};
let G=null;
const fillP=pos=>({name:"Filler",pos,num:0,vis:[35,35,35,35],attrs:[35,35,35,35],face:[1,0,1,0],stats:{}});
const pl=(ps,pos,i)=>ps.find(p=>p.pos==pos&&!p.bench&&p.slot===i)||fillP(pos);
const sa=(ps,sd)=>avg(ps.filter(p=>!p.bench&&POS[p.pos].side==sd).map(p=>p.vis[0]));
const ent=(p,tm,role,x,y)=>({p,tm,role,x,y,vx:0,vy:0,spd:5.5+p.vis[1]*.035,rt:null,ri:0,cd:0,sl:0});
const nm=p=>p.name.split(" ")[1]||p.name;
const st=(p,k,v)=>{p.stats=p.stats||{};p.stats[k]=(p.stats[k]||0)+v;const m=G.gs.get(p)||{};m[k]=(m[k]||0)+v;G.gs.set(p,m)};
const mv=(e,tx,ty,sp,dt)=>{const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy);if(d<.05)return true;const s=Math.min(d,sp*dt);e.x+=dx/d*s;e.y+=dy/d*s;e.vx=dx/d*sp;e.vy=dy/d*sp;return d<=s+.001};
const scr=(x,y)=>[(x-G.cam.x)*PPY+G.W/2,(y-G.cam.y)*PPY+G.H/2+8];
const clock=s=>Math.floor(s/60)+":"+("0"+Math.floor(s%60)).slice(-2);
function setup(){const g=G,ps=g.my,qs=g.op,los=g.x,c=26.65,o=[];
  const O=(p,r,x,y)=>{const e=ent(p,0,r,x,y);o.push(e);return e},E=(p,r,x,y)=>ent(p,1,r,x,y);
  g.qb=O(pl(ps,"QB",0),"QB",los-3.8,c);g.rb=O(pl(ps,"RB",0),"RB",los-6,c);
  g.w=[O(pl(ps,"WR",0),"WR1",los-.5,6),O(pl(ps,"WR",1),"WR2",los-.5,47.3),O(pl(ps,"WR",2),"WR3",los-1.8,38)];
  g.te=O(pl(ps,"TE",0),"TE1",los-.6,32.3);O(pl(ps,"TE",1),"TE2",los-.6,21.4);
  [24.4,26.2,28,29.8].forEach((y,i)=>O(pl(ps,"OL",i),"OL",los-.6,y));
  g.dl=[23.5,25.5,27.8,29.8].map((y,i)=>E(pl(qs,"DL",i),"DL",los+1.1,y));g.lb=[21,26.6,32].map((y,i)=>E(pl(qs,"LB",i),"LB",los+4,y));
  g.cb=[7,46.3].map((y,i)=>E(pl(qs,"CB",i),"CB",los+3.5,y));g.sf=[17,36].map((y,i)=>E(pl(qs,"S",i),"S",los+11,y));
  g.dfs=[...g.dl,...g.lb,...g.cb,...g.sf];g.off=o;g.el=[...g.w,g.te,g.rb];
  g.cov=[[g.cb[0],g.w[0],1.5],[g.cb[1],g.w[1],1.5],[g.lb[2],g.te,1.5],[g.lb[0],g.rb,1.5],[g.sf[1],g.w[2],5],[g.sf[0],g.w[0],7]];
  Object.assign(g,{cr:null,rec:null,catcher:null,runp:false,t:0,ph:"pre",stop:false,inp:{on:0}});g.cam=g.cam||{x:los,y:c};gui()}
function snap(k){const g=G;if(g.ph!="pre")return;g.t=0;
  const blk=avg(g.off.filter(e=>e.role=="OL").map(e=>e.p.vis[0])),rs=avg(g.dl.map(e=>e.p.vis[0]));
  g.pk=cl(2.7+(blk-rs)/22+rr(-.3,.3),1.6,5);g.hold=cl(.8+(blk-rs)/70,.25,1.3);
  if(k=="run"){g.runp=true;g.cr=g.rb;g.ph="run"}
  else{g.ph="pocket";for(const r of g.el){const s=r.y<26.65?1:-1;r.rt=RT[PLAYS[k][r.role]].map(([f,l])=>[r.x+f,r.y+s*l]);r.ri=0}}
  gui()}
const follow=(e,dt)=>{if(e.rt&&e.ri<e.rt.length&&mv(e,e.rt[e.ri][0],e.rt[e.ri][1],e.spd,dt))e.ri++};
function proj(e,T){let x=e.x,y=e.y,k=e.ri,s=e.spd*T;while(s>0&&e.rt&&k<e.rt.length){const[tx,ty]=e.rt[k],d=Math.hypot(tx-x,ty-y);if(d<=s){x=tx;y=ty;s-=d;k++}else{x+=(tx-x)/d*s;y+=(ty-y)/d*s;s=0}}return{x,y}}
function thr(i){const g=G,q=g.qb;let tx,ty;const dx=i.x-i.x0,dy=i.y-i.y0;
  if(Math.hypot(dx,dy)<14){let b=null,bd=80;for(const r of g.el){const s=scr(r.x,r.y),d=Math.hypot(s[0]-i.x,s[1]-i.y);if(d<bd){bd=d;b=r}}if(!b)return;const p=proj(b,Math.max(.4,D(q,b)/22));tx=p.x;ty=p.y}
  else{tx=q.x+dx/PPY*GAIN;ty=q.y+dy/PPY*GAIN}
  tx=Math.max(tx,q.x-1);ty=cl(ty,.5,FW-.5);g.tgt={x:tx,y:ty};g.T=Math.max(.4,Math.hypot(tx-q.x,ty-q.y)/22);
  let b=null,bd=1e9;for(const r of g.el){const p=proj(r,g.T),d=Math.hypot(p.x-tx,p.y-ty);if(d<bd){bd=d;b=r}}
  g.rec=bd<8?b:null;g.bs={x:q.x,y:q.y};g.ph="fly";g.t=0;st(q.p,"att",1);gui()}
function land(){const g=G,t=g.tgt,r=g.rec,q=g.qb.p;if(!r||D(r,t)>3)return end("inc",g.x);
  const d=g.dfs.reduce((a,b)=>D(a,t)<D(b,t)?a:b),dd=D(d,t),len=Math.hypot(t.x-g.qb.x,t.y-g.qb.y);
  let pc=.5+r.p.vis[0]/220+(q.attrs[0]-60)/400-(dd<2.2?.3*d.p.vis[0]/100:0);if(len>25)pc*=cl(.55+q.attrs[1]/200,.5,1);pc=cl(pc,.12,.95);
  if(Math.random()<pc){g.cr=r;g.catcher=r;g.ph="run";g.t=0;g.hold=0;st(q,"cmp",1);st(r.p,"rec",1);return}
  if(dd<2.2&&Math.random()<.2+.35*d.p.vis[0]/100){st(q,"int",1);return end("int",t.x)}
  end("inc",g.x)}
function air(dt){const g=G,q=g.qb;
  for(const r of g.el)if(g.ph=="fly"&&r==g.rec)mv(r,g.tgt.x,g.tgt.y,r.spd*1.1,dt);else follow(r,dt);
  for(const[d,r,c]of g.cov)mv(d,r.x+c,r.y,d.spd*(.8+d.p.vis[0]/500),dt);
  if(g.ph=="fly")for(const d of g.dfs.slice().sort((a,b)=>D(a,g.tgt)-D(b,g.tgt)).slice(0,2))mv(d,g.tgt.x,g.tgt.y,d.spd*.9,dt);
  const pk=g.t>g.pk;for(const d of g.dl)mv(d,q.x,q.y,d.spd*(pk?.95:.3),dt);mv(g.lb[1],q.x+3,q.y,g.lb[1].spd*(pk?.8:.2),dt);
  if(g.ph=="pocket"&&(g.dl.some(d=>D(d,q)<1.2)||g.t>g.pk+1.5))return end("sack",q.x);
  if(g.ph=="fly"&&g.t>=g.T)land()}
function carry(dt){const g=G,c=g.cr,i=g.inp,sp=c.spd*.9*(c.sl>0?.55:1);c.sl=Math.max(0,c.sl-dt);
  const sv=i.on?cl((i.y-i.y0)/45,-1,1):0;c.x+=sp*dt;c.y+=sv*sp*.8*dt;c.vx=sp;c.vy=sv*sp*.8;
  if(c.x>=100)return end("td",c.x);if(c.y<0||c.y>FW)return end("oob",c.x);
  for(const d of g.dfs){d.cd-=dt;mv(d,c.x+c.vx*.3,c.y+c.vy*.3,d.spd*.95*(g.runp&&g.t<g.hold&&d.role=="DL"?.25:1),dt);
    if(d.cd<=0&&D(d,c)<1.15){if(Math.random()<cl(.7+(d.p.vis[0]-c.p.vis[0])/300,.5,.9))return end("tackle",c.x);d.cd=1.2;c.sl=.5}}}
function end(k,x){const g=G,q=g.qb.p,y=Math.round(x-g.x),cr=g.cr||g.qb;g.res={kind:k,x};g.ph="dead";g.tm=k=="td"?2.2:1.1;g.stop=k=="inc"||k=="oob"||k=="td";
  if(g.catcher&&k!="sack"&&k!="int"){st(q,"pyd",y);st(g.catcher.p,"recyd",y);if(k=="td"){st(q,"ptd",1);st(g.catcher.p,"rectd",1)}}
  else if(g.runp){st(g.rb.p,"car",1);st(g.rb.p,"ryd",y);if(k=="td")st(g.rb.p,"rtd",1)}
  const B={td:["TOUCHDOWN!!!",nm(cr.p)+" "+y+" yds"],sack:["SACKED",""],int:["INTERCEPTED",""],inc:["INCOMPLETE",""]}[k];g.bn=B?{a:B[0],b:B[1]}:null;g.bt=1.4;gui()}
function after(){const g=G,r=g.res,k=r.kind;
  if(k=="td"){g.sc[0]+=6;const ok=Math.random()<.93;if(ok)g.sc[0]++;return drive("TOUCHDOWN"+(ok?"":" (PAT missed)"),25,0)}
  if(k=="int")return drive("INTERCEPTED",100-r.x,.1);
  if(!g.stop)g.clk-=5;
  if(k!="inc"){g.x=cl(r.x,1,99);if(g.x>=g.fd){g.down=1}else g.down++}else g.down++;
  g.ytg=g.down==1?Math.min(10,100-g.x):g.fd-g.x;if(g.down==1)g.fd=g.x+g.ytg;
  if(g.down>4)return drive("TURNOVER ON DOWNS",100-g.x,.06);
  g.go=false;nextPre()}
function nextPre(){const g=G;if(g.clk<=0)qEnd();if(g.over)return final();setup()}
function qEnd(){const g=G;if(g.q>=4){g.over=true;g.clk=0}else{g.q++;g.clk=g.Q}}
function drive(msg,start,bonus){const g=G,oS=sa(g.op,"O"),dS=sa(g.my,"D");
  const pT=cl(.2+(oS-dS)/150+bonus+(start-25)/300,.05,.55),pF=.16+(start-25)/400,r=Math.random();let res,nx;
  if(r<pT){g.sc[1]+=7;res="TOUCHDOWN";nx=25}else if(r<pT+pF){g.sc[1]+=3;res="FIELD GOAL";nx=25}else{res=Math.random()<.2?"TURNOVER":"PUNT";nx=ri(20,42)}
  g.x=nx;g.down=1;g.ytg=10;g.fd=nx+10;g.go=false;g.clk-=ri(35,70);g.ph="sim";g.tm=2.6;g.bn={a:msg,b:g.opp.id+" drive: "+res};g.bt=9;gui()}
function special(k){const g=G,x=g.x;
  if(k=="fg"){const d=Math.round(117-x),kk=pl(g.my,"K",0),p=cl(.97-(d-22)*.014+(kk.vis[0]-70)/250,.04,.97);
    if(Math.random()<p){g.sc[0]+=3;return drive("FIELD GOAL GOOD",25,0)}return drive("FIELD GOAL MISSED",100-x,0)}
  const net=cl(ri(36,50)+(pl(g.my,"P",0).vis[0]-70)/8,28,60);drive("PUNT",x+net>=100?20:100-(x+net),-.04)}
function fin(){const g=G;if(g.clk<=0)qEnd();if(g.over)return final();setup()}
function final(){const g=G;g.ph="end";g.bn=null;gui()}
function finish(save){const c=S.career;if(save){const w=G.sc[0]>G.sc[1],l=G.sc[0]<G.sc[1];c.rec=c.rec||{w:0,l:0,t:0};w?c.rec.w++:l?c.rec.l++:c.rec.t++;
  c.log.push({wk:c.week,opp:G.opp.id,s:G.sc.slice()});c.week=Math.min(c.week+1,18);c.fans=cl(c.fans+(w?4:l?-4:0),0,100);c.morale=cl(c.morale+(w?3:l?-3:0),0,100)}
  cancelAnimationFrame(G.raf);G.el0.remove();G=null;S.view="home";if(save)window.save();render()}
function gui(){const g=G,e=g.gui;let h="";const B=(p,t)=>`<button class="btn" style="background:#17284fdd" data-p="${p}">${t}</button>`;
  if(g.ph=="pre"){if(g.down==4&&!g.go)h=B("go","Go for it")+B("punt","Punt")+(g.x>=52?B("fg","Field goal "+Math.round(117-g.x)+"y"):"");else h=B("quick","Quick pass")+B("deep","Deep pass")+B("run","Run")}
  if(g.ph=="end"){const L=[];for(const[p,m]of g.gs){if(m.att)L.push(`${nm(p)} QB ${m.cmp||0}/${m.att}, ${m.pyd||0} yds, ${m.ptd||0} TD, ${m.int||0} INT`);if(m.car)L.push(`${nm(p)} RB ${m.car} car, ${m.ryd||0} yds, ${m.rtd||0} TD`);if(m.rec)L.push(`${nm(p)} ${m.rec} rec, ${m.recyd||0} yds, ${m.rectd||0} TD`)}
    h=`<div style="background:#000c;border:2px solid #fff;border-radius:8px;padding:10px;display:inline-block;text-align:left;max-width:90%"><div style="font-size:18px;color:#f5c518">FINAL: ${g.my0.id} ${g.sc[0]} - ${g.opp.id} ${g.sc[1]} ${g.sc[0]>g.sc[1]?"WIN":g.sc[0]<g.sc[1]?"LOSS":"TIE"}</div>${L.join("<br>")}<br><button class="btn" style="background:#17284f" data-p="done">Continue</button></div>`}
  e.innerHTML=h+(g.ph!="end"?`<button class="btn" style="position:fixed;right:6px;top:22px;padding:3px 8px;background:#17284fdd" data-p="quit">X</button>`:"")}
function sprite(k,e){const[x,y]=scr(e.x,e.y),t=e.tm?G.dc:G.mc,sk=SKIN[e.p.face[0]],a=Math.floor(G.time*9+e.x*.7)%2,X=Math.round(x),Y=Math.round(y),u=U,R=(a,b,w,h,c)=>{k.fillStyle=c;k.fillRect(X+a*u,Y+b*u,w*u,h*u)};
  R(-3,-1,6,1.5,"#0004");R(-2,-3,2,3,"#ddd");R(0,-3-a*.5,2,3,"#ddd");R(-3,-8,6,5,t.c1);R(-3,-5,6,1,t.c2);R(-2,-12,4,4,sk);R(-2,-12.5,4,2,t.c1);
  if(G.ph=="pocket"&&G.el.includes(e)&&e!=G.rb||(G.ph=="pocket"&&e==G.rb)){k.fillStyle="#f5c518";k.font="bold 11px monospace";k.fillText("★",X-5,Y-15*u/2-4)}}
function draw(){const g=G,k=g.ctx,W=g.W,H=g.H,f=g.cr||(g.ph=="fly"?{x:g.bs.x+(g.tgt.x-g.bs.x)*cl(g.t/g.T,0,1),y:g.bs.y+(g.tgt.y-g.bs.y)*cl(g.t/g.T,0,1)}:g.qb);
  g.cam.x+=(f.x+(g.cr?4:7)-g.cam.x)*.1;g.cam.y+=(f.y-g.cam.y)*.1;g.cam.y=cl(g.cam.y,H/2/PPY-2,FW-H/2/PPY+2);
  k.imageSmoothingEnabled=false;k.fillStyle="#2c5a22";k.fillRect(0,0,W,H);
  const[s0,t0]=scr(0,0),yw=FW*PPY;for(let i=-10;i<110;i+=5){k.fillStyle=i<0||i>=100?(i<0?g.mc.c1:g.dc.c1):(i/5%2?"#4a8636":"#528f3c");k.fillRect(scr(i,0)[0],t0,5*PPY+1,yw)}
  k.fillStyle="#fffc";k.font="bold 22px monospace";k.textAlign="center";
  for(let i=0;i<=100;i+=5){const sx=scr(i,0)[0];k.fillRect(sx,t0,2,yw);if(i%10==0&&i>0&&i<100){k.fillText(String(Math.min(i,100-i)),sx,t0+9*PPY);k.fillText(String(Math.min(i,100-i)),sx,t0+yw-6*PPY)}}
  k.fillRect(0,t0-1,W,2);k.fillRect(0,t0+yw,W,2);k.fillStyle=g.mc.c2;k.font="bold 26px monospace";k.fillText(g.my0.name.toUpperCase(),scr(-5,0)[0],scr(0,26.6)[1]);k.fillStyle=g.dc.c2;k.fillText(g.opp.name.toUpperCase(),scr(105,0)[0],scr(0,26.6)[1]);
  if(g.ph=="pre"||g.ph=="pocket"){k.fillStyle="#3b5bdb";k.fillRect(scr(g.x,0)[0],t0,2,yw)}if(g.fd<=100){k.fillStyle="#ffd400";k.fillRect(scr(g.fd,0)[0],t0,2,yw)}
  const all=[...g.off,...g.dfs].sort((a,b)=>a.y-b.y);for(const e of all)sprite(k,e);
  // ball
  let b=g.cr||g.qb,bp=scr(b.x,b.y),z=0;if(g.ph=="fly"){const r=cl(g.t/g.T,0,1),p={x:g.bs.x+(g.tgt.x-g.bs.x)*r,y:g.bs.y+(g.tgt.y-g.bs.y)*r};bp=scr(p.x,p.y);z=Math.sin(Math.PI*r)*Math.min(70,g.T*60)}
  k.fillStyle="#0005";k.fillRect(bp[0]-4,bp[1],8,3);k.fillStyle="#7a3b12";k.fillRect(bp[0]-4,bp[1]-z-14,8,5);
  const i=g.inp;if(i.on&&g.ph=="pocket"&&Math.hypot(i.x-i.x0,i.y-i.y0)>=14){const q=g.qb,t=scr(q.x+(i.x-i.x0)/PPY*GAIN,q.y+(i.y-i.y0)/PPY*GAIN);k.strokeStyle="#ff3b3b";k.lineWidth=3;k.beginPath();k.moveTo(t[0]-8,t[1]);k.lineTo(t[0]+8,t[1]);k.moveTo(t[0],t[1]-8);k.lineTo(t[0],t[1]+8);k.stroke()}
  k.fillStyle="#000";k.fillRect(0,0,W,22);k.fillStyle="#fff";k.font="bold 14px monospace";k.textAlign="left";k.fillText(`${g.my0.id} ${g.sc[0]}  ${g.opp.id} ${g.sc[1]}`,10,16);k.textAlign="center";k.fillText(`Q${g.q}  ${clock(Math.max(0,g.clk))}`,W/2,16);k.textAlign="right";
  k.fillText(["1st","2nd","3rd","4th"][g.down-1]+" & "+(g.fd>=100?"Goal":Math.round(g.ytg)),W-40,16);
  const pn=g.cr||g.qb;k.textAlign="left";k.fillText(nm(pn.p)+" ["+pn.p.pos+"]",10,H-8);
  if(g.bn){k.fillStyle="#000b";k.fillRect(0,H/2-34,W,68);k.fillStyle="#f5f500";k.font="bold 30px monospace";k.textAlign="center";k.fillText(g.bn.a,W/2,H/2+2);k.fillStyle="#fff";k.font="bold 14px monospace";k.fillText(g.bn.b,W/2,H/2+24)}
  if(H>W){k.fillStyle="#000e";k.fillRect(0,0,W,H);k.fillStyle="#fff";k.font="bold 18px monospace";k.textAlign="center";k.fillText("Rotate to landscape",W/2,H/2)}}
function step(dt){const g=G;g.time+=dt;if(g.bn&&g.bt>0){g.bt-=dt;if(g.bt<=0&&g.ph!="sim")g.bn=null}
  const p=g.ph;if(p=="pocket"||p=="fly"||p=="run"){g.t+=dt;g.clk-=dt*CLK;p=="run"?carry(dt):air(dt)}
  else if(p=="dead"){g.tm-=dt;if(g.tm<=0)after()}else if(p=="sim"){g.tm-=dt;if(g.tm<=0)fin()}}
window.startGame=(c,oppId)=>{const my0=T(c.team),opp=T(oppId),el0=document.createElement("div"),cv=document.createElement("canvas"),gu=document.createElement("div");
  el0.style.cssText="position:fixed;inset:0;z-index:20;background:#000;touch-action:none";gu.style.cssText="position:absolute;left:0;right:0;bottom:6px;text-align:center;z-index:2";el0.appendChild(cv);el0.appendChild(gu);document.body.appendChild(el0);
  const dpr=window.devicePixelRatio||1,W=innerWidth,H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.cssText="width:100%;height:100%;display:block";const ctx=cv.getContext("2d");ctx.scale(dpr,dpr);
  const Q=(S.set.qmins||2)*60;G={my:c.league[my0.id],op:c.league[opp.id],my0,opp,mc:{c1:my0.c1,c2:my0.c2},dc:{c1:opp.c1,c2:opp.c2},el0,gui:gu,ctx,W,H,Q,q:1,clk:Q,sc:[0,0],x:25,down:1,ytg:10,fd:35,gs:new Map(),time:0,over:false,go:false};
  const g=G,P=e=>({x:e.clientX,y:e.clientY});
  el0.addEventListener("pointerdown",e=>{g.inp={on:1,x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY}});
  el0.addEventListener("pointermove",e=>{if(g.inp.on){g.inp.x=e.clientX;g.inp.y=e.clientY}});
  const up=e=>{const i=g.inp;if(i.on&&g.ph=="pocket")thr(i);i.on=0};el0.addEventListener("pointerup",up);el0.addEventListener("pointercancel",()=>g.inp.on=0);
  gu.addEventListener("click",e=>{const p=e.target.dataset&&e.target.dataset.p;if(!p)return;if(p=="done")finish(true);else if(p=="quit"){if(confirm("Quit this game? It will not count."))finish(false)}
    else if(p=="go"){g.go=true;gui()}else if(p=="punt"||p=="fg")special(p);else snap(p)});
  setup();let last=performance.now();const loop=n=>{if(!G)return;const dt=Math.min(.05,(n-last)/1000);last=n;step(dt);draw();g.raf=requestAnimationFrame(loop)};g.raf=requestAnimationFrame(loop);
  window.startGame.dbg=()=>({g,step,snap,thr,special,draw})};
})();
