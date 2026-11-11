/* PTM offline PDF writer. No network, CDN, print dialog, or third-party dependencies. */
(function(root){
'use strict';
const clean=s=>String(s??'').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2022]/g,'-').replace(/[\u00d7]/g,'x').replace(/[^\x20-\x7e\n]/g,'?');
const escapePdf=s=>clean(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
function wrap(s,max){const words=clean(s).replace(/\s+/g,' ').trim().split(' ');if(!words[0])return [''];const out=[];let line='';for(let word of words){while(word.length>max){if(line){out.push(line);line=''}out.push(word.slice(0,max));word=word.slice(max)}if(!word)continue;if((line?line.length+1:0)+word.length>max){out.push(line);line=word}else line+=(line?' ':'')+word}if(line)out.push(line);return out.length?out:['']}
function create(lines, title='PTM - Laporan Riwayat'){
 const pageW=595,pageH=842,left=48,top=784,bottom=56;
 const pages=[];let ops=[],y=top,shown=0;
 function page(){if(ops.length)pages.push(ops.join('\n'));ops=[];y=top;shown=0}
 function line(text,kind='normal'){
  let size=kind==='title'?17:kind==='heading'?12:kind==='minor'?10:9;
  let leading=kind==='title'?27:kind==='heading'?19:kind==='minor'?15:13;
  if(y-leading<bottom)page();
  let font=kind==='title'||kind==='heading'||kind==='minor'?'F2':'F1';
  ops.push(`BT /${font} ${size} Tf 1 0 0 1 ${left} ${y} Tm (${escapePdf(text)}) Tj ET`);
  y-=leading;shown++;
 }
 line(title,'title');line('Dibuat offline dari PTM - '+new Date().toLocaleString('id-ID'),'normal');line(' ','normal');
 for(const item of lines){
  if(item===null){line(' ');continue}
  const kind=typeof item==='object'?(item.kind||'normal'):'normal';
  const raw=typeof item==='object'?item.text:String(item);
  const width=kind==='title'?53:kind==='heading'?75:kind==='minor'?87:100;
  for(const piece of String(raw).split('\n'))for(const seg of wrap(piece,width))line(seg,kind);
 }
 page();
 const objs=[''];
 const add=x=>{objs.push(x);return objs.length-1};
 const catalog=add('');const pagesObj=add('');
 const fRegular=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
 const fBold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
 const kids=[];
 pages.forEach((content,i)=>{
  const labelled=content+`\nBT /F1 8 Tf 1 0 0 1 48 31 Tm (PTM - Halaman ${i+1} dari ${pages.length}) Tj ET`;
  const stream=add(`<< /Length ${labelled.length} >>\nstream\n${labelled}\nendstream`);
  const pid=add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 ${fRegular} 0 R /F2 ${fBold} 0 R >> >> /Contents ${stream} 0 R >>`);
  kids.push(`${pid} 0 R`);
 });
 objs[catalog]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
 objs[pagesObj]=`<< /Type /Pages /Count ${kids.length} /Kids [${kids.join(' ')}] >>`;
 let pdf='%PDF-1.4\n%PTM\n';const offsets=[0];
 for(let i=1;i<objs.length;i++){offsets.push(pdf.length);pdf+=`${i} 0 obj\n${objs[i]}\nendobj\n`}
 const xref=pdf.length;pdf+=`xref\n0 ${objs.length}\n0000000000 65535 f \n`;
 for(let i=1;i<objs.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
 pdf+=`trailer\n<< /Size ${objs.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
 return new Uint8Array(Array.from(pdf,c=>c.charCodeAt(0)));
}
root.PTMReportPDF={create};
})(typeof window!=='undefined'?window:globalThis);
