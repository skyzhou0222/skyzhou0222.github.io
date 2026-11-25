import type { Work } from '../data/works';

type Entry=Work & {x:number;y:number};
type Group={id:string;title:string;center:[number,number];radius:[number,number]};
type Camera={x:number;y:number;zoom:number};
type Point={x:number;y:number};
type State={camera:Camera;mode:'map'|'list';group:string;selected:string;version:2};
const size={w:3400,h:2230};
const maxZoom=2;
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const middle=(a:Point,b:Point)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});

export function mountAtlas(root:HTMLElement){
  const el=<T extends HTMLElement>(s:string)=>root.querySelector<T>(s)!;
  const all=<T extends HTMLElement>(s:string)=>[...root.querySelectorAll<T>(s)];
  const payload=JSON.parse(el('[data-atlas-payload]').textContent!) as {works:Entry[];groups:Group[]};
  const works=new Map(payload.works.map(w=>[w.id,w])), groups=new Map(payload.groups.map(g=>[g.id,g]));
  const map=el('[data-map]'),vp=el('[data-viewport]'),layer=el('[data-world]'),list=el('[data-list]');
  const dialog=el<HTMLDialogElement>('[data-summary]'),full=el<HTMLAnchorElement>('[data-full]');
  const pins=all<HTMLButtonElement>('[data-pin]').map(node=>({node,entry:works.get(node.dataset.pin!)!}));
  const zones=all<HTMLButtonElement>('[data-zone]'), groupButtons=all<HTMLButtonElement>('[data-group]');
  const viewButtons=all<HTMLButtonElement>('[data-view]');
  const plus=el<HTMLButtonElement>('[data-zoom=in]'),minus=el<HTMLButtonElement>('[data-zoom=out]');
  const output=el<HTMLOutputElement>('[data-zoom-output]');
  const reduce=matchMedia('(prefers-reduced-motion:reduce)');
  let mode:State['mode']='map',group='all',selected='';
  const camera:Camera={x:0,y:0,zoom:1};
  const pts=new Map<number,Point>();
  let start:Point|null=null,moved=false,vel:Point={x:0,y:0},time=0;
  let anim=0,timer=0, goal:Camera|null=null, previousSize:Point|null=null;
  let focusBack:HTMLElement|null=null;
  function fitZoom(){
    return clamp(Math.min((vp.clientWidth-56)/(size.w-110),(vp.clientHeight-100)/(size.h-180)),.075,1);
  }
  function stayInBounds(){
    const w=vp.clientWidth,h=vp.clientHeight,z=camera.zoom;
    const padX=Math.min(180,w*.33),padY=Math.min(160,h*.30);
    camera.x=clamp(camera.x,padX-size.w*z,w-padX);
    camera.y=clamp(camera.y,padY-size.h*z,h-padY);
  }
  function paint(){
    if(!vp.clientWidth)return;
    stayInBounds();
    const {x,y,zoom:z}=camera,w=vp.clientWidth,h=vp.clientHeight;
    layer.style.transform=`translate3d(${x}px,${y}px,0) scale(${z})`;
    layer.style.setProperty('--atlas-inverse',String(1/z));
    vp.style.setProperty('--atlas-dot',76*z+'px');vp.style.setProperty('--atlas-grid',380*z+'px');
    vp.style.setProperty('--atlas-x',x+'px');vp.style.setProperty('--atlas-y',y+'px');
    output.value=Math.round(z*100)+'%';plus.disabled=z>=maxZoom-.002;minus.disabled=z<=fitZoom()+.002;
    for(const {node,entry} of pins){
      const u=(x+(entry.x+171)*z-w/2)/(w*.5+1),v=(y+(entry.y+145)*z-h/2)/(h*.5+1);
      const far=Math.hypot(u,v)>1.7;
      const lod=z<.48 || (z<.76&&far)?'pin':'card';
      if(node.dataset.lod!==lod)node.dataset.lod=lod;
    }
    layer.dataset.overview=String(z<.48);
  }
  function state():State{return {version:2,camera:{...camera},mode,group,selected};}
  function save(){
    const u=new URL(location.href);u.hash=selected;
    try{history.replaceState({...history.state,skyAtlas:state()},'',u);}catch{/* In-page navigation still works without persisted history. */}
  }
  function later(){clearTimeout(timer);timer=window.setTimeout(save,150);}
  function halt(){cancelAnimationFrame(anim);anim=0;goal=null;}
  function glide(target:Camera,animate=true,duration=330){
    halt();
    if(!animate||reduce.matches){Object.assign(camera,target);paint();later();return;}
    goal=target;
    const from={...camera},t0=performance.now();
    const step=(t:number)=>{
      const p=Math.min(1,(t-t0)/duration),k=1-Math.pow(1-p,3);
      camera.x=from.x+(target.x-from.x)*k;camera.y=from.y+(target.y-from.y)*k;camera.zoom=from.zoom+(target.zoom-from.zoom)*k;
      paint();
      if(p<1)anim=requestAnimationFrame(step);else{anim=0;goal=null;later();}
    };
    anim=requestAnimationFrame(step);
  }
  function center(wx:number,wy:number,zoom:number,animate=true){
    glide({x:vp.clientWidth/2-wx*zoom,y:(vp.clientHeight-37)/2-wy*zoom,zoom},animate);
  }
  function overview(animate=true){center(1700,1070,fitZoom(),animate);}
  function home(){
    const w=vp.clientWidth,h=vp.clientHeight;
    const z=w<620?clamp((w-52)/342,.71,.94):clamp(w/1710,.73,1.13);
    const left=w<620?(w-342*z)/2:w*.118;
    const top=w<620?Math.max(42,h*.15):Math.max(55,h*.14);
    glide({x:left-820*z,y:top-445*z,zoom:z},false);
  }
  function zoomAt(factor:number,p:Point){
    // Accumulate consecutive trackpad events against the destination so each zoom holds its pointer anchor.
    const old=goal??camera,z=clamp(old.zoom*factor,fitZoom(),maxZoom);
    glide({zoom:z,x:p.x-(p.x-old.x)*z/old.zoom,y:p.y-(p.y-old.y)*z/old.zoom},true,135);
  }
  function locate(id:string){
    const g=groups.get(id);
    if(!g){overview();return;}
    const list=payload.works.filter(w=>w.category===id);
    const minX=Math.min(...list.map(w=>w.x)),maxX=Math.max(...list.map(w=>w.x))+342;
    const minY=Math.min(...list.map(w=>w.y)),maxY=Math.max(...list.map(w=>w.y))+360;
    // Tight viewports land on a readable first card; the other cards remain within a swipe.
    if(vp.clientWidth<620){const first=list[0];center(first.x+171,first.y+155,clamp((vp.clientWidth-42)/342,.70,.99));}
    else center((minX+maxX)/2,(minY+maxY)/2,clamp(Math.min((vp.clientWidth-76)/(maxX-minX),(vp.clientHeight-110)/(maxY-minY)),.50,1.18));
  }
  function setGroup(id:string){
    group=groups.has(id)?id:'all';
    groupButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group===group)));
    pins.forEach(({node,entry})=>node.classList.toggle('is-muted',group!=='all'&&entry.category!==group));
    zones.forEach(node=>node.classList.toggle('is-muted',group!=='all'&&node.dataset.zone!==group));
    all('[data-list-group]').forEach(s=>s.hidden=group!=='all'&&s.dataset.listGroup!==group);
  }
  function setView(value:State['mode']){
    mode=value;root.dataset.mode=value;map.hidden=mode!=='map';list.hidden=mode!=='list';
    viewButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===mode)));
  }
  function fill(selector:string,value:string){el(selector).textContent=value;}
  function openSummary(id:string,source?:HTMLElement){
    const w=works.get(id);
    if(!w)return;
    halt();selected=id;focusBack=source??pins.find(p=>p.entry.id===id)?.node??vp;
    fill('[data-category]',groups.get(w.category)!.title);fill('[data-title]',w.title);
    fill('[data-problem]',w.problem);el('[data-problem-block]').hidden=!w.problem;
    fill('[data-description]',w.summary);el('[data-contribution-label]').hidden=!w.problem;
    fill('[data-role]',w.role);el('[data-role-row]').hidden=!w.role;
    fill('[data-stage-label]',w.stage?'项目阶段':'原文发布日期');fill('[data-stage]',w.stage||w.published);
    el<HTMLImageElement>('[data-summary-image]').src=w.cover;full.href=w.href;
    if(!dialog.open)dialog.showModal();
    dialog.scrollTop=0;el('[data-close]').focus({preventScroll:true});save();
  }
  function closeSummary(restoreFocus=true){
    if(dialog.open)dialog.close();
    selected='';
    if(restoreFocus)focusBack?.focus({preventScroll:true});
    focusBack=null;save();
  }
  function depart(ev:MouseEvent){
    const a=(ev.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if(!a)return;save();
    try{sessionStorage.setItem('skyAtlasReturn',JSON.stringify({page:a.href,state:state()}));}catch{}
  }
  function restore(){
    halt();
    if(dialog.open)dialog.close();
    selected='';
    const id=location.hash.slice(1);
    let s=history.state?.skyAtlas as State|undefined;
    if(!s){
      try{
        const item=JSON.parse(sessionStorage.getItem('skyAtlasReturn')||'null');
        if(item?.page && document.referrer && new URL(document.referrer).href.split('#')[0]===item.page && (!id||id===item.state?.selected)){
          s=item.state;sessionStorage.removeItem('skyAtlasReturn');
        }
      }catch{}
    }
    if(s?.version===2 && ['map','list'].includes(s.mode)&&s.camera&&Object.values(s.camera).every(Number.isFinite)&&(!id||id===s.selected)){
      setView(s.mode);setGroup(s.group);Object.assign(camera,s.camera);paint();
      if(s.selected)openSummary(s.selected);return;
    }
    setView('map');setGroup('all');home();
    if(works.has(id)){const w=works.get(id)!;center(w.x+171,w.y+130,camera.zoom,false);openSummary(id);}
  }
  function point(e:{clientX:number;clientY:number}):Point{
    const rect=vp.getBoundingClientRect();return{x:e.clientX-rect.left,y:e.clientY-rect.top};
  }
  function coast(){
    if(reduce.matches||performance.now()-time>100||Math.hypot(vel.x,vel.y)<.065){later();return;}
    let t0=performance.now();
    const tick=(t:number)=>{
      const dt=Math.min(40,t-t0);t0=t;
      const decay=Math.exp(-dt/150);vel.x*=decay;vel.y*=decay;
      camera.x+=vel.x*dt;camera.y+=vel.y*dt;paint();
      if(Math.hypot(vel.x,vel.y)>.025)anim=requestAnimationFrame(tick);else{anim=0;later();}
    };
    anim=requestAnimationFrame(tick);
  }
  all('[data-controls]').forEach(control=>control.hidden=false);
  const selectGroup=(id:string)=>{setGroup(id);if(mode==='map')locate(group);save();};
  groupButtons.forEach(b=>b.addEventListener('click',()=>selectGroup(b.dataset.group!)));
  zones.forEach(b=>b.addEventListener('click',()=>selectGroup(b.dataset.zone!)));
  viewButtons.forEach(b=>b.addEventListener('click',()=>{
    if(b.dataset.view===mode)return;
    halt();setView(b.dataset.view as State['mode']);if(mode==='map')paint();save();
  }));
  pins.forEach(({node,entry})=>node.addEventListener('click',()=>openSummary(entry.id,node)));
  el('[data-close]').addEventListener('click',()=>closeSummary());
  dialog.addEventListener('cancel',ev=>{ev.preventDefault();closeSummary();});
  dialog.addEventListener('click',ev=>{
    if(ev.target!==dialog)return;
    const rect=dialog.getBoundingClientRect();
    if(ev.clientX<rect.left||ev.clientX>rect.right||ev.clientY<rect.top||ev.clientY>rect.bottom)closeSummary();
  });
  full.addEventListener('click',depart);list.addEventListener('click',depart);
  el('[data-fit]').addEventListener('click',()=>{setGroup('all');overview();});
  const mid=()=>({x:vp.clientWidth/2,y:vp.clientHeight/2});
  plus.addEventListener('click',()=>zoomAt(1.35,mid()));minus.addEventListener('click',()=>zoomAt(1/1.35,mid()));
  vp.addEventListener('wheel',ev=>{
    ev.preventDefault();
    const pixels=ev.deltaY*(ev.deltaMode===1?16:ev.deltaMode===2?vp.clientHeight:1);
    zoomAt(Math.exp(-clamp(pixels,-180,180)*(ev.ctrlKey ? .009 : .0025)),point(ev));
  },{passive:false});
  vp.addEventListener('keydown',ev=>{
    if(ev.target!==vp)return;
    const dirs:Record<string,Point>={ArrowLeft:{x:90,y:0},ArrowRight:{x:-90,y:0},ArrowUp:{x:0,y:90},ArrowDown:{x:0,y:-90}};
    if(dirs[ev.key]){ev.preventDefault();const d=dirs[ev.key];glide({...camera,x:camera.x+d.x,y:camera.y+d.y},true,150);}
    if(['+','=','-'].includes(ev.key)){ev.preventDefault();zoomAt(ev.key==='-'?1/1.35:1.35,mid());}
    if(ev.key==='Home'){ev.preventDefault();setGroup('all');overview();}
  });
  // Tabbing through offscreen works should reveal the focused pin, without moving the camera when a dialog closes.
  vp.addEventListener('keydown',ev=>{
    if(ev.key!=='Tab')return;
    requestAnimationFrame(()=>{
      const node=document.activeElement;
      if(!(node instanceof HTMLElement)||!node.dataset.pin||selected)return;
      const work=works.get(node.dataset.pin)!,x=camera.x+(work.x+171)*camera.zoom,y=camera.y+(work.y+125)*camera.zoom;
      if(x<32||x>vp.clientWidth-32||y<32||y>vp.clientHeight-58)center(work.x+171,work.y+125,camera.zoom,false);
    });
  });
  vp.addEventListener('pointerdown',ev=>{
    if(ev.pointerType==='mouse'&&ev.button!==0)return;
    halt();const p=point(ev);pts.set(ev.pointerId,p);
    if(pts.size===1){start=p;moved=false;vel={x:0,y:0};time=performance.now();}
    else{moved=true;vel={x:0,y:0};}
  });
  window.addEventListener('pointermove',ev=>{
    if(!pts.has(ev.pointerId))return;
    const old=[...pts.values()],previous=pts.get(ev.pointerId)!,now=point(ev);
    pts.set(ev.pointerId,now);const current=[...pts.values()];
    if(current.length===1){
      if(!moved&&start&&dist(start,now)<5)return;
      const from=moved?previous:start??previous,dx=now.x-from.x,dy=now.y-from.y;
      const stamp=performance.now(),dt=Math.max(10,stamp-time);time=stamp;
      vel={x:clamp(vel.x*.34+dx/dt*.66,-2.7,2.7),y:clamp(vel.y*.34+dy/dt*.66,-2.7,2.7)};
      camera.x+=dx;camera.y+=dy;moved=true;
    }else if(current.length===2){
      const a=middle(old[0],old[1]),b=middle(current[0],current[1]);
      const z=clamp(camera.zoom*dist(current[0],current[1])/Math.max(1,dist(old[0],old[1])),fitZoom(),maxZoom);
      camera.x=b.x-(a.x-camera.x)*z/camera.zoom;camera.y=b.y-(a.y-camera.y)*z/camera.zoom;camera.zoom=z;
      moved=true;vel={x:0,y:0};
    }
    vp.classList.add('is-dragging');paint();
  });
  function release(ev:PointerEvent){
    if(!pts.delete(ev.pointerId))return;
    if(!pts.size){start=null;vp.classList.remove('is-dragging');if(moved&&ev.type!=='pointercancel')coast();else later();}
  }
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
  vp.addEventListener('click',ev=>{if(moved&&ev.detail){ev.preventDefault();ev.stopImmediatePropagation();}},true);
  window.addEventListener('pagehide',save);window.addEventListener('popstate',restore);
  window.addEventListener('hashchange',()=>{if(location.hash.slice(1)!==selected)restore();});
  restore();
  new ResizeObserver(()=>{
    const w=vp.clientWidth,h=vp.clientHeight;if(!w||!h)return;
    if(previousSize&&(previousSize.x!==w||previousSize.y!==h)){
      halt();camera.x+=(w-previousSize.x)/2;camera.y+=(h-previousSize.y)/2;
      camera.zoom=clamp(camera.zoom,fitZoom(),maxZoom);paint();later();
    }
    previousSize={x:w,y:h};
  }).observe(vp);
}
