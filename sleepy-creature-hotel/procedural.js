(function(root,factory){if(typeof module!=='undefined')module.exports=factory;else factory(root.DeliveryCore||root.HotelCore,document.body.dataset.ugGame);}(typeof window==='undefined'?globalThis:window,function(C,slug){
  'use strict';
  const delivery=slug==='little-delivery-wagon',prefix=delivery?'LDW':'SCH',copy=v=>JSON.parse(JSON.stringify(v));
  const number=n=>{const value=String(n);if(!/^[1-9]\d{0,59}$/.test(value))throw Error('Use a positive level number of up to 60 digits.');return value;};
  function sum(text){let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0).toString(36);}
  function context(n,d){let seed=parseInt(sum('UGEARLY1:'+slug+':'+n+':'+d),36)>>>0;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},pick=a=>a[Math.floor(rng()*a.length)],shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};return{rng,pick,shuffle};}
  C.generate=function(n,difficulty=3){
    n=number(n);if(!Number.isInteger(difficulty)||difficulty<0||difficulty>7)throw Error('Choose a supported difficulty.');
    const c=context(n,difficulty),count=2+Math.floor(difficulty/2);
    if(delivery){
      const seen=new Set(),pool=C.LEVELS.flatMap(l=>l.deliveries).filter(item=>{if(seen.has(item.icon)||difficulty<3&&item.icon!==item.buildingIcon)return false;seen.add(item.icon);return true;}),chosen=[],destinations=new Set();
      for(const item of c.shuffle(pool))if(!destinations.has(item.buildingIcon)&&chosen.length<count){chosen.push(copy(item));destinations.add(item.buildingIcon);}
      return{id:difficulty+1,title:'Generated route '+n,icon:'🧺',color:'#367d72',story:'A fresh little delivery round. Find a home for every parcel.',ordered:difficulty>=4,deliveries:chosen.map((v,i)=>({...v,id:'parcel-'+i}))};
    }
    const opposites={tall:'tiny',tiny:'tall',dark:'light',light:'dark',cool:'warm',warm:'cool',quiet:'music',music:'quiet'},amenities=Object.keys(C.AMENITIES),wishSets=[];
    const combinations=difficulty<4?amenities.map(v=>[v]):amenities.flatMap((a,i)=>amenities.slice(i+1).filter(b=>b!==opposites[a]).map(b=>[a,b]));wishSets.push(...c.shuffle(combinations).slice(0,count));
    const guests=c.shuffle(C.LEVELS.flatMap(l=>l.guests)),rooms=wishSets.map((w,i)=>['room-'+i,'Room '+(i+1),w]);
    return{id:difficulty+1,title:'Generated night '+n,icon:'🌙',story:'New sleepy guests are waiting. Match the picture wishes to their rooms.',rooms:c.shuffle(rooms),guests:wishSets.map((w,i)=>['guest-'+i,guests[i][1],guests[i][2],w,'room-'+i])};
  };
  C.encodeGenerated=function(mask,descriptor,ids,mistakes=0){
    if(!Number.isInteger(mask)||mask<0||mask>255||descriptor.version!==1)throw Error('Invalid generated progress.');
    const n=number(descriptor.number),d=descriptor.difficulty,data=C.generate(n,d),items=delivery?data.deliveries:data.guests,bits=items.reduce((n,item,i)=>n|(ids.includes(delivery?item.id:item[0])?1<<i:0),0),payload=[prefix+'3',mask.toString(36),n,d,bits.toString(36),Math.min(9999,mistakes).toString(36)].join('.');return payload+'.'+sum(payload);
  };
  const decodeOriginal=C.decodeSession;
  C.decodeSession=function(input){try{
    if(typeof input!=='string')return null;let code=input.trim();if(code.includes('#'))code=new URLSearchParams(code.slice(code.indexOf('#')+1)).get('save')||'';
    if(!code.startsWith(prefix+'3.'))return decodeOriginal(input);
    if(code.length>200)return null;const a=code.split('.');if(a.length!==7||sum(a.slice(0,6).join('.'))!==a[6]||!/^\d$/.test(a[3])||!a.slice(1,2).concat(a.slice(4,6)).every(v=>/^[0-9a-z]+$/.test(v)))return null;
    const mask=parseInt(a[1],36),difficulty=Number(a[3]),bits=parseInt(a[4],36),mistakes=parseInt(a[5],36),n=number(a[2]),data=C.generate(n,difficulty),items=delivery?data.deliveries:data.guests;
    if(mask>255||mistakes>9999||bits>=1<<items.length||data.ordered&&(bits&(bits+1))!==0)return null;
    return{mask,level:data.id,ids:items.filter((_,i)=>bits&1<<i).map(item=>delivery?item.id:item[0]),mistakes,generated:{version:1,number:n,difficulty}};
  }catch(_){return null;}};
  C.generatedAdapter={procedural:{supported:[slug],nextNumber:n=>(BigInt(number(n))+1n).toString()},generate:(_,n,d)=>({level:d,_generated:{version:1,number:number(n),difficulty:d},data:C.generate(n,d)})};
  return C;
}));
