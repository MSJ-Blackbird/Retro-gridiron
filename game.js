// Phase 2: playable offense. Defense and the opponent's drives are simulated.
(()=>{
const FW=53.3,PX=11,CLK=1.5,GAIN=2.3,U=2,SK=.8;
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),rr=(a,b)=>a+Math.random()*(b-a),ri=(a,b)=>Math.floor(rr(a,b+1)),D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
const SKIN=["#f2c9a0","#e0a878","#c68642","#8d5524","#5c3a21","#3b2416"];
// routes: [yards forward, yards lateral] from the start spot (lateral: + toward middle, - toward sideline)
const RT={go:[[35,0]],slant:[[4,0],[12,9]],out:[[8,0],[8,-9]],curl:[[10,0],[7.5,0]],flat:[[1,-9],[3,-17]],post:[[10,0],[24,9]]};
const PLAYS={quick:{WR1:"out",WR2:"slant",WR3:"curl",TE1:"flat",RB:"flat"},deep:{WR1:"go",WR2:"post",WR3:"go",TE1:"out",RB:"flat"}};
let G=null,PY=7;const PLN=["quick","deep"],PNM={quick:"Quick pass",deep:"Deep pass"};
const fillP=pos=>({name:"Filler",pos,num:0,vis:[35,35,35,35],attrs:[35,35,35,35],face:[1,0,1,0],stats:{}});
const pl=(ps,pos,i)=>ps.find(p=>p.pos==pos&&!p.bench&&p.slot===i)||(G.fc[pos+i]=G.fc[pos+i]||fillP(pos));
const sa=(ps,sd)=>avg(ps.filter(p=>!p.bench&&POS[p.pos].side==sd).map(p=>p.vis[0]));
const ent=(p,tm,role,x,y)=>({p,tm,role,x,y,vx:0,vy:0,spd:(5.5+p.vis[1]*.035)*SK,rt:null,ri:0,cd:0,sl:0});
const nm=p=>p.name.split(" ")[1]||p.name;
const st=(p,k,v)=>{p.stats=p.stats||{};p.stats[k]=(p.stats[k]||0)+v;const m=G.gs.get(p)||{};m[k]=(m[k]||0)+v;G.gs.set(p,m)};
const mv=(e,tx,ty,sp,dt)=>{const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy);if(d<.05)return true;const s=Math.min(d,sp*dt);e.x+=dx/d*s;e.y+=dy/d*s;e.vx=dx/d*sp;e.vy=dy/d*sp;return d<=s+.001};
const scr=(x,y)=>[(x-G.cam.x)*PX+G.W/2,(y-FW/2)*PY+G.H/2+10],lerp=(g,r)=>({x:g.bs.x+(g.tgt.x-g.bs.x)*r,y:g.bs.y+(g.tgt.y-g.bs.y)*r});
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
  Object.assign(g,{cr:null,rec:null,catcher:null,runp:false,t:0,ph:"pre",stop:false,qr:null,tk:null,inp:{on:0}});route();g.cam=g.cam||{x:los,y:c};gui()}
function route(){const g=G,p=PLAYS[PLN[g.pi]];for(const r of g.el){const s=r.y<26.65?1:-1;r.rt=RT[p[r.role]].map(([f,l])=>[r.x+f,r.y+s*l]);r.ri=0}}
function snap(k,rec){const g=G;if(g.ph!="pre")return;g.t=0;g.kind=k;g.qr=rec||null;
  const blk=avg(g.off.filter(e=>e.role=="OL").map(e=>e.p.vis[0])),rs=avg(g.dl.map(e=>e.p.vis[0]));
  g.pk=cl(4.3+(blk-rs)/20+rr(-.3,.3),3,7);g.hold=cl(1.1+(blk-rs)/50,.6,2.2);g.runp=k=="run"||k=="qb";g.ph="set";g.sn=k=="pass"?.25:.35;gui()}
function launch(){const g=G;if(g.runp){const hy=[24.6,26.7,28.8][ri(0,2)]+rr(-.4,.4);g.hy=hy;g.dl.forEach(d=>{d.ty=Math.abs(d.y-hy)<2.4?hy+(d.y<hy?-2.4:2.4):d.y});g.cr=g.kind=="qb"?g.qb:g.rb;g.ph="run"}else g.ph="pocket";g.t=0;gui()}
function pre(i,d,dx,dy){if(d<14){let b=null,bd=45;for(const r of G.el){const s=scr(r.x,r.y),n=Math.hypot(s[0]-i.x,s[1]-12-i.y);if(n<bd){bd=n;b=r}}if(b)b==G.rb?snap("run"):snap("quick",b);return}
  if(dx>40&&Math.abs(dx)>Math.abs(dy)*1.2)return snap("qb");if(dx<-30)snap("pass")}
function moves(dx,dy){const c=G.cr;if(!c||c.dv>0)return;if(dx>0&&Math.abs(dx)>=Math.abs(dy)){c.dv=.35;return}if((c.jcd||0)<=0){c.jk=.35;c.jcd=1.3;c.jy=(dy<0?-1:1)*14}}
function kneel(){const g=G;if(g.ph!="pre")return;g.res={kind:"knee",x:g.x-1};g.ph="dead";g.tm=.9;g.stop=false;g.bn={a:"TAKES A KNEE",b:""};g.bt=1;g.runp=false;g.catcher=null;gui()}
const follow=(e,dt)=>{if(e.rt&&e.ri<e.rt.length&&mv(e,e.rt[e.ri][0],e.rt[e.ri][1],e.spd,dt))e.ri++};
function proj(e,T){let x=e.x,y=e.y,k=e.ri,s=e.spd*T;while(s>0&&e.rt&&k<e.rt.length){const[tx,ty]=e.rt[k],d=Math.hypot(tx-x,ty-y);if(d<=s){x=tx;y=ty;s-=d;k++}else{x+=(tx-x)/d*s;y+=(ty-y)/d*s;s=0}}return{x,y}}
function fire(tx,ty){const g=G,q=g.qb;tx=Math.max(tx,q.x-1);ty=cl(ty,.5,FW-.5);g.tgt={x:tx,y:ty};g.T=Math.max(.4,Math.hypot(tx-q.x,ty-q.y)/18);
  let b=null,bd=1e9;for(const r of g.el){const p=proj(r,g.T),d=Math.hypot(p.x-tx,p.y-ty);if(d<bd){bd=d;b=r}}
  g.rec=bd<11?b:null;g.bs={x:q.x,y:q.y};g.ph="fly";g.t=0;st(q.p,"att",1);gui()}
function thr(i){const g=G,q=g.qb,dx=i.x0-i.x,dy=i.y0-i.y;
  if(Math.hypot(dx,dy)<14){let b=null,bd=80;for(const r of g.el){const s=scr(r.x,r.y),d=Math.hypot(s[0]-i.x,s[1]-i.y);if(d<bd){bd=d;b=r}}if(!b)return;const p=proj(b,Math.max(.4,D(q,b)/18));return fire(p.x,p.y)}
  fire(q.x+dx/PX*GAIN,q.y+dy/PX*GAIN)}
function land(){const g=G,t=g.tgt,r=g.rec,q=g.qb.p;if(!r||D(r,t)>3.6)return end("inc",g.x);
  const d=g.dfs.reduce((a,b)=>D(a,t)<D(b,t)?a:b),dd=D(d,t),len=Math.hypot(t.x-g.qb.x,t.y-g.qb.y);
  let pc=.5+r.p.vis[0]/180+(q.attrs[0]-60)/400-(dd<2.2?.3*d.p.vis[0]/100:0);if(len>25)pc*=cl(.55+q.attrs[1]/200,.5,1);pc=cl(pc,.12,.95);
  if(Math.random()<pc){g.cr=r;g.catcher=r;g.ph="run";g.t=0;g.hold=0;st(q,"cmp",1);st(r.p,"rec",1);return}
  if(dd<2.2&&Math.random()<.2+.35*d.p.vis[0]/100){st(q,"int",1);return end("int",t.x)}
  end("inc",g.x)}
function air(dt){const g=G,q=g.qb;if(g.ph=="pocket"&&g.qr&&g.t>=.3){const b=g.qr;g.qr=null;const p=proj(b,Math.max(.4,D(q,b)/18));return fire(p.x,p.y)}
  for(const r of g.el)if(g.ph=="fly"&&r==g.rec)mv(r,g.tgt.x,g.tgt.y,r.spd*1.1,dt);else follow(r,dt);
  for(const[d,r,c]of g.cov)mv(d,r.x+c,r.y,d.spd*(.8+d.p.vis[0]/500),dt);
  if(g.ph=="fly")for(const d of g.dfs.slice().sort((a,b)=>D(a,g.tgt)-D(b,g.tgt)).slice(0,2))mv(d,g.tgt.x,g.tgt.y,d.spd*.9,dt);
  const pk=g.t>g.pk;for(const d of g.dl)mv(d,q.x,q.y,d.spd*(pk?.95:.15),dt);mv(g.lb[1],q.x+3,q.y,g.lb[1].spd*(pk?.8:.2),dt);
  if(g.ph=="pocket"&&(g.dl.some(d=>D(d,q)<1.2)||g.t>g.pk+2))return end("sack",q.x);
  if(g.ph=="fly"&&g.t>=g.T)land()}
function carry(dt){const g=G,c=g.cr,i=g.inp,held=d=>g.runp&&g.t<g.hold&&d.role=="DL";
  const fade=cl((g.t-(2+c.p.vis[3]/40))*.08,0,.3);c.tire=fade/.3;
  const sp=c.spd*(1-fade)*(c.bs>0?1.2:.95)*(c.sl>0?.6:1);c.bs=Math.max(0,(c.bs||0)-dt);c.jk=Math.max(0,(c.jk||0)-dt);c.jcd=Math.max(0,(c.jcd||0)-dt);
  if(c.dv>0){c.dv-=dt;c.pr=1;c.x+=sp*2.3*dt;if(c.x>=100)return end("td",c.x);if(c.dv<=0)return end("tackle",c.x);for(const d of g.dfs)if(!(d.gr>0))mv(d,c.x,c.y,d.spd*.95,dt);return}
  const sv=i.on?cl((i.y-i.y0)/45,-1,1):0,vy=sv*sp*.6,vx=Math.sqrt(sp*sp-vy*vy);
  c.x+=vx*dt;c.y+=(vy+(c.jy||0))*dt;c.jy=(c.jy||0)*.85;c.vx=vx;c.vy=vy;
  if(c.x>=100)return end("td",c.x);if(c.y<0||c.y>FW)return end("oob",c.x);
  for(const e of g.off)if(e.role=="OL")mv(e,g.x+.8,e.y,2.5,dt);
  for(const d of g.dfs){d.cd-=dt;if(d.gr>0){d.gr-=dt;continue}const h=held(d);
    if(h)mv(d,d.x+.01,d.ty,d.spd*.6,dt);else mv(d,c.x+c.vx*.3,c.y+c.vy*.3,d.spd*.95,dt);
    if(d.cd<=0&&D(d,c)<1.35){d.cd=1.5;const win=c.jk>0,p=cl(.72+(d.p.vis[0]-c.p.vis[0])/300,.5,.9)*(h?.45:1)*(win?.45:1);
      if(Math.random()<p){d.gr=1.4;d.x=c.x+.5;d.y=c.y;if(Math.random()<.12&&!win){c.x+=rr(1.5,3.5)}return end("tackle",c.x)}
      d.gr=1.3;c.bs=.5}}
  const f=g.dfs.filter(d=>!(d.gr>0));for(let a=0;a<f.length;a++)for(let b=a+1;b<f.length;b++){const p=f[a],q=f[b],d=D(p,q);if(d<.7&&d>.001){const m=(.7-d)/2/d,ox=(p.x-q.x)*m,oy=(p.y-q.y)*m;p.x+=ox;p.y+=oy;q.x-=ox;q.y-=oy}}}
function end(k,x){const g=G,q=g.qb.p,y=Math.round(x-g.x),cr=g.cr||g.qb;g.res={kind:k,x};if(k=="tackle"&&g.cr)g.cr.pr=1;g.ph="dead";g.tm=k=="td"?2.2:k=="inc"?1.7:1.1;g.stop=k=="inc"||k=="oob"||k=="td";
  if(g.catcher&&k!="sack"&&k!="int"){st(q,"pyd",y);st(g.catcher.p,"recyd",y);if(k=="td"){st(q,"ptd",1);st(g.catcher.p,"rectd",1)}}
  else if(g.runp){const rp=g.cr.p;st(rp,"car",1);st(rp,"ryd",y);if(k=="td")st(rp,"rtd",1)}
  const B={td:["TOUCHDOWN!!!",nm(cr.p)+" "+y+" yds"],sack:["SACKED",""],int:["INTERCEPTED",""],inc:["INCOMPLETE",""]}[k];g.bn=B?{a:B[0],b:B[1]}:null;g.bt=1.4;gui()}
function after(){const g=G,r=g.res,k=r.kind;
  if(k=="td"){g.sc[0]+=6;const ok=Math.random()<.93;if(ok)g.sc[0]++;return drive("TOUCHDOWN"+(ok?"":" (PAT missed)"),25,0)}
  if(k=="int")return drive("INTERCEPTED",100-r.x,.1);
  if(k=="knee")g.clk-=22;if(!g.stop)g.clk-=5;
  if(k!="inc"){g.x=cl(r.x,1,99);if(g.x>=g.fd){g.down=1}else g.down++}else g.down++;
  g.ytg=g.down==1?Math.min(10,100-g.x):g.fd-g.x;if(g.down==1)g.fd=g.x+g.ytg;
  if(g.down>4)return drive("TURNOVER ON DOWNS",100-g.x,.06);
  g.go=false;nextPre()}
function nextPre(){const g=G;if(g.clk<=0)qEnd();if(g.over)return final();g.wait=.5;setup()}
function qEnd(){const g=G;if(g.q>=4){g.over=true;g.clk=0}else{g.q++;g.clk=g.Q}}
function drive(msg,start,bonus){const g=G,oS=sa(g.op,"O"),dS=sa(g.my,"D");
  const pT=cl(.2+(oS-dS)/150+bonus+(start-25)/300,.05,.55),pF=.16+(start-25)/400,r=Math.random();let res,nx;
  if(r<pT){g.sc[1]+=7;res="TOUCHDOWN";nx=25}else if(r<pT+pF){g.sc[1]+=3;res="FIELD GOAL";nx=25}else{res=Math.random()<.2?"TURNOVER":"PUNT";nx=ri(20,42)}
  g.x=nx;g.down=1;g.ytg=10;g.fd=nx+10;g.go=false;g.clk-=ri(35,70);g.ph="sim";g.tm=3.4;g.bn={a:msg,b:g.opp.id+" drive: "+res};g.bt=9;gui()}
function special(k){const g=G,x=g.x;
  if(k=="fg"){const d=Math.round(117-x),kk=pl(g.my,"K",0),p=cl(.97-(d-22)*.014+(kk.vis[0]-70)/250,.04,.97);
    if(Math.random()<p){g.sc[0]+=3;return drive("FIELD GOAL GOOD",25,0)}return drive("FIELD GOAL MISSED",100-x,0)}
  const net=cl(ri(36,50)+(pl(g.my,"P",0).vis[0]-70)/8,28,60);drive("PUNT",x+net>=100?20:100-(x+net),-.04)}
function fin(){const g=G;g.bn=null;if(g.clk<=0)qEnd();if(g.over)return final();g.wait=1;setup()}
function final(){const g=G;g.ph="end";g.bn=null;gui()}
function finish(save){const c=S.career;if(save){const w=G.sc[0]>G.sc[1],l=G.sc[0]<G.sc[1];c.rec=c.rec||{w:0,l:0,t:0};w?c.rec.w++:l?c.rec.l++:c.rec.t++;
  c.log.push({wk:c.week,opp:G.opp.id,s:G.sc.slice()});c.week=Math.min(c.week+1,18);c.fans=cl(c.fans+(w?4:l?-4:0),0,100);c.morale=cl(c.morale+(w?3:l?-3:0),0,100)}
  cancelAnimationFrame(G.raf);G.el0.remove();G=null;S.view="home";if(save)window.save();render()}
function gui(){const g=G,e=g.gui;let h="";const B=(p,t)=>`<button class="btn" style="background:#17284fdd" data-p="${p}">${t}</button>`;
  if(g.ph=="pre"&&!(g.wait>0)){if(g.down==4&&!g.go)h=B("go","Go for it")+B("punt","Punt")+(g.x>=52?B("fg","Field goal "+Math.round(117-g.x)+"y"):"");else h=`<div style="position:fixed;right:46px;top:24px">${B("chg","Change play: "+PNM[PLN[g.pi]])}</div><div style="position:fixed;left:6px;bottom:26px">${B("knee","Kneel")}</div>`}
  if(g.ph=="end"){const L=[...g.gs].filter(([p,m])=>m.att||m.car||m.rec).map(([p,m])=>`${nm(p)}: ${m.att?`${m.cmp||0}/${m.att} ${m.pyd||0}yd ${m.ptd||0}TD ${m.int||0}INT `:""}${m.car?`${m.car} car ${m.ryd||0}yd ${m.rtd||0}TD `:""}${m.rec?`${m.rec} rec ${m.recyd||0}yd ${m.rectd||0}TD`:""}`);
    h=`<div style="display:inline-block;width:min(92vw,560px);background:#000d;border:2px solid #fff;border-radius:8px;padding:8px;text-align:left"><div style="font-size:16px;color:#f5c518">FINAL: ${g.my0.id} ${g.sc[0]} - ${g.opp.id} ${g.sc[1]} ${g.sc[0]>g.sc[1]?"WIN":g.sc[0]<g.sc[1]?"LOSS":"TIE"}</div><div style="max-height:calc(100vh - 150px);overflow:auto;font-size:12px;margin:4px 0">${L.join("<br>")}</div><div style="text-align:center"><button class="btn" style="background:#17284f" data-p="done">Continue</button></div></div>`}
  e.innerHTML=h+(g.ph!="end"?`<button class="btn" style="position:fixed;right:6px;top:22px;padding:3px 8px;background:#17284fdd" data-p="quit">X</button>`:"")}
function sprite(k,e){const[x,y]=scr(e.x,e.y),t=e.tm?G.dc:G.mc,sk=SKIN[e.p.face[0]],tr=e.tire||0,a=Math.floor(G.time*(9-4*tr)+e.x*.7)%2,X=Math.round(x),Y=Math.round(y),u=U,R=(a,b,w,h,c)=>{k.fillStyle=c;k.fillRect(X+a*u,Y+b*u,w*u,h*u)};
  R(-3,-1,6,1.5,"#0004");if(e.gr>0||e.pr){R(-5,-4,10,3,t.c1);R(-5,-4,10,1,t.c2);R(5,-4,3,3,sk);return}R(-2,-3,2,3,"#ddd");R(0,-3-a*.5,2,3,"#ddd");R(-3,-8,6,5,t.c1);R(-3,-5,6,1,t.c2);R(-2,-12+tr*1.5,4,4,sk);R(-2,-12.5+tr*1.5,4,2,t.c1);
  if(G.ph=="pocket"&&G.el.includes(e)){k.fillStyle="#f5c518";k.font="bold 11px monospace";k.fillText("★",X-5,Y-15*u/2-4)}}
function dots(k,a,b,col){const len=Math.hypot(b.x-a.x,b.y-a.y),h=Math.min(60,len*1.6);k.fillStyle=col;for(let n=1;n<=14;n++){const r=n/14,p=scr(a.x+(b.x-a.x)*r,a.y+(b.y-a.y)*r);k.fillRect(p[0]-1.5,p[1]-Math.sin(Math.PI*r)*h-1.5,3,3)}}
function draw(){const g=G;if(innerWidth!=g.W||innerHeight!=g.H){g.W=innerWidth;g.H=innerHeight;PY=(g.H-34)/FW;g.cv.width=g.W*g.dpr;g.cv.height=g.H*g.dpr;g.ctx.setTransform(g.dpr,0,0,g.dpr,0,0)}const k=g.ctx,W=g.W,H=g.H,f=g.cr||(g.ph=="fly"?lerp(g,cl(g.t/g.T,0,1)):g.qb);
  g.cam.x+=(f.x+(g.cr?4:7)-g.cam.x)*.1;k.imageSmoothingEnabled=false;k.fillStyle="#2c5a22";k.fillRect(0,0,W,H);
  const t0=scr(0,0)[1],yw=FW*PY;
  for(let i=-10;i<110;i+=5){k.fillStyle=i<0||i>=100?(i<0?g.mc.c1:g.dc.c1):(i/5%2?"#4a8636":"#528f3c");k.fillRect(scr(i,0)[0],t0,5*PX+1,yw)}
  k.fillStyle="#fffc";k.font="bold 20px monospace";k.textAlign="center";
  for(let i=0;i<=100;i+=5){const sx=scr(i,0)[0];k.fillRect(sx,t0,2,yw);if(i%10==0&&i>0&&i<100){const n=String(Math.min(i,100-i));k.fillText(n,sx,t0+8*PY);k.fillText(n,sx,t0+yw-3*PY)}}
  k.fillRect(0,t0-1,W,2);k.fillRect(0,t0+yw,W,2);k.fillStyle=g.mc.c2;k.font="bold 24px monospace";k.fillText(g.my0.name.toUpperCase(),scr(-5,0)[0],scr(0,26.6)[1]);k.fillStyle=g.dc.c2;k.fillText(g.opp.name.toUpperCase(),scr(105,0)[0],scr(0,26.6)[1]);
  if(g.ph=="pre"||g.ph=="set"||g.ph=="pocket"){k.fillStyle="#3b5bdb";k.fillRect(scr(g.x,0)[0],t0,2,yw)}if(g.fd<=100){k.fillStyle="#ffd400";k.fillRect(scr(g.fd,0)[0],t0,2,yw)}
  if((g.ph=="pre"||g.ph=="set"||g.ph=="pocket")&&!g.runp){k.strokeStyle="#a6ff6a";k.lineWidth=2;for(const r of g.el)if(r.rt&&r.ri<r.rt.length){k.beginPath();const s=scr(r.x,r.y);k.moveTo(s[0],s[1]);for(let j=r.ri;j<r.rt.length;j++){const w=scr(r.rt[j][0],r.rt[j][1]);k.lineTo(w[0],w[1])}k.stroke();const e=scr(r.rt[r.rt.length-1][0],r.rt[r.rt.length-1][1]);k.fillStyle="#a6ff6a";k.fillRect(e[0]-3,e[1]-3,6,6)}}
  if(g.runp&&g.ph=="run"&&g.t<g.hold+1){k.fillStyle="#ffd400";k.font="bold 22px monospace";const h=scr(g.x+2.5,g.hy);k.fillText("»",h[0],h[1]+6)}
  const all=[...g.off,...g.dfs].sort((a,b)=>a.y-b.y);for(const e of all)sprite(k,e);
  let b=g.cr||g.qb,bp=scr(b.x,b.y),z=0;if(g.ph=="dead"&&g.res.kind=="inc"&&g.tgt)bp=scr(g.tgt.x,g.tgt.y);if(g.ph=="fly"){const r=cl(g.t/g.T,0,1),p=lerp(g,r);bp=scr(p.x,p.y);z=Math.sin(Math.PI*r)*Math.min(60,Math.hypot(g.tgt.x-g.bs.x,g.tgt.y-g.bs.y)*1.6);dots(k,g.bs,g.tgt,"#fff6")}
  k.fillStyle="#0005";k.fillRect(bp[0]-4,bp[1],8,3);k.fillStyle="#7a3b12";k.fillRect(bp[0]-4,bp[1]-z-14,8,5);
  const i=g.inp;if(i.on&&g.ph=="pocket"&&Math.hypot(i.x-i.x0,i.y-i.y0)>=14){const q=g.qb,a={x:q.x,y:q.y},e={x:Math.max(q.x-1,q.x+(i.x0-i.x)/PX*GAIN),y:cl(q.y+(i.y0-i.y)/PX*GAIN,.5,FW-.5)},t=scr(e.x,e.y);dots(k,a,e,"#fff");k.strokeStyle="#ff3b3b";k.lineWidth=3;k.beginPath();k.moveTo(t[0]-8,t[1]);k.lineTo(t[0]+8,t[1]);k.moveTo(t[0],t[1]-8);k.lineTo(t[0],t[1]+8);k.stroke()}
  k.fillStyle="#000";k.fillRect(0,0,W,22);k.fillStyle="#fff";k.font="bold 14px monospace";k.textAlign="left";k.fillText(`${g.my0.id} ${g.sc[0]}  ${g.opp.id} ${g.sc[1]}`,10,16);k.textAlign="center";k.fillText(`Q${g.q}  ${clock(Math.max(0,g.clk))}`,W/2,16);k.textAlign="right";
  k.fillText(["1st","2nd","3rd","4th"][g.down-1]+" & "+(g.fd>=100?"Goal":Math.round(g.ytg)),W-40,16);
  const pn=g.cr||g.qb;k.textAlign="left";k.fillText(nm(pn.p)+" ["+pn.p.pos+"]",10,H-8);if(g.ph=="pre"&&!(g.wait>0)){k.textAlign="center";k.font="12px monospace";k.fillText("Drag back: snap   Swipe forward: QB run   Tap a player: quick pass   Tap RB: run",W/2,H-8)}
  if(g.bn){k.fillStyle="#000b";k.fillRect(0,H/2-34,W,68);k.fillStyle="#f5f500";k.font="bold 30px monospace";k.textAlign="center";k.fillText(g.bn.a,W/2,H/2+2);k.fillStyle="#fff";k.font="bold 14px monospace";k.fillText(g.bn.b,W/2,H/2+24)}
  if(H>W){k.fillStyle="#000e";k.fillRect(0,0,W,H);k.fillStyle="#fff";k.font="bold 18px monospace";k.textAlign="center";k.fillText("Rotate to landscape",W/2,H/2)}}
function step(dt){const g=G;g.time+=dt;if(g.bn&&g.bt>0){g.bt-=dt;if(g.bt<=0&&g.ph!="sim")g.bn=null}
  const p=g.ph;if(p=="set"){g.sn-=dt;if(g.sn<=0)launch()}
  else if(p=="pocket"||p=="fly"||p=="run"){g.t+=dt;g.clk-=dt*CLK;p=="run"?carry(dt):air(dt)}
  else if(p=="dead"){g.tm-=dt;if(g.tm<=0)after()}else if(p=="sim"){g.tm-=dt;if(g.tm<=0)fin()}
  else if(p=="pre"&&g.wait>0){g.wait-=dt;if(g.wait<=0)gui()}}
window.startGame=(c,oppId)=>{const my0=T(c.team),opp=T(oppId),el0=document.createElement("div"),cv=document.createElement("canvas"),gu=document.createElement("div");
  el0.style.cssText="position:fixed;inset:0;z-index:20;background:#000;touch-action:none";gu.style.cssText="position:absolute;left:0;right:0;bottom:6px;text-align:center;z-index:2";el0.appendChild(cv);el0.appendChild(gu);document.body.appendChild(el0);
  const dpr=window.devicePixelRatio||1,W=innerWidth,H=innerHeight;PY=(H-34)/FW;cv.width=W*dpr;cv.height=H*dpr;cv.style.cssText="width:100%;height:100%;display:block";const ctx=cv.getContext("2d");ctx.scale(dpr,dpr);
  const Q=(S.set.qmins||2)*60;G={my:c.league[my0.id],op:c.league[opp.id],my0,opp,mc:{c1:my0.c1,c2:my0.c2},dc:{c1:opp.c1,c2:opp.c2},el0,gui:gu,ctx,W,H,Q,q:1,clk:Q,sc:[0,0],x:25,down:1,ytg:10,fd:35,gs:new Map(),fc:{},pi:0,cv,dpr,time:0,over:false,go:false};
  const g=G,P=e=>({x:e.clientX,y:e.clientY});
  el0.addEventListener("pointerdown",e=>{if(e.target.closest&&e.target.closest("button"))return;g.inp={on:1,x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,t0:e.timeStamp}});
  el0.addEventListener("pointermove",e=>{if(g.inp.on){g.inp.x=e.clientX;g.inp.y=e.clientY}});
  const up=e=>{const i=g.inp;if(!i.on)return;i.on=0;const dx=i.x-i.x0,dy=i.y-i.y0,d=Math.hypot(dx,dy);
    if(g.ph=="pocket")thr({...i});else if(g.ph=="pre"&&!(g.wait>0))pre(i,d,dx,dy);else if(g.ph=="run"&&d>=28&&e.timeStamp-i.t0<280)moves(dx,dy)};el0.addEventListener("pointerup",up);el0.addEventListener("pointercancel",()=>g.inp.on=0);
  gu.addEventListener("click",e=>{const p=e.target.dataset&&e.target.dataset.p;if(!p)return;if(p=="done")finish(true);else if(p=="quit"){if(confirm("Quit this game? It will not count."))finish(false)}
    else if(p=="go"){g.go=true;gui()}else if(p=="punt"||p=="fg")special(p);else if(p=="chg"){g.pi=(g.pi+1)%PLN.length;route();gui()}else if(p=="knee")kneel()});
  setup();let last=performance.now();const loop=n=>{if(!G)return;const dt=Math.min(.05,(n-last)/1000);last=n;step(dt);draw();g.raf=requestAnimationFrame(loop)};g.raf=requestAnimationFrame(loop);
  window.startGame.dbg=()=>({g,step,snap,thr,special,draw})};
})();
