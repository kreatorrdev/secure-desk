/** Decorative background only; it has no application or network data source. */
export function startConnections(canvas:HTMLCanvasElement,section:HTMLElement) {
  const ctx=canvas.getContext('2d');if(!ctx)return ()=>{};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let width=0,height=0,points:{x:number;y:number;phase:number}[]=[],frame=0,time=0,previous=0,lastPaint=-1,visible=false,disposed=false;
  let pointer:{x:number;y:number}|null=null;
  function draw(){
    if(!width||!height)return;ctx!.clearRect(0,0,width,height);ctx!.strokeStyle='#9cc7ff';ctx!.fillStyle='#9cc7ff';ctx!.lineWidth=.7;
    const positions=points.map(point=>({x:point.x+7*Math.sin(time*.13+point.phase),y:point.y+8*Math.cos(time*.11+point.phase)})),distance=Math.min(195,width*.46);
    for(let a=0;a<positions.length;a++) {
      const point=positions[a],near=pointer?Math.hypot(point.x-pointer.x,point.y-pointer.y):Infinity;
      for(let b=a+1;b<positions.length;b++){
        const other=positions[b],length=Math.hypot(point.x-other.x,point.y-other.y);if(length>distance)continue;
        ctx!.globalAlpha=(1-length/distance)*(near<200?.43:.24);ctx!.beginPath();ctx!.moveTo(point.x,point.y);ctx!.lineTo(other.x,other.y);ctx!.stroke();
      }
      ctx!.globalAlpha=near<140?.85:.42;ctx!.beginPath();ctx!.arc(point.x,point.y,near<140?2.2:1.3,0,Math.PI*2);ctx!.fill();
    }
    ctx!.globalAlpha=1;
  }
  function resize(){
    width=section.clientWidth;height=section.clientHeight;if(!width||!height)return;
    const scale=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);ctx!.setTransform(scale,0,0,scale,0,0);
    const columns=Math.max(3,Math.round(width/145)),rows=Math.max(3,Math.ceil(height/150));points=[];
    for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){const seed=x*13+y*29;points.push({x:(x+.16*Math.sin(seed))*width/columns,y:(y+.17*Math.cos(seed*1.4))*height/rows,phase:seed*.7});}
    draw();
  }
  const running=()=>visible&&!reduced.matches&&!document.hidden&&!disposed;
  function tick(now:number){frame=0;if(!running())return;time+=Math.min(.15,(now-previous)/1000);previous=now;if(now-lastPaint>=50){draw();lastPaint=now;}frame=requestAnimationFrame(tick);}
  function sync(){if(!running()&&frame){cancelAnimationFrame(frame);frame=0;}if(running()&&!frame){previous=performance.now();frame=requestAnimationFrame(tick);}if(!running())draw();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(section);
  const observer=new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);sync();});observer.observe(section);
  const move=(event:PointerEvent)=>{const bounds=section.getBoundingClientRect();pointer={x:event.clientX-bounds.left,y:event.clientY-bounds.top};if(!running())draw();};
  const leave=()=>{pointer=null;if(!running())draw();};
  section.addEventListener('pointermove',move,{passive:true});section.addEventListener('pointerleave',leave);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);resize();sync();
  return ()=>{disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();observer.disconnect();section.removeEventListener('pointermove',move);section.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);};
}
