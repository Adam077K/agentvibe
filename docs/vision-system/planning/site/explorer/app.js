/* The Company Engine Explorer. Every string rendered below comes from the JSON
   projection in ./data \u2014 this file adds navigation, layout and captions only. */
(function(){
"use strict";
var $=function(i){return document.getElementById(i)};
var RAIL=$("rail"),CANVAS=$("canvas"),DETAIL=$("detail"),CRUMBS=$("crumbs"),QBOX=$("q"),RES=$("results");
var EM={"&":"&amp;","<":"&lt;",">":"&gt;","\u0022":"&quot;"};
function e(s){return String(s==null?"":s).replace(/[&<>\u0022]/g,function(c){return EM[c]})}
function T(s){return s==null?"":String(s)}
function has(v){if(v==null||v==="")return false;if(Array.isArray(v))return v.length>0;if(typeof v==="object")return Object.keys(v).length>0;return true}
function md(s){var t=e(T(s));t=t.replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>").replace(/`([^`]+)`/g,"<code>$1</code>");return t.replace(/\n{2,}/g,"</p><p>").replace(/\n/g,"<br>")}
function lab(k){return T(k).replace(/_/g," ")}
function cut(s,n){s=T(s);return s.length>n?s.slice(0,n)+"\u2026":s}
function pre(o){return "<pre class=\"mono\">"+e(JSON.stringify(o,null,1))+"</pre>"}
function none(t){return "<span class=\"none\">"+e(t||"none stated")+"</span>"}

/* ---------- data ---------- */
var C={},P={},IX={};
function D(n){if(C[n])return Promise.resolve(C[n]);
 if(!P[n])P[n]=fetch("./data/"+n+".json").then(function(r){if(!r.ok)throw new Error(r.status+" on "+n+".json");return r.json()}).then(function(j){C[n]=j;return j});
 return P[n]}
function byId(name,arr,key){key=key||"id";var k=name+":"+key;if(!IX[k]){var m={};arr.forEach(function(o){m[o[key]]=o});IX[k]=m}return IX[k]}

/* ---------- links ---------- */
function href(sec,id,sub){return "#/"+sec+(id!=null?"/"+encodeURIComponent(id):"")+(sub!=null?"/"+encodeURIComponent(sub):"")}
function lk(sec,id,label,cls){return "<a class=\""+(cls||"chip")+"\" href=\""+href(sec,id)+"\">"+e(label==null?id:label)+"</a>"}
var PAT=[[/^S1-C\d+$/,"component"],[/^L[1-5]$/,"layer"],[/^B\d\d$/,"stage"],[/^CAP-\d+$/,"capability"],[/^AD-\d+$/,"decision"],[/^Q-\d+$/,"question"],[/^RISK-\d+$/,"risk"],[/^AC\d+$/,"attack"],[/^D\d\d$/,"coverage"],[/^IC-[A-Z0-9-]+$/,"adapter"],[/^N-[A-Z0-9/-]+$/,"profile"],[/^[A-Z]\d\d-Q\d\d$/,"coverage"],[/^VISION-\d+$/,"coverage"]];
function secOf(id){id=T(id);for(var i=0;i<PAT.length;i++){if(PAT[i][0].test(id))return PAT[i][1]}
 if(C.records&&byId("records",C.records)[id])return "record";
 if(C.predicates&&byId("predicates",C.predicates)[id])return "predicate";
 if(C.commands&&byId("commands",C.commands)[id])return "command";
 return null}
function auto(id,label){var s=secOf(id);return s?lk(s,id,label):"<span class=\"chip\">"+e(label==null?id:label)+"</span>"}
function chips(list,sec){if(!list||!list.length)return none();
 return "<div class=\"chips\">"+list.map(function(x){return sec?lk(sec,x,x):auto(x)}).join("")+"</div>"}

/* ---------- generic value rendering ---------- */
function val(v,d){d=d||0;
 if(!has(v))return none(v===false?"no":null);
 if(typeof v==="string")return md(v);
 if(typeof v==="boolean")return "<span class=\"pill "+(v?"ok\">yes":"no\">no")+"</span>";
 if(typeof v!=="object")return e(String(v));
 if(Array.isArray(v)){
  var flat=v.every(function(x){return x==null||typeof x!=="object"});
  if(flat)return v.length>1&&String(v[0]).length>60?"<ul>"+v.map(function(x){return "<li>"+md(x)+"</li>"}).join("")+"</ul>":chips(v);
  if(d>1)return pre(v);
  return "<ul>"+v.map(function(x){return "<li>"+val(x,d+1)+"</li>"}).join("")+"</ul>"}
 if(d>2)return pre(v);
 return kv(v,d+1)}
function kv(o,d){if(!o)return none();
 var r=Object.keys(o).filter(function(k){return has(o[k])}).map(function(k){return "<dt>"+e(lab(k))+"</dt><dd>"+val(o[k],d||0)+"</dd>"}).join("");
 return r?"<dl class=\"kv\">"+r+"</dl>":none()}
function rows(pairs){var r=pairs.filter(function(p){return p[1]}).map(function(p){return "<dt>"+e(p[0])+"</dt><dd>"+p[1]+"</dd>"}).join("");
 return r?"<dl class=\"kv\">"+r+"</dl>":""}
function sub(t){return "<div class=\"sub\">"+e(t)+"</div>"}
function pane(t,body,lede){return "<section class=\"pane\">"+(t?"<h2>"+e(t)+"</h2>":"")+(lede?"<p class=\"lede\">"+md(lede)+"</p>":"")+body+"</section>"}
function srcline(o){var s=o&&(o.source||o.source_doc||o.path);if(!s)return "";
 var extra=o.source_doc&&o.source&&o.source_doc!==o.source?"<br>stated in <code>"+e(o.source_doc)+"</code>":"";
 return "<div class=\"src\"><b>where this is defined</b><br><code>"+e(s)+"</code>"+extra+"</div>"}
function loading(what){return "<div class=\"loading\">reading <code>data/"+e(what)+".json</code></div>"}
function statusPill(s){s=T(s);var c=/^(Answered|closed|selected|accepted|complete|yes|PASS|SUFFICIENT)/i.test(s)?"ok":/founder|decision|external professional|open|not-started|INSUFFICIENT|FAIL/i.test(s)?"no":"wait";
 return "<span class=\"pill "+c+"\">"+e(cut(s,60))+"</span>"}

/* ---------- diagram engine: hand-drawn SVG, currentColor strokes ---------- */
function wrapText(s,max){var w=T(s).split(/\s+/),out=[],cur="";
 w.forEach(function(x){if((cur+" "+x).trim().length>max){if(cur)out.push(cur);cur=x}else cur=(cur?cur+" ":"")+x});
 if(cur)out.push(cur);return out.length?out:[""]}
function graph(nodes,edges,o){
 o=o||{};var W=o.w||168,GAPX=o.gapx||86,GAPY=o.gapy||18,PAD=14,CH=o.chars||24;
 var N={},order=[];
 nodes.forEach(function(n){var lines=wrapText(n.label,CH);N[n.id]={n:n,lines:lines,h:(n.sub?14:0)+8+lines.length*14+8};order.push(n.id)});
 var adj={},inc={};order.forEach(function(i){adj[i]=[];inc[i]=0});
 edges.forEach(function(g){if(N[g.from]&&N[g.to]&&g.from!==g.to){adj[g.from].push(g.to);inc[g.to]++}});
 var d={},queue=[];order.forEach(function(i){if(!inc[i]){d[i]=0;queue.push(i)}});
 if(!queue.length){d[order[0]]=0;queue.push(order[0])}
 var guard=0;
 while(queue.length&&guard++<9000){var id=queue.shift();adj[id].forEach(function(t){var nd=d[id]+1;if(nd<26&&(d[t]==null||nd>d[t])){d[t]=nd;queue.push(t)}})}
 order.forEach(function(i){if(d[i]==null)d[i]=0});
 var cols={};order.forEach(function(i){(cols[d[i]]=cols[d[i]]||[]).push(i)});
 var ks=Object.keys(cols).map(Number).sort(function(a,b){return a-b});
 var colH={},maxH=0;
 ks.forEach(function(k){var h=cols[k].reduce(function(a,i){return a+N[i].h+GAPY},-GAPY);colH[k]=h;if(h>maxH)maxH=h});
 ks.forEach(function(k,ci){var y=PAD+(maxH-colH[k])/2;
  cols[k].forEach(function(i){N[i].x=PAD+ci*(W+GAPX);N[i].y=y;N[i].cx=N[i].x+W/2;N[i].cy=y+N[i].h/2;y+=N[i].h+GAPY})});
 var sw=PAD*2+ks.length*(W+GAPX)-GAPX,sh=maxH+PAD*2+10;
 var out=["<svg viewBox=\"0 0 "+sw+" "+sh+"\" width=\""+sw+"\" height=\""+sh+"\" role=\"img\">",
  "<defs><marker id=\"ah\" viewBox=\"0 0 8 8\" refX=\"7\" refY=\"4\" markerWidth=\"7\" markerHeight=\"7\" orient=\"auto-start-reverse\"><path d=\"M0,1 L7,4 L0,7 z\" fill=\"currentColor\"/></marker></defs>"];
 edges.forEach(function(g,gi){var a=N[g.from],b=N[g.to];if(!a||!b)return;var p;
  if(g.from===g.to){p="M"+(a.x+W*0.34)+","+a.y+" C"+(a.x-24)+","+(a.y-46)+" "+(a.x+W+24)+","+(a.y-46)+" "+(a.x+W*0.66)+","+a.y}
  else if(b.x>a.x){var x1=a.x+W,x2=b.x,mx=(x1+x2)/2;p="M"+x1+","+a.cy+" C"+mx+","+a.cy+" "+mx+","+b.cy+" "+x2+","+b.cy}
  else{var y1=a.y+a.h,y2=b.y+b.h,dy=42+((gi%3)*12);p="M"+a.cx+","+y1+" C"+a.cx+","+(y1+dy)+" "+b.cx+","+(y2+dy)+" "+b.cx+","+y2}
  out.push("<g class=\"ed"+(g.cls?" "+g.cls:"")+"\""+(g.href?" data-h=\""+e(g.href)+"\"":" ")+"><title>"+e(g.title||"")+"</title><path class=\"hit\" d=\""+p+"\"/><path d=\""+p+"\" marker-end=\"url(#ah)\"/></g>")});
 order.forEach(function(i){var m=N[i],n=m.n,ty=m.y+(n.sub?26:20);
  out.push("<g class=\"nd"+(n.cls?" "+n.cls:"")+"\""+(n.href?" data-h=\""+e(n.href)+"\"":"")+"><title>"+e(n.title||n.label)+"</title>"+
   "<rect x=\""+m.x+"\" y=\""+m.y+"\" width=\""+W+"\" height=\""+m.h+"\" rx=\"6\"/>"+
   (n.sub?"<text class=\"id\" x=\""+(m.x+10)+"\" y=\""+(m.y+15)+"\">"+e(n.sub)+"</text>":"")+
   m.lines.map(function(t,li){return "<text x=\""+(m.x+10)+"\" y=\""+(ty+li*14)+"\">"+e(t)+"</text>"}).join("")+"</g>")});
 out.push("</svg>");
 return out.join("")}
function diagram(svg,caption,legend){return "<div class=\"diagram\">"+svg+"</div>"+(legend?"<div class=\"legend\">"+legend+"</div>":"")+(caption?"<p class=\"cap\">"+md(caption)+"</p>":"")}

/* ---------- view registry ---------- */
var V={},GROUPS=[];
function view(key,def){V[key]=def;return def}
window.__EX={D:D,V:V,byId:byId,e:e,md:md,kv:kv,val:val,rows:rows,sub:sub,pane:pane,srcline:srcline,loading:loading,lk:lk,chips:chips,auto:auto,graph:graph,diagram:diagram,none:none,statusPill:statusPill,cut:cut,has:has,lab:lab,view:view,href:href,GROUPS:GROUPS,C:C,pre:pre,wrapText:wrapText,T:T};
})();

/* ---- views: system map, components, layers ---- */
(function(){
var X=window.__EX,D=X.D,e=X.e,md=X.md,kv=X.kv,val=X.val,rows=X.rows,sub=X.sub,pane=X.pane,srcline=X.srcline,
 lk=X.lk,chips=X.chips,graph=X.graph,diagram=X.diagram,view=X.view,href=X.href,byId=X.byId,cut=X.cut,statusPill=X.statusPill;

function flowNodes(c){
 var seen={},ns=[];
 c.items.forEach(function(i){seen[i.id]=1;ns.push({id:i.id,label:i.short_name||i.name,sub:i.id.replace("S1-",""),href:href("component",i.id),title:i.name})});
 c.flows.forEach(function(f){[["from","from_label"],["to","to_label"]].forEach(function(p){
  var id=f[p[0]];if(!seen[id]){seen[id]=1;ns.push({id:id,label:f[p[1]]||id,sub:id,cls:"ext",title:f[p[1]]||id})}})});
 return ns}
function flowEdges(fl){return fl.map(function(f){return {from:f.from,to:f.to,title:(f.from_label||f.from)+" \u2192 "+(f.to_label||f.to)}})}
function one(id,label){return /^S1-C/.test(id)?lk("component",id,label||id):"<span class=\"chip\">"+e(label||id)+"</span>"}
function flowList(fl){return "<div class=\"rows\">"+fl.map(function(f){
 return "<div class=\"row\"><div class=\"t\">"+one(f.from,f.from_label)+"<span class=\"m\">"+e(f.arrow)+(f.bidirectional?" (both ways)":"")+"</span>"+one(f.to,f.to_label)+"</div></div>"}).join("")+"</div>"}

X.view("home",{label:"System map",group:"The system",
 list:function(){return D("components").then(function(c){
  var svg=graph(flowNodes(c),flowEdges(c.flows),{w:176,gapx:96,chars:22});
  return pane("The nine logical components",
    diagram(svg,"Nine components of architecture S1.1, drawn from `components.json`: nine registry items and the fourteen edges of the logical flowchart in chapter 08 section 3. **The package states those edges without labels**, so each arrow carries its two endpoint labels as its tooltip and the list below names every edge in full. Dashed boxes are nodes the chapter names that are not components.",
      "<span>solid box \u00b7 component</span><span>dashed box \u00b7 external or non-component node</span><span>arrow \u00b7 one declared flow</span>")+
    "<p class=\"cap\">Click a box for what that component owns, receives, returns and cannot do \u2014 with its records, commands, capabilities and predicates.</p>"+
    sub("the fourteen logical flows")+flowList(c.flows)+
    sub("the eight trust and fault placement flows")+flowList(c.deployment_flows)+
    srcline(c))})},
 detail:null});

X.view("component",{label:"Components",group:"The system",n:9,
 list:function(sel){return D("components").then(function(c){
  return pane("Nine components","<div class=\"cards\">"+c.items.map(function(i){
   return "<a class=\"card"+(i.id===sel?" on":"")+"\" href=\""+href("component",i.id)+"\"><span class=\"t\">"+e(i.id)+" \u00b7 "+e(i.short_name||i.name)+"</span><span class=\"s\">"+e(cut(i.owns,110))+"</span></a>"}).join("")+"</div>"+
   "<p class=\"cap\">Record, command, predicate and capability counts on each detail are derived by the projection, not declared in the chapter.</p>"+srcline(c))})},
 detail:function(id){return Promise.all([D("components"),D("records"),D("commands"),D("capabilities"),D("chapters")]).then(function(a){
  var c=a[0],i=byId("components",c.items)[id];if(!i)return pane("Not found","<p>"+e(id)+" is not a component id.</p>");
  var recs=a[1].filter(function(r){return r.owner_component===id}),cmds=a[2].filter(function(x){return x.owner_component===id}),caps=a[3].filter(function(x){return x.owner_component===id});
  var secs=[];a[4].forEach(function(ch){ch.sections.forEach(function(s){if(s.mentions&&s.mentions.components.indexOf(id)>=0)secs.push([ch,s])})});
  return pane(i.id+" \u00b7 "+i.name,
   rows([["owns",md(i.owns)],["receives",md(i.receives)],["returns",md(i.returns)],["cannot",md(i.cannot)],["implementation location","<code>"+e(i.implementation_location)+"</code>"]])+
   sub("what it holds")+
   rows([["records owned",recs.length+"<br>"+chips(recs.map(function(r){return r.id}),"record")],
     ["commands",cmds.length+(cmds.length?"<br>"+chips(cmds.map(function(x){return x.id}),"command"):"")],
     ["capabilities",caps.length+(caps.length?"<br>"+caps.map(function(x){return lk("capability",x.id,x.id+" \u00b7 "+x.name)}).join(""):"")],
     ["predicates",i.predicates_count+"<br>"+lk("predicate","@"+id,"browse the "+i.predicates_count+" it owns")],
     ["source questions",chips(i.questions,"coverage")]])+
   sub("the nineteen authority attributes")+kv(i.attributes)+
   (X.has(i.contract_refs)?sub("contract references")+val(i.contract_refs):"")+
   sub("chapter sections that mention it ("+secs.length+")")+
   "<div class=\"rows\">"+secs.map(function(p){return "<a class=\"row\" href=\""+href("chapter",p[0].id,p[1].id)+"\"><span class=\"t\">"+e(p[1].heading)+"</span><span class=\"s\">"+e(p[0].title)+"</span></a>"}).join("")+"</div>"+
   srcline(i))})}});

X.view("layer",{label:"Five layers",group:"The system",n:5,
 list:function(sel){return D("layers").then(function(L){
  var ns=L.items.map(function(l){return {id:l.id,label:l.name.replace(/^L\d\s*\u00b7\s*/,""),sub:l.id+" \u00b7 "+l.decides,href:href("layer",l.id),cls:l.id===sel?"on":"",title:l.decides}});
  var es=[];for(var i=0;i<L.items.length-1;i++)es.push({from:L.items[i].id,to:L.items[i+1].id,title:"precedence"});
  return pane("The precedence ladder",
   diagram(graph(ns,es,{w:150,gapx:60,chars:19}),"L1 to L5 as tabled in chapter 02 section 3. The arrow is precedence, not data flow. "+md(L.precedence))+
   "<p class=\"cap\">Click a layer for its governing rule and the sections of <code>05-work-agents-skills.md</code> that specify it.</p>"+
   sub("how the five layers were introduced")+"<p>"+md(L.introduction)+"</p>"+
   sub("the criteria the selection record judged")+"<h4>"+e(L.selection_record_criteria.heading)+"</h4><div class=\"prose\"><p>"+md(L.selection_record_criteria.text)+"</p></div>"+
   srcline(L))})},
 detail:function(id){return D("layers").then(function(L){var l=byId("layers",L.items)[id];if(!l)return "";
  return pane(l.name,rows([["decides",md(l.decides)],["governing rule",md(l.governing_rule)],["where specified",md(l.where_specified)]])+
   sub("governing sections, in full")+
   (l.rule_sections||[]).map(function(s){return "<h4>"+e(s.heading)+"</h4><div class=\"prose\"><p>"+md(s.text)+"</p></div>"}).join("")+
   srcline(l))})}});
})();

/* ---- views: records and their lifecycles ---- */
(function(){
var X=window.__EX,D=X.D,e=X.e,md=X.md,kv=X.kv,val=X.val,rows=X.rows,sub=X.sub,pane=X.pane,srcline=X.srcline,
 lk=X.lk,chips=X.chips,graph=X.graph,diagram=X.diagram,href=X.href,byId=X.byId,cut=X.cut,statusPill=X.statusPill;
var F=window.__F||(window.__F={});

function lifecycle(r,edgeSel){
 var lc=r.lifecycle;if(!lc||!lc.phases||!lc.phases.length)return "<p class=\"none\">This record declares no phased lifecycle.</p>";
 var ns=lc.phases.map(function(p){return {id:p,label:p,sub:p===lc.initial?"initial":"",cls:p===lc.initial?"init":"",title:p}});
 var es=(lc.edges||[]).map(function(g){return {from:g.from,to:g.to,title:g.meaning||g.predicate,href:href("record",r.id,g.edge_id),cls:g.edge_id===edgeSel?"on":""}});
 return diagram(graph(ns,es,{w:136,gapx:78,chars:17}),
  "The declared lifecycle of "+e(r.id)+": "+lc.phases.length+" phases and "+(lc.edges||[]).length+" transitions. The amber box is the initial phase. **Click an arrow** for the predicate that guards that transition.",
  "<span>amber \u00b7 initial phase</span><span>arrow \u00b7 one guarded transition</span>")}

X.view("record",{label:"Records",group:"The contract",n:189,
 list:function(sel){return D("records").then(function(R){
  var kind=F.rk||"",rep=F.rr||"",q=(F.rq||"").toLowerCase();
  var kinds={},reps={};R.forEach(function(r){kinds[r.kind]=1;reps[r.representation]=1});
  var s2=R.filter(function(r){return (!kind||r.kind===kind)&&(!rep||r.representation===rep)&&(!q||r.id.toLowerCase().indexOf(q)>=0)});
  var by={};s2.forEach(function(r){(by[r.owner_component]=by[r.owner_component]||[]).push(r)});
  var opt=function(o,cur){return Object.keys(o).sort().map(function(k){return "<option"+(k===cur?" selected":"")+">"+e(k)+"</option>"}).join("")};
  return pane("189 records, grouped by the component that owns them",
   "<div class=\"filters\"><input id=\"f-rq\" data-f=\"rq\" placeholder=\"filter by id\" value=\""+e(F.rq||"")+"\">"+
   "<select id=\"f-rk\" data-f=\"rk\"><option value=\"\">every kind</option>"+opt(kinds,kind)+"</select>"+
   "<select id=\"f-rr\" data-f=\"rr\"><option value=\"\">every representation</option>"+opt(reps,rep)+"</select>"+
   "<span class=\"count\">"+s2.length+" of "+R.length+"</span></div>"+
   Object.keys(by).sort().map(function(c){return "<div class=\"groupname\">"+e(c)+" \u00b7 "+by[c].length+"</div><div class=\"rows\">"+
    by[c].map(function(r){return "<a class=\"row"+(r.id===sel?" on":"")+"\" href=\""+href("record",r.id)+"\"><span class=\"t\">"+e(r.id)+"<span class=\"m\">"+e(r.kind)+"</span></span><span class=\"s\">"+e(cut(r.representation,120))+"</span></a>"}).join("")+"</div>"}).join(""))})},
 detail:function(id,edgeSel){return D("records").then(function(R){var r=byId("records",R)[id];if(!r)return pane("Not found","<p>"+e(id)+" is not a record id.</p>");
  var edge=null;((r.lifecycle&&r.lifecycle.edges)||[]).forEach(function(g){if(g.edge_id===edgeSel)edge=g});
  var fields="<table class=\"tbl\"><tr><th>path</th><th>type</th><th>req</th><th>owner</th><th>note</th></tr>"+
   (r.fields||[]).map(function(f){return "<tr><td class=\"mono\">"+e(f.path)+"</td><td class=\"mono\">"+e(f.type)+"</td><td>"+(f.required?"yes":"")+"</td><td>"+e(cut(f.owner,44))+"</td><td>"+e(cut(f.note,110))+"</td></tr>"}).join("")+"</table>";
  var rel=(r.relations||[]).map(function(x){return "<div class=\"row\"><span class=\"t\"><span class=\"m\">"+e(x.field_path)+"</span>"+chips(x.targets,"record")+"</span><span class=\"s\">cardinality: "+e(x.cardinality)+"</span></div>"}).join("");
  return pane(r.id,
   rows([["kind",e(r.kind)],["representation",md(r.representation)],["owner",lk("component",r.owner_component,r.owner_component)],
     ["implementation status",statusPill(r.implementation_status)],["planned module","<code>"+e(r.planned_module)+"</code>"],["schema version",e(r.schema_version)]])+
   sub("lifecycle")+lifecycle(r,edgeSel)+
   (edge?"<div class=\"pane\" style=\"margin-top:10px\"><h3>"+e(edge.from)+" \u2192 "+e(edge.to)+"</h3>"+
     rows([["guard predicate",lk("predicate",edge.predicate,edge.predicate)+" <span class=\"m\">v"+e(edge.predicate_version)+"</span>"],
      ["meaning",md(edge.meaning)],["owner",lk("component",edge.owner,edge.owner)],["mutates",md(edge.mutates)],
      ["on denial",md(edge.on_denial)],["allowed commands",chips(edge.allowed_command_ids,"command")],["criterion","<code>"+e(edge.criterion_id)+"</code>"]])+"</div>":"")+
   sub("fields ("+(r.fields||[]).length+")")+fields+
   (rel?sub("relations")+"<div class=\"rows\">"+rel+"</div>":"")+
   sub("identity")+kv(r.identity)+sub("source of truth")+kv(r.source_of_truth)+
   (r.owner_assignment?sub("owner assignment")+"<p>"+md(r.owner_assignment)+"</p>":"")+
   sub("registration")+kv(r.registration)+
   (X.has(r.invariants)?sub("invariants")+val(r.invariants):"")+
   sub("authorization")+kv(r.authorization)+sub("retention")+kv(r.retention)+sub("deletion")+kv(r.deletion)+
   sub("audit")+kv(r.audit)+sub("versioning")+kv(r.versioning)+
   (X.has(r.output_lifecycle_links)?sub("output lifecycle links")+val(r.output_lifecycle_links):"")+
   sub("contract and status")+
   rows([["source contract","<code>"+e(r.source_contract)+"</code>"],["schema ref","<code>"+e(r.schema_ref)+"</code>"],
     ["removal criterion",md(r.removal_criterion)],["why",r.why?md(r.why):""]])+
   srcline(r))})}});
})();

/* ---- the registry views: one factory, many registries ---- */
(function(){
var X=window.__EX,D=X.D,e=X.e,md=X.md,kv=X.kv,val=X.val,rows=X.rows,sub=X.sub,pane=X.pane,srcline=X.srcline,
 lk=X.lk,chips=X.chips,auto=X.auto,href=X.href,cut=X.cut,statusPill=X.statusPill,none=X.none;
var F=window.__F||(window.__F={});
window.__REG=function(key,o){
 X.view(key,{label:o.label,group:o.group,n:o.n,
  list:function(sel){return D(o.file).then(function(raw){
   var arr=o.pick?o.pick(raw):raw,own="";
   if(sel&&sel.charAt(0)==="@"){own=sel.slice(1);F[key+"o"]=own}else own=F[key+"o"]||"";
   var q=(F[key]||"").toLowerCase();
   var items=arr.filter(function(x){return (!q||o.text(x).toLowerCase().indexOf(q)>=0)&&(!own||x.owner_component===own)});
   var cap=o.cap||300,shown=items.slice(0,cap);
   return pane(o.title,
    "<div class=\"filters\"><input data-f=\""+key+"\" placeholder=\"filter\" value=\""+e(F[key]||"")+"\">"+
    (own?"<a class=\"chip\" href=\""+href(key,"@")+"\">owner "+e(own)+" \u00d7</a>":"")+
    "<span class=\"count\">"+items.length+" of "+arr.length+"</span></div>"+
    "<div class=\"rows\">"+shown.map(function(x){var id=x[o.idf||"id"];
     return "<a class=\"row"+(id===sel?" on":"")+"\" href=\""+href(key,id)+"\"><span class=\"t\">"+e(o.rowT?o.rowT(x):id)+"</span><span class=\"s\">"+e(cut(o.rowS?o.rowS(x):"",190))+"</span></a>"}).join("")+"</div>"+
    (items.length>shown.length?"<p class=\"cap\">Showing the first "+cap+" of "+items.length+" matches. Narrow the filter, or use the search box above \u2014 every one of them is addressable.</p>":"")+
    (o.note?"<p class=\"cap\">"+md(o.note)+"</p>":""))})},
  detail:function(id){return D(o.file).then(function(raw){
   var arr=o.pick?o.pick(raw):raw,f=o.idf||"id",x=null;
   arr.forEach(function(y){if(String(y[f])===String(id))x=y});
   if(!x)return pane("Not found","<p><code>"+e(id)+"</code> is not in "+e(o.file)+".json</p>");
   return pane(o.detT?o.detT(x):String(x[f]),(o.det?o.det(x):kv(x))+srcline(x))})}})};
var REG=window.__REG;

REG("predicate",{label:"Predicates",group:"The contract",n:2398,file:"predicates",title:"2,398 predicates",
 text:function(p){return p.id+" "+X.T(p.meaning)},rowT:function(p){return p.id},rowS:function(p){return X.T(p.meaning)},
 note:"Predicate bodies are the only thing truncated anywhere in the projection: 1,200 characters, flagged, with the untruncated length kept.",
 det:function(p){return rows([["meaning",md(p.meaning)],["owner",p.owner_component?lk("component",p.owner_component,p.owner_component):""],
  ["version",e(p.version)],["failure",md(p.failure)],["implementation status",statusPill(p.implementation_status)],
  ["argument types",X.has(p.argument_types)?val(p.argument_types):""],["stated in",p.source_doc?"<code>"+e(p.source_doc)+"</code>":""]])+
  sub("body"+(p.truncated?" (truncated at 1,200 of "+p.body_bytes+" characters)":""))+"<pre class=\"mono\">"+e(p.body_compact)+"</pre>"+
  sub("used by ("+((p.used_by||[]).length)+") \u00b7 derived by scanning, not declared")+chips(p.used_by||[])}});

REG("command",{label:"Commands",group:"The contract",n:105,file:"commands",title:"105 commands",
 text:function(c){return c.id+" "+X.T(c.guard_meaning)},rowT:function(c){return c.id},rowS:function(c){return X.T(c.guard_meaning)},
 det:function(c){return rows([["owner",c.owner_component?lk("component",c.owner_component,c.owner_component):""],
  ["read only",c.read_only?"<span class=\"pill ok\">yes</span>":"<span class=\"pill wait\">no</span>"],
  ["targets",chips(c.target_types,"record")],["guard",c.guard_predicate_id?lk("predicate",c.guard_predicate_id,c.guard_predicate_id)+" <span class=\"m\">v"+e(c.guard_version)+"</span>":""],
  ["guard means",md(c.guard_meaning)],["payload",X.has(c.payload)?val(c.payload):""],["source guard",md(c.source_guard)],
  ["transaction contract",X.has(c.transaction_contract)?val(c.transaction_contract):""],
  ["planned module","<code>"+e(c.planned_module)+"</code>"],["implementation status",statusPill(c.implementation_status)],
  ["schema ref","<code>"+e(c.schema_ref)+"</code>"],["stated in",c.source_doc?"<code>"+e(c.source_doc)+"</code>":""]])}});

REG("value",{label:"Values",group:"The contract",n:186,file:"values",title:"186 values",
 text:function(v){return v.id+" "+X.T(v.kind)},rowT:function(v){return v.id},rowS:function(v){return X.T(v.kind)}});
REG("primitive",{label:"Primitives",group:"The contract",n:58,file:"primitives",title:"58 primitives",
 text:function(p){return p.id+" "+X.T(p.semantics)},rowT:function(p){return p.id},rowS:function(p){return X.T(p.semantics)}});
REG("contract",{label:"Control contracts",group:"The contract",n:27,file:"control-contracts",title:"27 control contracts",
 text:function(c){return c.id+" "+(c.clauses||[]).join(" ")},rowT:function(c){return c.id},rowS:function(c){return (c.clauses||[]).length+" clauses"},
 det:function(c){return "<ul>"+(c.clauses||[]).map(function(x){return "<li>"+md(x)+"</li>"}).join("")+"</ul>"}});
REG("endpoint",{label:"Endpoints",group:"The contract",n:11,file:"endpoints",title:"11 HTTP endpoints",
 text:function(x){return x.id+" "+X.T(x.authority)},rowT:function(x){return x.id},rowS:function(x){return X.T(x.authority)}});
REG("binding",{label:"Subject bindings",group:"The contract",n:65,file:"subject-bindings",title:"65 subject bindings",
 text:function(x){return x.id+" "+X.T(x.kind)},rowT:function(x){return x.id},rowS:function(x){return X.T(x.kind)}});
REG("pin",{label:"Pinned conjuncts",group:"The contract",n:23,file:"pins",pick:function(r){return r.items},title:"23 pinned-conjunct tables",
 text:function(x){return x.id+" "+X.T(x.why)},rowT:function(x){return x.id},rowS:function(x){return X.T(x.why)||(typeof x.value==="object"?"table":X.T(x.value))},
 note:"Hand-written assertions about the live registries, each paired with its own why prose.",
 det:function(x){return (x.why?"<p>"+md(x.why)+"</p>":"")+sub("value")+val(x.value)}});
REG("classmap",{label:"Class mapping",group:"The contract",n:9,file:"class-mapping",title:"9 class-mapping rows",
 text:function(x){return x.id+" "+JSON.stringify(x.value)},rowT:function(x){return x.id},rowS:function(x){return typeof x.value==="string\"?x.value:\"table"},
 det:function(x){return val(x.value)}});
REG("adapter",{label:"Adapters",group:"Delivery",n:7,file:"adapters",title:"7 fulfillment adapters",
 text:function(x){return x.id+" "+X.T(x.implemented_target)},rowT:function(x){return x.id},rowS:function(x){return X.T(x.implemented_target||x.selected)}});
REG("profile",{label:"Execution profiles",group:"Delivery",n:3,file:"execution-profiles",title:"3 native execution profiles",
 text:function(x){return x.id+" "+X.T(x.launch_interface)},rowT:function(x){return x.id},rowS:function(x){return X.T(x.launch_interface)}});
})();

/* ---- capabilities, the build plan, and the judgement registers ---- */
(function(){
var X=window.__EX,D=X.D,e=X.e,md=X.md,kv=X.kv,val=X.val,rows=X.rows,sub=X.sub,pane=X.pane,srcline=X.srcline,
 lk=X.lk,chips=X.chips,graph=X.graph,diagram=X.diagram,href=X.href,cut=X.cut,statusPill=X.statusPill,byId=X.byId,REG=window.__REG;
var F=window.__F||(window.__F={});

X.view("capability",{label:"Capabilities",group:"Delivery",n:46,
 list:function(sel){return D("capabilities").then(function(A){
  var q=(F.cap||"").toLowerCase();
  var items=A.filter(function(c){return !q||(c.id+" "+c.name+" "+c.concern).toLowerCase().indexOf(q)>=0});
  return pane("46 capabilities",
   "<div class=\"filters\"><input data-f=\"cap\" placeholder=\"filter\" value=\""+e(F.cap||"")+"\"><span class=\"count\">"+items.length+" of "+A.length+"</span></div>"+
   "<div class=\"cards\">"+items.map(function(c){
    return "<a class=\"card"+(c.id===sel?" on":"")+"\" href=\""+href("capability",c.id)+"\"><span class=\"t\">"+e(c.id)+" \u00b7 "+e(c.name||c.concern)+"</span><span class=\"s\">"+e(cut(c.required_outcome||c.outcome,130))+"</span></a>"}).join("")+"</div>")})},
 detail:function(id){return D("capabilities").then(function(A){var c=byId("capabilities",A)[id];
  if(!c)return pane("Not found","<p>"+e(id)+" is not a capability id.</p>");
  return pane(c.id+" \u00b7 "+(c.name||c.concern),
   rows([["concern",md(c.concern)],["required outcome",md(c.required_outcome||c.outcome)],["purpose",md(c.purpose)],
    ["owner",c.owner_component?lk("component",c.owner_component,c.owner_component):""],
    ["consequence class",chips(c.consequence_classes)+(c.declared_floor?" floor <b>"+e(c.declared_floor)+"</b>":"")],
    ["declared floor source",c.declared_floor_source?"<code>"+e(c.declared_floor_source)+"</code>":""],
    ["implementation mode",md(c.implementation_mode)],["implementation status",statusPill(c.implementation_status)],
    ["dependencies",X.has(c.dependencies)?val(c.dependencies):X.none("none declared")],
    ["risks",chips(c.risk_refs)]])+
   sub("fulfillment route")+((c.route||[]).map(function(r){return "<h4>"+e(r.id)+"</h4>"+kv(r.definition)}).join("")||X.none())+
   sub("acceptance contract")+kv(c.acceptance||c.acceptance_contract)+
   sub("happy path")+"<p>"+md(c.happy_path)+"</p>"+
   rows([["evidence produced",val(c.evidence_produced)],["evaluation",val(c.evaluation)],["failure behaviour",md(c.failure_behavior)],
    ["replacement and removal",md(c.replacement_removal)],["state contract",X.has(c.state_contract)?val(c.state_contract):""],
    ["completion claim",md(c.completion_claim)],["authority",md(c.authority)],["inputs",val(c.inputs)],["outputs",val(c.outputs)]])+
   sub("requirements row")+kv(c.requirements_row)+
   sub("the source questions it answers ("+((c.questions||[]).length)+")")+chips(c.questions,"coverage")+
   sub("contract for each, in brief")+
   "<div class=\"rows\">"+(c.source_question_contracts||[]).map(function(s){
     return "<a class=\"row\" href=\""+href("sourceq",s.question_id)+"\"><span class=\"t\">"+e(s.question_id)+" "+statusPill(s.status)+"</span><span class=\"s\">"+e(cut(s.question,150))+"</span><span class=\"s\">"+e(cut(s.answer,220))+"</span></a>"}).join("")+"</div>"+
   "<p class=\"cap\">The full contracts live once in <code>source-question-contracts.json</code>; each row above opens its own.</p>"+
   srcline(c))})}});

REG("sourceq",{label:"Source-question contracts",group:"Delivery",n:116,file:"source-question-contracts",idf:"question_id",
 title:"116 source-question contracts",text:function(s){return s.question_id+" "+X.T(s.question)+" "+X.T(s.answer)},
 rowT:function(s){return s.question_id},rowS:function(s){return X.T(s.question)},
 detT:function(s){return s.question_id},
 det:function(s){return rows([["question",md(s.question)],["answer",md(s.answer)],["status",statusPill(s.status)],
  ["source field",e(String(s.source_field))],["answer location","<code>"+e(s.answer_location)+"</code>"],
  ["uncertainty",md(s.uncertainty)],["related capabilities",chips(s.related_capabilities,"capability")],
  ["supporting contracts",val(s.supporting_contracts)],["supporting capability contracts",val(s.supporting_capability_contracts)],
  ["decision refs",val(s.decision_refs)],["evidence refs",val(s.evidence_refs)],
  ["planned implementation",md(s.planned_implementation)],["planned test",md(s.planned_test)],
  ["implementation status",statusPill(s.implementation_status)],["completion claim",md(s.completion_claim)],
  ["the coverage row",lk("coverage",s.question_id,"open "+s.question_id+" in coverage")]])}});

X.view("stage",{label:"Build plan B00-B11",group:"Delivery",n:12,
 list:function(sel){return D("stages").then(function(S){
  var ns=S.map(function(s){return {id:s.id,label:s.name,sub:s.id+" \u00b7 "+s.status,href:href("stage",s.id),cls:s.id===sel?"on":"",title:s.name}});
  var es=[];S.forEach(function(s){(s.depends_on||[]).forEach(function(d){es.push({from:d,to:s.id,title:d+" before "+s.id})})});
  return pane("The construction graph",
   diagram(graph(ns,es,{w:172,gapx:70,chars:22}),"B00 to B11 and their declared dependencies, read from `implementation-graph.json` with names from chapter 08 section 7. An arrow means the tail stage must complete before the head stage starts. **Every stage reads `not-started`.**",
    "<span>arrow \u00b7 declared dependency</span>")+
   "<p class=\"cap\">Click a stage for what it builds, what completion evidence it requires, and what it does not prove.</p>")})},
 detail:function(id){return D("stages").then(function(S){var s=byId("stages",S)[id];if(!s)return "";
  return pane(s.id+" \u00b7 "+s.name,
   rows([["status",statusPill(s.status)],["depends on",chips(s.depends_on,"stage")],
    ["components",chips(s.components,"component")],["builds",md(s.builds)],
    ["required completion evidence",md(s.completion_evidence)],
    ["what it does not prove",md(s.does_not_prove)],
    ["completed evidence",X.has(s.completed_evidence)?val(s.completed_evidence):X.none("none recorded")],
    ["phase G judgment",s.phase_g_judgment==null?X.none("no such field exists anywhere in the package; the projection keeps it so the absence is visible"):val(s.phase_g_judgment)],
    ["name read from","<code>"+e(s.name_source)+"</code>"]])+srcline(s))})}});

REG("decision",{label:"Decisions",group:"Judgement",n:22,file:"decisions",title:"22 architecture decisions",
 text:function(d){return d.id+" "+X.T(d.title)+" "+X.T(d.decision)},rowT:function(d){return d.id+" \u00b7 "+d.title},rowS:function(d){return X.T(d.decision)},
 detT:function(d){return d.id+" \u00b7 "+d.title},
 det:function(d){return rows([["status",statusPill(d.status)],["date",e(d.date)],["owner",md(d.owner)],["problem",md(d.problem)],
  ["decision",md(d.decision)],["alternatives",val(d.alternatives)],["evidence and reasoning",val(d.evidence_and_reasoning)],
  ["epistemic basis",md(d.epistemic_basis)],["accepted design costs",val(d.accepted_design_costs)],
  ["external exposure authorized",val(d.external_exposure_authorized)],["reversibility",md(d.reversibility)],
  ["reopen trigger",md(d.reopen_trigger)],["implementation evidence",val(d.implementation_evidence)],
  ["architecture version",e(d.architecture_version)]])}});

REG("question",{label:"Founder questions",group:"Judgement",n:22,file:"questions",title:"22 open questions to the founder",
 text:function(q){return q.id+" "+X.T(q.question)},rowT:function(q){return q.id},rowS:function(q){return X.T(q.question)},
 detT:function(q){return q.id},
 det:function(q){return rows([["question",md(q.question)],["status",statusPill(q.status)],["owner",md(q.owner)],
  ["kind",e(q.kind)],["evidence",md(q.evidence)],["asked",md(q.asked)]])+
  sub("the packet put to the founder")+kv(q.packet)+
  sub("the recorded resolution")+(X.has(q.resolution)?val(q.resolution):X.none("no resolution recorded"))}});

REG("risk",{label:"Risks",group:"Judgement",n:17,file:"risks",title:"17 risks",
 text:function(r){return r.id+" "+X.T(r.title)},rowT:function(r){return r.id+" \u00b7 "+r.title},rowS:function(r){return X.T(r.cause)},
 detT:function(r){return r.id+" \u00b7 "+r.title},
 det:function(r){return rows([["status",statusPill(r.status)],["cause",md(r.cause)],["likelihood or uncertainty",md(r.likelihood_or_uncertainty)],
  ["consequence",md(r.consequence)],["prevention",val(r.prevention)],["detection",val(r.detection)],["containment",val(r.containment)],
  ["rollback or compensation",md(r.rollback_or_compensation)],["residual risk",md(r.residual_risk)],
  ["accountable owner",md(r.accountable_owner)],["escalation requirement",md(r.escalation_requirement)],
  ["revalidation",md(r.revalidation)],["design evidence",val(r.design_evidence)],["implementation evidence",val(r.implementation_evidence)],
  ["attack cases",chips(r.attack_cases,"attack")]])+
  sub("each attack case, resolved")+"<div class=\"rows\">"+(r.attack_cases_joined||[]).map(function(a){
   return "<a class=\"row\" href=\""+href("attack",a.id)+"\"><span class=\"t\">"+e(a.id)+" "+statusPill(a.status)+"</span><span class=\"s\">"+e(cut(a.case,200))+"</span></a>"}).join("")+"</div>"}});

REG("attack",{label:"Attack cases",group:"Judgement",n:33,file:"attacks",pick:function(r){return r.items},title:"33 attack cases",
 text:function(a){return a.id+" "+X.T(a.case)},rowT:function(a){return a.id},rowS:function(a){return X.T(a.case)},
 note:"Coverage here is the presence of a concrete review discussion, not a passing test.",
 det:function(a){return rows([["case",md(a.case)],["status",statusPill(a.status)],
  ["selected architecture response",md(a.selected_architecture_response)],["implementation test",md(a.implementation_test)],
  ["enforcement",md(a.enforcement)],["enforcement basis",val(a.enforcement_basis)],["gap",md(a.gap)],
  ["specification refs",val(a.specification_refs)],["falsifier refs",val(a.falsifier_refs)],
  ["candidate reviews",val(a.candidate_reviews)]])}});
})();

/* ---- reviews, findings, coverage, and the chapter reader ---- */
(function(){
var X=window.__EX,D=X.D,e=X.e,md=X.md,kv=X.kv,val=X.val,rows=X.rows,sub=X.sub,pane=X.pane,srcline=X.srcline,
 lk=X.lk,chips=X.chips,href=X.href,cut=X.cut,statusPill=X.statusPill,REG=window.__REG;
var F=window.__F||(window.__F={});
function selbar(key,label,opts,cur,n,total){
 return "<div class=\"filters\"><input data-f=\""+key+"\" placeholder=\"filter\" value=\""+e(F[key]||"")+"\">"+
  "<select data-f=\""+key+"s\"><option value=\"\">"+e(label)+"</option>"+
  opts.map(function(o){return "<option"+(o===cur?" selected":"")+">"+e(o)+"</option>"}).join("")+"</select>"+
  "<span class=\"count\">"+n+" of "+total+"</span></div>"}

REG("review",{label:"Reviews",group:"Judgement",n:39,file:"reviews",title:"39 archived reviews",
 text:function(r){return r.id+" "+X.T(r.title)+" "+X.T(r.verdict_line)+" "+X.T(r.precis)},
 rowT:function(r){return r.id},rowS:function(r){return X.T(r.verdict_line)||X.T(r.title)},
 detT:function(r){return r.title||r.id},
 det:function(r){return rows([["verdict line",md(r.verdict_line)],["verdicts",chips(r.verdicts)],
  ["date",e(r.date)],["subject sha",r.subject_sha?"<code>"+e(r.subject_sha)+"</code>":X.none("this is the protocol, not a review of a subject")],
  ["class mentions",X.has(r.class_mentions)?val(r.class_mentions):""],["file","<code>"+e(r.path)+"</code>"],["bytes",e(String(r.bytes))]])+
  sub("provenance, as the review opens")+"<div class=\"prose\"><blockquote>"+md(r.provenance)+"</blockquote></div>"+
  sub("pr\u00e9cis \u2014 its first prose paragraph")+"<div class=\"prose\"><p>"+md(r.precis)+"</p></div>"}});

X.view("finding",{label:"Findings",group:"Judgement",n:286,
 list:function(sel){return D("findings").then(function(A){
  var all=A.items.map(function(x,i){var c={};for(var k in x)c[k]=x[k];c.key=x.register+"/"+x.id;c.i=i;return c});
  var regs=[];all.forEach(function(x){if(regs.indexOf(x.register)<0)regs.push(x.register)});
  var q=(F.fnd||"").toLowerCase(),rg=F.fnds||"";
  var items=all.filter(function(x){return (!rg||x.register===rg)&&(!q||JSON.stringify(x).toLowerCase().indexOf(q)>=0)});
  var shown=items.slice(0,250);
  return pane("286 findings across four registers",
   selbar("fnd","every register",regs,rg,items.length,all.length)+
   "<div class=\"rows\">"+shown.map(function(x){
    return "<a class=\"row"+(x.key===sel?" on":"")+"\" href=\""+href("finding",x.key)+"\"><span class=\"t\">"+e(x.id)+"<span class=\"m\">"+e(x.register)+(x.class?" \u00b7 class ("+e(x.class)+")":"")+"</span>"+(x.status?statusPill(x.status):"")+"</span><span class=\"s\">"+e(cut(x.heading||x.review_subject||(x.positions||[]).join(" vs "),190))+"</span></a>"}).join("")+"</div>"+
   (items.length>shown.length?"<p class=\"cap\">Showing the first 250 of "+items.length+" matches.</p>":""))})},
 detail:function(key){return D("findings").then(function(A){var x=null;
  A.items.forEach(function(y,i){if(y.register+"/"+y.id===key)x=y});
  if(!x)return pane("Not found","<p><code>"+e(key)+"</code> is not a finding.</p>");
  return pane(x.id+" \u00b7 "+x.register,kv(x)+srcline(x))})}});

X.view("coverage",{label:"Source questions",group:"Coverage",n:566,
 list:function(sel){return D("coverage").then(function(A){
  var all=A.items.map(function(x){x.reg="directive";return x})
   .concat(A.supplemental.map(function(x){x.reg="supplemental";return x}))
   .concat(A.discovered.map(function(x){x.reg="discovered";return x}));
  var sts=[];all.forEach(function(x){if(x.status&&sts.indexOf(x.status)<0)sts.push(x.status)});
  var q=(F.cov||"").toLowerCase(),st=F.covs||"";
  var items=all.filter(function(x){return (!st||x.status===st)&&(!q||(x.id+" "+X.T(x.question||x.concern)+" "+X.T(x.answer)).toLowerCase().indexOf(q)>=0)});
  var shown=items.slice(0,250);
  return pane("566 directive questions, 62 supplemental, 15 discovered",
   selbar("cov","every status",sts,st,items.length,all.length)+
   "<div class=\"rows\">"+shown.map(function(x){
    return "<a class=\"row"+(x.id===sel?" on":"")+"\" href=\""+href("coverage",x.id)+"\"><span class=\"t\">"+e(x.id)+statusPill(x.status)+"<span class=\"m\">"+e(x.reg)+"</span></span><span class=\"s\">"+e(cut(x.question||x.concern,190))+"</span></a>"}).join("")+"</div>"+
   (items.length>shown.length?"<p class=\"cap\">Showing the first 250 of "+items.length+" matches.</p>":"")+
   sub("how a status is computed")+kv(A.status_rule)+
   sub("the 24-item deliverable checklist")+val(A.package))})},
 detail:function(id){return D("coverage").then(function(A){var x=null;
  [].concat(A.items,A.supplemental,A.discovered).forEach(function(y){if(y.id===id)x=y});
  if(!x)return pane("Not found","<p><code>"+e(id)+"</code> is not a coverage row.</p>");
  return pane(x.id,rows([["question",md(x.question||x.concern)],["status",statusPill(x.status)],
   ["answer",md(x.answer)],["answer location","<code>"+e(x.answer_location)+"</code>"],
   ["answer field",x.answer_field?"<code>"+e(x.answer_field)+"</code>":""],
   ["field",x.field_title?e(x.field_title)+" ("+e(String(x.field))+")":""],
   ["component",chips(x.component,"component")],["evidence",val(x.evidence)],["decision",val(x.decision)],
   ["uncertainty",md(x.uncertainty)],["owner",md(x.owner)],
   ["implementation location",val(x.implementation_location)],["implementation status",statusPill(x.implementation_status)],
   ["verification refs",val(x.verification_refs)],["the full contract",lk("sourceq",x.id,"open the source-question contract")]])+srcline(x))})}});

X.view("chapter",{label:"Chapters",group:"The writing",n:19,
 list:function(sel,secSel){return D("chapters").then(function(CH){
  if(!sel)return pane("19 documents, 340 sections",
   "<div class=\"rows\">"+CH.map(function(c){return "<a class=\"row\" href=\""+href("chapter",c.id)+"\"><span class=\"t\">"+e(c.title)+"</span><span class=\"s\"><span class=\"m\">"+e(c.path)+"</span> \u00b7 "+c.sections.length+" sections</span></a>"}).join("")+"</div>"+
   "<p class=\"cap\">Each section is rendered from the markdown the package carries, and every id it names below it is a link.</p>");
  var c=null;CH.forEach(function(x){if(x.id===sel)c=x});
  if(!c)return pane("Not found","<p><code>"+e(sel)+"</code> is not a chapter.</p>");
  var s=null;c.sections.forEach(function(x){if(x.id===secSel)s=x});
  if(!s)s=c.sections[0];
  var m=s.mentions||{},ml=[];
  [["records","record"],["capabilities","capability"],["components","component"],["decisions","decision"],["questions","question"],["risks","risk"],["attacks","attack"],["stages","stage"],["adapters","adapter"]].forEach(function(p){
   if((m[p[0]]||[]).length)ml.push("<dt>"+e(p[0])+"</dt><dd>"+chips(m[p[0]],p[1])+"</dd>")});
  return pane(c.title,
   "<div class=\"filters\"><span class=\"m\">"+e(c.path)+"</span><span class=\"count\">"+c.sections.length+" sections</span></div>"+
   "<div class=\"toc\">"+c.sections.map(function(x){return "<a class=\"l"+x.level+(x.id===s.id?" on":"")+"\" href=\""+href("chapter",c.id,x.id)+"\">"+e(x.heading)+"</a>"}).join("")+"</div>")+
   pane(null,"<div class=\"prose\">"+s.html+"</div>"+
    (ml.length?sub("what this section names")+"<dl class=\"kv\">"+ml.join("")+"</dl>":"")+
    "<div class=\"src\"><b>where this is defined</b><br><code>"+e(s.source)+"</code> \u00b7 "+s.text_length+" characters of source text</div>")})},
 detail:null});
})();

/* ---- status strip, rail, router, search ---- */
(function(){
var X=window.__EX,D=X.D,e=X.e,md=X.md,kv=X.kv,val=X.val,rows=X.rows,sub=X.sub,pane=X.pane,srcline=X.srcline,
 lk=X.lk,chips=X.chips,href=X.href,cut=X.cut,statusPill=X.statusPill,V=X.V;
var F=window.__F||(window.__F={});
var $=function(i){return document.getElementById(i)};
var RAIL=$("rail"),CANVAS=$("canvas"),DETAIL=$("detail"),CRUMBS=$("crumbs"),QBOX=$("q"),RES=$("results");

X.view("status",{label:"Package status",group:"The writing",
 list:function(){return D("meta").then(function(M){
  var p=M.package;
  return pane("What this projection is, and what it is not",
   rows([["project",md(p.project)],["directive date",e(p.directive_date)],["phase",md(p.phase)],["status",statusPill(p.status)],
    ["architecture version",md(p.architecture_version)],
    ["planning accepted",p.planning_accepted?"<span class=\"pill ok\">yes</span>":"<span class=\"pill no\">no</span>"],
    ["implementation started",p.implementation_started?"<span class=\"pill ok\">yes</span>":"<span class=\"pill no\">no</span>"],
    ["founder hold",kv(p.founder_hold)],["validator last full run",kv(p.validator_last_full_run)],
    ["generated from","<code>"+e(M.head)+"</code> \u00b7 "+e(M.generated)],
    ["generator","<code>"+e(M.generator)+"</code>"],["package root","<code>"+e(M.package_root)+"</code>"],
    ["total bytes",e(String(M.total_bytes))]])+
   sub("every file in the projection")+
   "<table class=\"tbl\"><tr><th>file</th><th>rows</th><th>bytes</th></tr>"+
   M.files.map(function(f){return "<tr><td class=\"mono\">"+e(f.name)+"</td><td>"+e(String(f.count))+"</td><td>"+e(String(f.bytes))+"</td></tr>"}).join("")+"</table>"+
   srcline(M))})},detail:null});

/* findings can be addressed by bare id as well as register/id */
var fdet=V.finding.detail;
V.finding.detail=function(key){return D("findings").then(function(A){var x=null;
 A.items.forEach(function(y){if(!x&&(y.register+"/"+y.id===key||y.id===key))x=y});
 if(!x)return pane("Not found","<p><code>"+e(key)+"</code> is not a finding.</p>");
 return pane(x.id+" \u00b7 "+x.register,kv(x)+srcline(x))})};

/* ---- rail ---- */
var ORDER=["home","component","layer","record","predicate","command","value","primitive","contract","endpoint","binding","pin","classmap","capability","sourceq","stage","adapter","profile","decision","question","risk","attack","review","finding","coverage","chapter","status"];
function rail(sec){
 var g="",h="";
 ORDER.forEach(function(k){var v=V[k];if(!v)return;
  if(v.group!==g){g=v.group;h+="<div class=\"grp\">"+e(g)+"</div>"}
  h+="<a class=\""+(k===sec?"on":"")+"\" href=\""+href(k)+"\">"+e(v.label)+(v.n?"<span class=\"n\">"+v.n+"</span>":"")+"</a>"});
 RAIL.innerHTML=h}

/* ---- breadcrumb ---- */
function crumbs(r){
 var p=["<a href=\"#/\">System map</a>"];
 if(r.sec!=="home"){p.push("<a href=\""+href(r.sec)+"\">"+e(V[r.sec].label)+"</a>")}
 if(r.id)p.push("<span>"+e(r.id)+"</span>");
 if(r.sub)p.push("<span>"+e(r.sub)+"</span>");
 CRUMBS.innerHTML=p.join("<span class=\"sep\">/</span>")}

/* ---- router ---- */
var tick=0;
function parse(){var raw=location.hash.replace(/^#\/?/,"");var p=raw.split("/");
 return {sec:p[0]||"home",id:p[1]?decodeURIComponent(p[1]):null,sub:p[2]?decodeURIComponent(p[2]):null}}
function render(keepScroll){
 var r=parse();if(!V[r.sec]){r.sec="home";r.id=null}
 var v=V[r.sec],t=++tick;
 rail(r.sec);crumbs(r);
 CANVAS.innerHTML="<div class=\"pane\"><div class=\"loading\">reading the package</div></div>";
 Promise.resolve(v.list?v.list(r.id,r.sub):"").then(function(h){if(t!==tick)return;CANVAS.innerHTML=h;
  if(!keepScroll)window.scrollTo(0,0)}).catch(function(err){if(t===tick)CANVAS.innerHTML=pane("That did not load","<p>"+e(err.message)+"</p>")});
 if(r.id&&v.detail){DETAIL.innerHTML="<div class=\"pane\"><div class=\"loading\">reading the record</div></div>";
  Promise.resolve(v.detail(r.id,r.sub)).then(function(h){if(t!==tick)return;
   DETAIL.innerHTML="<div class=\"sheet-close\"><span class=\"lbl\">"+e(v.label)+"</span><a class=\"chip\" href=\""+href(r.sec)+"\">close</a></div>"+h})
   .catch(function(err){if(t===tick)DETAIL.innerHTML=pane("That did not load","<p>"+e(err.message)+"</p>")})}
 else DETAIL.innerHTML=""}
window.addEventListener("hashchange",function(){render(false)});

/* ---- delegated interaction ---- */
document.addEventListener("click",function(ev){
 var n=ev.target;while(n&&n!==document.body){if(n.getAttribute&&n.getAttribute("data-h")){location.hash=n.getAttribute("data-h");ev.preventDefault();return}n=n.parentNode}});
function onFilter(ev){var t=ev.target;if(!t.getAttribute||!t.getAttribute("data-f"))return;
 var k=t.getAttribute("data-f");F[k]=t.value;
 var id=t.getAttribute("data-f"),isText=t.tagName==="INPUT";
 render(true);
 if(isText)setTimeout(function(){var n=document.querySelector("[data-f=\""+k+"\"]");if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}},60)}
document.addEventListener("input",onFilter);
document.addEventListener("change",onFilter);

/* ---- theme ---- */
var TH=$("themebtn");
function setTheme(v){if(v)document.documentElement.setAttribute("data-theme",v);else document.documentElement.removeAttribute("data-theme");
 try{localStorage.setItem("ex-theme",v||"")}catch(x){}
 TH.textContent=v||"auto"}
try{var saved=localStorage.getItem("ex-theme");if(saved)setTheme(saved);else TH.textContent="auto"}catch(x){}
TH.addEventListener("click",function(){var c=document.documentElement.getAttribute("data-theme");setTheme(c==="light"?"dark":c==="dark"?"":"light")});

/* ---- search ---- */
var SMAP={predicate:"predicate",question:"coverage",finding:"finding",record:"record",value:"value","source-question":"sourceq",
 command:"command","subject-binding":"binding",supplemental:"coverage",primitive:"primitive",capability:"capability",review:"review",
 attack:"attack","control-contract":"contract",pin:"pin",decision:"decision","open-question":"question",risk:"risk",
 discovered:"coverage",stage:"stage",endpoint:"endpoint",component:"component",adapter:"adapter",layer:"layer","execution-profile":"profile"};
function target(x){
 if(x.type==="section"){var i=x.id.indexOf("#");return href("chapter",x.id.slice(0,i),x.id.slice(i+1))}
 var s=SMAP[x.type];return s?href(s,x.id):null}
var timer=null;
function search(q){
 q=q.trim().toLowerCase();
 if(q.length<2){RES.hidden=true;RES.innerHTML="";return}
 D("search").then(function(S){
  var hits=[],ql=q;
  for(var i=0;i<S.length&&hits.length<400;i++){var x=S[i];
   var id=String(x.id).toLowerCase(),ti=String(x.title||"").toLowerCase();
   var sc=id===ql?0:id.indexOf(ql)===0?1:ti.indexOf(ql)===0?2:id.indexOf(ql)>=0?3:ti.indexOf(ql)>=0?4:String(x.snippet||"").toLowerCase().indexOf(ql)>=0?5:-1;
   if(sc>=0)hits.push([sc,x])}
  hits.sort(function(a,b){return a[0]-b[0]});
  hits=hits.slice(0,60);
  if(!hits.length){RES.innerHTML="<div class=\"noneleft\">nothing in the package matches that</div>";RES.hidden=false;return}
  var g="",h="";
  hits.forEach(function(p,i){var x=p[1],t=target(x);if(!t)return;
   if(x.type!==g){g=x.type;h+="<div class=\"rgroup\">"+e(g)+"</div>"}
   h+="<a href=\""+t+"\""+(i===0?" class=\"on\"":"")+"><span class=\"rt\">"+e(cut(x.title||x.id,90))+"</span><span class=\"rs\">"+e(x.id)+" \u00b7 "+e(cut(x.snippet,140))+"</span></a>"});
  RES.innerHTML=h;RES.hidden=false})}
QBOX.addEventListener("input",function(){clearTimeout(timer);var v=QBOX.value;timer=setTimeout(function(){search(v)},130)});
QBOX.addEventListener("keydown",function(ev){
 if(ev.key==="Enter"){var a=RES.querySelector("a");if(a){location.hash=a.getAttribute("href");RES.hidden=true;QBOX.blur()}}
 if(ev.key==="Escape"){RES.hidden=true;QBOX.blur()}});
RES.addEventListener("click",function(){RES.hidden=true});
document.addEventListener("click",function(ev){if(!RES.contains(ev.target)&&ev.target!==QBOX)RES.hidden=true});

/* ---- boot ---- */
D("meta").then(function(M){var p=M.package,vr=p.validator_last_full_run||{},fh=p.founder_hold||{};
 $("statusline").innerHTML="<span><b>Phase</b> "+e(p.phase)+"</span>"+
  "<span><b>Planning accepted</b> "+(p.planning_accepted?"yes":"no")+"</span>"+
  "<span><b>Implementation started</b> "+(p.implementation_started?"yes":"no")+"</span>"+
  "<span><b>Founder hold</b> "+e(fh.date||"none")+(fh.lifted?", lifted":", not lifted")+"</span>"+
  "<span><b>Validator last full run</b> "+e(X.cut(vr.result,140)||"none")+" on "+e(vr.subject||"")+" ("+e(vr.date||"")+")</span>"+
  "<span>"+lk("status",null,"read the whole status")+"</span>";
 $("caveat").innerHTML="One model family reviewed this package. No runtime exists: nothing here has been executed. Every \u201cclosed\u201d, \u201canswered\u201d and \u201ccomplete\u201d below is specified behaviour checked offline against the written contracts \u2014 not a passing test. Projection generated from commit "+e(M.head_short)+".";
}).catch(function(err){$("statusline").innerHTML="<span>"+e(err.message)+"</span>"});
render(false);
setTimeout(function(){D("components");D("layers");D("stages");D("search")},400);
})();
