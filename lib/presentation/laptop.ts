/** Decorative scenes use fictional requests and never read application data. */
type Context = CanvasRenderingContext2D;
type Point = [number, number];
const width = 1200, height = 760;
const corners: Point[] = [[118, 143], [1018, 117], [1089, 656], [176, 722]];

function screenProjection() {
  const source: Point[] = [[0, 0], [width, 0], [width, height], [0, height]];
  const matrix: number[][] = [];
  source.forEach(([x, y], index) => {
    const [u, v] = corners[index];
    matrix.push([x, y, 1, 0, 0, 0, -u*x, -u*y, u], [0, 0, 0, x, y, 1, -v*x, -v*y, v]);
  });
  for (let column=0; column<8; column++) {
    let pivot=column;
    for (let row=column+1; row<8; row++) if (Math.abs(matrix[row][column])>Math.abs(matrix[pivot][column])) pivot=row;
    [matrix[column], matrix[pivot]]=[matrix[pivot], matrix[column]];
    const divisor=matrix[column][column];
    for (let j=column; j<9; j++) matrix[column][j]/=divisor;
    for (let row=0; row<8; row++) {
      if (row===column) continue;
      const factor=matrix[row][column];
      for (let j=column; j<9; j++) matrix[row][j]-=factor*matrix[column][j];
    }
  }
  const [a,b,c,d,e,f,g,h]=matrix.map(row=>row[8]);
  return (x:number,y:number):Point => [(a*x+b*y+c)/(g*x+h*y+1),(d*x+e*y+f)/(g*x+h*y+1)];
}

const project=screenProjection();
const tiles: { source: Point[]; target: Point[] }[]=[];
for (let row=0; row<8; row++) for (let column=0; column<12; column++) {
  const x=column*width/12,y=row*height/8,x2=(column+1)*width/12,y2=(row+1)*height/8;
  for (const source of [[[x,y],[x2,y],[x2,y2]],[[x,y],[x2,y2],[x,y2]]] as Point[][]) tiles.push({source,target:source.map(([u,v])=>project(u,v))});
}

function triangle(ctx:Context, source:HTMLCanvasElement, from:Point[], to:Point[]) {
  const [[x0,y0],[x1,y1],[x2,y2]]=from,[[u0,v0],[u1,v1],[u2,v2]]=to;
  const det=x0*(y1-y2)+x1*(y2-y0)+x2*(y0-y1);
  const a=(u0*(y1-y2)+u1*(y2-y0)+u2*(y0-y1))/det;
  const b=(v0*(y1-y2)+v1*(y2-y0)+v2*(y0-y1))/det;
  const c=(u0*(x2-x1)+u1*(x0-x2)+u2*(x1-x0))/det;
  const d=(v0*(x2-x1)+v1*(x0-x2)+v2*(x1-x0))/det;
  const e=(u0*(x1*y2-x2*y1)+u1*(x2*y0-x0*y2)+u2*(x0*y1-x1*y0))/det;
  const f=(v0*(x1*y2-x2*y1)+v1*(x2*y0-x0*y2)+v2*(x0*y1-x1*y0))/det;
  const center:Point=[(u0+u1+u2)/3,(v0+v1+v2)/3];
  ctx.save();ctx.beginPath();
  to.forEach(([x,y],index)=>{const u=center[0]+(x-center[0])*1.006,v=center[1]+(y-center[1])*1.006;index?ctx.lineTo(u,v):ctx.moveTo(u,v);});
  ctx.closePath();ctx.clip();ctx.transform(a,b,c,d,e,f);ctx.drawImage(source,0,0);ctx.restore();
}

export function paintLaptop(ctx:Context, photo:HTMLImageElement, screen:HTMLCanvasElement, seconds=0) {
  const progress=Math.min(1,seconds/28),smooth=progress*progress*(3-2*progress),scale=1+.016*smooth;
  ctx.clearRect(0,0,1448,1086);ctx.save();ctx.translate(724,543);ctx.scale(scale,scale);ctx.translate(-724, -543);
  ctx.drawImage(photo,0,0,1448,1086);
  for (const tile of tiles) triangle(ctx,screen,tile.source,tile.target);
  ctx.restore();
}

function box(ctx:Context,x:number,y:number,w:number,h:number,r:number,color:string) {
  ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
}
function text(ctx:Context,value:string,x:number,y:number,size:number,color:string,weight=400) {
  ctx.fillStyle=color;ctx.font=`${weight} ${size}px Arial`;ctx.fillText(value,x,y);
}

const tickets=[
  ['Office printer connection','General support','Medium','Open'],['Monthly report export','Client portal','Low','Resolved'],
  ['Help with company access','General support','High','In progress'],['Project file review','Website project','Medium','Assigned'],
  ['Team invitation request','General support','Low','Open'],['Remote access setup','General support','Medium','In progress'],
  ['Client onboarding question','Company workspace','Low','Open'],
];

export function paintTickets(ctx:Context,seconds:number) {
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#071424';ctx.fillRect(0,0,width,height);
  ctx.fillStyle='#0e2037';ctx.fillRect(0,0,width,79);ctx.fillStyle='#263e5d';ctx.fillRect(0,78,width,1);
  box(ctx,25,19,41,41,9,'#203e66');text(ctx,'SD',31,48,22,'#c8ddff',600);text(ctx,'SecureDesk',81,49,29,'#e9f2ff',600);
  text(ctx,'Company workspace',310,48,25,'#adc2df');text(ctx,'ILLUSTRATIVE DEMO',903,47,20,'#9cc7ff');
  ctx.fillStyle='#0a1a2e';ctx.fillRect(0,79,79,height-79);box(ctx,16,108,47,45,9,'#1a3b64');
  ['T','D','O','A'].forEach((value,i)=>text(ctx,value,30,140+i*71,27,i?'#8da8cd':'#d1e3ff',500));
  text(ctx,'YOUR WORKSPACE',110,129,22,'#9cc7ff',500);text(ctx,'Company tickets',109,183,45,'#edf4ff',500);
  text(ctx,'A clear place for requests, context and conversations.',111,220,25,'#a9bfdd');
  box(ctx,110,247,205,44,7,'#142d4d');text(ctx,'All statuses',125,277,25,'#c2d9fb');box(ctx,332,247,288,44,7,'#142d4d');text(ctx,'All accessible tickets',348,277,25,'#c2d9fb');
  text(ctx,'TICKET',124,329,22,'#98b2d4');text(ctx,'PRIORITY',759,329,22,'#98b2d4');text(ctx,'STATUS',972,329,22,'#98b2d4');
  ctx.fillStyle='#263e5d';ctx.fillRect(111,347,1055,1);
  const offset=seconds*20,start=Math.floor(offset/99),fraction=offset%99;
  ctx.save();ctx.beginPath();ctx.rect(110,349,1057,362);ctx.clip();
  for(let i=0;i<6;i++) {
    const item=tickets[(start+i)%tickets.length],y=349+i*99-fraction,selected=item[0]==='Help with company access';
    if(selected)box(ctx,112,y+3,1052,93,7,'#142f52');
    text(ctx,item[0],126,y+41,31,selected?'#e4efff':'#dce9fb',500);text(ctx,item[1],127,y+74,24,'#8faad0');text(ctx,item[2],763,y+56,25,'#adc6e9');
    box(ctx,948,y+28,194,38,6,selected?'#274d7d':'#152f50');text(ctx,item[3],963,y+55,25,'#c0d9ff');ctx.fillStyle='#213b5c';ctx.fillRect(124,y+98,1027,1);
  }
  ctx.restore();ctx.fillStyle='#0b1b2e';ctx.fillRect(79,713,1121,47);text(ctx,'Private company workspace',111,745,22,'#9cb4d4');text(ctx,'Access checked by role and company',754,745,21,'#9cb4d4');
  ctx.save();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.roundRect(568,-8,136,35,12);ctx.fill();ctx.restore();
}

export function startLaptop(canvas:HTMLCanvasElement,photo:HTMLImageElement) {
  const ctx=canvas.getContext('2d');if(!ctx)return ()=>{};
  const screen=document.createElement('canvas');screen.width=width;screen.height=height;const ui=screen.getContext('2d');if(!ui)return ()=>{};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,elapsed=0,frame=0,previous=0,lastPaint=-1,disposed=false;
  const ready=()=>photo.complete&&photo.naturalWidth>0;
  function draw(){if(!ready())return;paintTickets(ui!,elapsed);paintLaptop(ctx!,photo,screen,reduced.matches?0:elapsed);canvas.dataset.ready='true';}
  const running=()=>visible&&!document.hidden&&!reduced.matches&&!disposed;
  function tick(now:number){frame=0;if(!running())return;elapsed+=Math.min(.15,(now-previous)/1000);previous=now;if(now-lastPaint>=50){draw();lastPaint=now;}frame=requestAnimationFrame(tick);}
  function sync(){if(!running()&&frame){cancelAnimationFrame(frame);frame=0;}if(running()&&!frame){previous=performance.now();frame=requestAnimationFrame(tick);}draw();}
  const observer=new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);sync();},{threshold:.1});observer.observe(canvas);
  photo.addEventListener('load',sync);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);sync();
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();photo.removeEventListener('load',sync);document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);};
}
