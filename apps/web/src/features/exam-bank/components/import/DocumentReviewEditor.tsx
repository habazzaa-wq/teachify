"use client";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { KatexSpan, RunText } from "@/components/structured-question";
import type { ContentRun, DocumentBlock, QuestionDocument } from "@/components/structured-question";
import { StudioButton } from "@/components/studio";
import { AppTextarea, AppInput } from "@/components/ui";
import { cn } from "@/lib/cn";

interface Props { document: QuestionDocument; onChange: (next: QuestionDocument) => void; disabled?: boolean; }
const EDITABLE = new Set(["paragraph","heading","list","table","math","chemical_equation","callout","image","separator"]);
function createBlock(type: string): DocumentBlock {
  switch(type){
    case "paragraph": return { type:"paragraph", runs:[{kind:"text",text:"نص جديد"}] } as DocumentBlock;
    case "heading": return { type:"heading", level:2, runs:[{kind:"text",text:"عنوان جديد"}] } as DocumentBlock;
    case "math": return { type:"math", latex:"x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}", display:true } as DocumentBlock;
    case "chemical_equation": return { type:"chemical_equation", content:"2H_2 + O_2 \\rightarrow 2H_2O" } as DocumentBlock;
    case "list": return { type:"list", ordered:false, items:[{marker:"-",runs:[{kind:"text",text:"عنصر جديد"}]}] } as DocumentBlock;
    case "table": return { type:"table", rows:[["عنوان 1","عنوان 2"],["خلية 1","خلية 2"]], headerRow:true } as DocumentBlock;
    case "callout": return { type:"callout", text:"ملاحظة جديدة" } as DocumentBlock;
    case "separator": return { type:"separator" } as DocumentBlock;
    case "image": return { type:"image", src:"", alt:"صورة" } as DocumentBlock;
    case "unresolved_visual": return { type:"unresolved_visual", description:"عنصر بصري غير مستخرج" } as DocumentBlock;
    default: return { type:"paragraph", runs:[{kind:"text",text:"نص جديد"}] } as DocumentBlock;
  }
}
export function DocumentReviewEditor({ document: doc, onChange, disabled }: Props) {
  const [editingIndex, setEditingIndex] = useState<number|null>(null);
  const updateBlock = (i:number,next:DocumentBlock)=>{ const blocks=doc.blocks.map((b,idx)=>idx===i?next:b); onChange({...doc,blocks}); };
  const removeBlock = (i:number)=>{ onChange({...doc,blocks:doc.blocks.filter((_,idx)=>idx!==i)}); setEditingIndex(null); };
  const moveBlock = (i:number,delta:-1|1)=>{ const t=i+delta; if(t<0||t>=doc.blocks.length) return; const blocks=[...doc.blocks]; const a=blocks[i]!,b=blocks[t]!; blocks[i]=b; blocks[t]=a; onChange({...doc,blocks}); setEditingIndex(null); };
  const insertBlock = (index:number, type:string)=>{ const nb=createBlock(type); const blocks=[...doc.blocks]; blocks.splice(index,0,nb); onChange({...doc,blocks}); setEditingIndex(index); };
  const addBlock = (type:string)=>{ onChange({...doc,blocks:[...doc.blocks, createBlock(type)]}); setEditingIndex(doc.blocks.length); };
  const blockText = (block: DocumentBlock): string=>{
    switch(block.type){
      case "paragraph": return runsToPlainText((block as any).runs);
      case "heading": return runsToPlainText((block as any).runs);
      case "list": return (block as any).items.map((it:any)=>`${it.marker} ${runsToPlainText(it.runs)}`).join("\n");
      case "table": return (block as any).rows.map((r:string[])=>r.join(" | ")).join("\n");
      case "math": return (block as any).latex;
      case "chemical_equation": return (block as any).content;
      case "callout": return (block as any).text ?? runsToPlainText((block as any).runs ?? []);
      case "image": return (block as any).src;
      case "separator": return "---";
      case "unresolved_visual": return (block as any).description ?? "";
      default: return "";
    }
  };
  const setBlockText = (block: DocumentBlock, raw:string): DocumentBlock=>{
    switch(block.type){
      case "paragraph": { const lines=splitLines(raw); const first=lines[0]; if(first===undefined) return block; return {...block, runs:[{kind:"text",text:first} as ContentRun]} as DocumentBlock; }
      case "heading": return {...block, runs:[{kind:"text",text:raw.trim()} as ContentRun]} as DocumentBlock;
      case "list": return {...block, items: splitLines(raw).map((line)=>{ const m=line.match(/^(\(?\s*(?:\d{1,3}|[A-Za-z\u0621-\u064A])\s*[.\)\-–—:]|-)\s*(.+)$/u); const marker=m?.[1]?.trim() ?? "-"; const text=m?.[2]?.trim() ?? line.trim(); return {marker,runs:[{kind:"text",text} as ContentRun]}; }).filter((it)=> (it.runs[0] as any)?.text!=="")} as DocumentBlock;
      case "table": return {...block, rows: splitLines(raw).map((l)=>l.split("|").map((c)=>c.trim()))} as DocumentBlock;
      case "math": return {...block, latex: raw.trim()} as DocumentBlock;
      case "chemical_equation": return {...block, content: raw.trim()} as DocumentBlock;
      case "callout": return {...block, text: raw.trim()} as DocumentBlock;
      case "image": return {...block, src: raw.trim()} as DocumentBlock;
      case "unresolved_visual": return {...block, description: raw.trim()} as DocumentBlock;
      default: return block;
    }
  };
  const hasUnresolved = doc.blocks.some((b)=>b.type==="unresolved_visual");
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-studio-fg-muted">راجع المحتوى المستخرج وصحّح أي أخطاء قبل إنشاء السؤال. يمكنك إضافة أو حذف أو إعادة ترتيب الكتل.</p>
        <span dir="auto" className="rounded-md bg-studio-soft px-2 py-0.5 text-[11px] text-studio-fg-muted">{doc.direction==="rtl"?"من اليمين لليسار":"من اليسار لليمين"} · {doc.language==="ar"?"عربي":doc.language==="en"?"إنجليزي":"مختلط"}</span>
      </div>
      {hasUnresolved && <div className="flex items-start gap-2 rounded-lg border border-amber-400/60 bg-amber-50/50 p-3 text-xs text-amber-800"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>يوجد عناصر بصرية لم يستخرجها النظام. أكمل محتواها يدوياً كنص أو معادلة، أو احذفها.</span></div>}
      {doc.blocks.map((block,index)=>{
        const isEditing=editingIndex===index;
        const canEdit = EDITABLE.has(block.type) || block.type==="unresolved_visual";
        return (
          <div key={index} data-block-index={index} className={cn("group relative rounded-xl border p-3 transition-colors", block.type==="unresolved_visual"?"border-dashed border-amber-400 bg-amber-50/40":"border-studio-border bg-studio-surface")}>
            {!disabled && (
              <div className="absolute end-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                {canEdit && <button type="button" aria-label={`تعديل ${index+1}`} onClick={()=>setEditingIndex(isEditing?null:index)} className="rounded-md p-1.5 text-studio-fg-muted hover:bg-studio-soft hover:text-studio-fg"><Pencil className="h-3.5 w-3.5" /></button>}
                <button type="button" onClick={()=>moveBlock(index,-1)} disabled={index===0} className="rounded-md p-1.5 text-studio-fg-muted hover:bg-studio-soft disabled:opacity-40"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={()=>moveBlock(index,1)} disabled={index===doc.blocks.length-1} className="rounded-md p-1.5 text-studio-fg-muted hover:bg-studio-soft disabled:opacity-40"><ArrowDown className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={()=>removeBlock(index)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            )}
            <div className="absolute -top-2 start-1/2 hidden -translate-x-1/2 group-hover:flex gap-1">
              {!disabled && <button type="button" onClick={()=>insertBlock(index,"paragraph")} className="rounded-full bg-white border border-studio-border px-2 py-0.5 text-[10px] text-studio-fg-muted shadow hover:bg-studio-soft">+ قبل</button>}
            </div>
            {isEditing ? (
              <div className="space-y-2 pe-24">
                <AppTextarea autoFocus value={blockText(block)} disabled={disabled} rows={Math.min(8, Math.max(2, blockText(block).split("\n").length))} dir={block.type==="math"?"ltr":doc.direction} onChange={(e)=>updateBlock(index, setBlockText(block,e.target.value))} />
                {block.type==="math" && <KatexSpan latex={(block as any).latex} className="text-xs text-studio-fg-muted" />}
                {block.type==="image" && <p className="text-xs text-studio-fg-muted">ضع رابط الصورة أو اتركه فارغاً لرمز بديل. لإضافة صورة مرفوعة استخدم مكتبة الوسائط.</p>}
                <div className="flex gap-2">
                  <StudioButton variant="secondary" size="sm" onClick={()=>setEditingIndex(null)}>تم</StudioButton>
                  {(block.type==="unresolved_visual") && <StudioButton variant="secondary" size="sm" onClick={()=>updateBlock(index,{type:"paragraph",runs:[{kind:"text",text:(block as any).description}] } as any)}>تحويل لنص</StudioButton>}
                </div>
              </div>
            ) : <BlockPreview block={block} direction={doc.direction} index={index} />}
            <div className="absolute -bottom-2 start-1/2 hidden -translate-x-1/2 group-hover:flex">
              {!disabled && <button type="button" onClick={()=>insertBlock(index+1,"paragraph")} className="rounded-full bg-white border border-studio-border px-2 py-0.5 text-[10px] text-studio-fg-muted shadow hover:bg-studio-soft">+ بعد</button>}
            </div>
          </div>
        );
      })}
      {doc.blocks.length===0 && <p className="rounded-xl border border-dashed border-studio-border p-6 text-center text-sm text-studio-fg-muted">لم يتم استخراج أي محتوى. أضف كتلة جديدة.</p>}
      {!disabled && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-studio-border bg-studio-soft/30 p-3">
          <span className="text-xs text-studio-fg-muted w-full mb-1">إضافة كتلة:</span>
          {([
            ["paragraph","فقرة"],
            ["heading","عنوان"],
            ["math","معادلة"],
            ["chemical_equation","كيمياء"],
            ["list","قائمة"],
            ["table","جدول"],
            ["callout","تنبيه"],
            ["separator","فاصل"],
            ["image","صورة"],
          ] as const).map(([k,l])=>(
            <button key={k} type="button" onClick={()=>addBlock(k)} className="inline-flex items-center gap-1 rounded-full border border-studio-border bg-white px-3 py-1 text-xs text-studio-fg hover:bg-studio-soft"><Plus className="h-3 w-3" />{l}</button>
          ))}
        </div>
      )}
    </div>
  );
}
function BlockPreview({ block, direction, index }: { block: DocumentBlock; direction:"rtl"|"ltr"; index:number }){
  switch(block.type){
    case "paragraph": return <p dir={direction} className="pe-24 leading-relaxed text-studio-fg"><RunText runs={(block as any).runs} /></p>;
    case "heading": return <h4 dir={direction} className="pe-24 font-semibold text-studio-fg"><RunText runs={(block as any).runs} /></h4>;
    case "list": return <ul dir={direction} className="pe-24 space-y-1 text-studio-fg">{(block as any).items.map((it:any,i:number)=><li key={i} className="flex gap-2"><span className="shrink-0 font-medium text-studio-fg-muted">{it.marker}</span><span><RunText runs={it.runs} /></span></li>)}</ul>;
    case "table": return <div className="overflow-x-auto pe-24"><table className="min-w-full border-collapse text-sm"><tbody>{(block as any).rows.map((row:string[],r:number)=><tr key={r}>{row.map((cell:string,c:number)=><td key={c} dir="auto" className="border border-studio-border px-2 py-1 text-studio-fg">{cell}</td>)}</tr>)}</tbody></table></div>;
    case "math": return <div dir="ltr" className="overflow-x-auto rounded-lg bg-studio-soft/50 p-2 pe-28 text-center"><KatexSpan latex={(block as any).latex} /></div>;
    case "chemical_equation": return <div dir="ltr" className="rounded-lg border border-studio-border bg-studio-soft/40 p-2 text-center font-mono text-sm">{(block as any).content}</div>;
    case "callout": return <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{(block as any).runs ? <RunText runs={(block as any).runs} /> : (block as any).text}</div>;
    case "separator": return <hr className="my-2 border-studio-border" />;
    case "image": { const src=(block as any).src; if(!src) return <span className="text-xs text-studio-fg-subtle">كتلة صورة #{index+1} — فارغة، اضغط تعديل لإضافة رابط</span>; return <img src={src} alt={(block as any).alt ?? ""} className="mx-auto max-w-full rounded-lg border border-studio-border" loading="lazy" />; }
    case "diagram": return <div className="mx-auto max-w-md overflow-x-auto rounded-lg border border-studio-border bg-white p-3 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{__html:(block as any).svg}} />;
    case "unresolved_visual": return <div className="flex items-start gap-2 pe-24 text-xs text-amber-800"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{(block as any).description ?? "عنصر بصري غير مستخرج"} — حوله لنص أو احذفه.</span></div>;
    default: return <span className="text-xs text-studio-fg-subtle">كتلة #{index+1} ({(block as any).type})</span>;
  }
}
function runsToPlainText(runs:Array<{kind:string;text?:string;latex?:string}>):string{ return runs.map((r)=>r.kind==="inline_math"?` $${r.latex??""}$ `:(r.text??"")).join("").trim(); }
function splitLines(raw:string):string[]{ return raw.split(/\n+/).map((l)=>l.trim()).filter(Boolean); }
