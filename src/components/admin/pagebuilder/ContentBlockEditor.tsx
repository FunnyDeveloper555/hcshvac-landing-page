import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Type, Image, HelpCircle, MousePointerClick, MessageSquareQuote, List, GalleryHorizontalEnd } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContentBlock {
  id: string;
  type: "text" | "image" | "faq" | "cta" | "testimonial" | "list" | "gallery";
  data: Record<string, unknown>;
  order: number;
}

interface ContentBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

const BLOCK_TYPES = [
  { value: "text", label: "Text", icon: Type },
  { value: "image", label: "Image", icon: Image },
  { value: "faq", label: "FAQ / Accordion", icon: HelpCircle },
  { value: "cta", label: "Call to Action", icon: MousePointerClick },
  { value: "testimonial", label: "Testimonial", icon: MessageSquareQuote },
  { value: "list", label: "Bullet List", icon: List },
  { value: "gallery", label: "Gallery", icon: GalleryHorizontalEnd },
] as const;

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function getDefaultData(type: ContentBlock["type"]): Record<string, unknown> {
  switch (type) {
    case "text": return { heading: "", body: "" };
    case "image": return { url: "", alt: "", caption: "" };
    case "faq": return { items: [{ question: "Question?", answer: "Answer." }] };
    case "cta": return { heading: "", description: "", buttonText: "Learn More", buttonUrl: "#" };
    case "testimonial": return { quote: "", author: "", role: "" };
    case "list": return { heading: "", items: ["Item 1"] };
    case "gallery": return { galleryId: "", heading: "" };
    default: return {};
  }
}

function BlockIcon({ type }: { type: ContentBlock["type"] }) {
  const found = BLOCK_TYPES.find(b => b.value === type);
  if (!found) return null;
  const Icon = found.icon;
  return <Icon className="w-4 h-4" />;
}

// --- Block Field Editors ---

function TextBlockFields({ data: rawData, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const data = rawData || { heading: "", body: "" };
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Heading (optional)</Label>
        <Input value={(data.heading as string) || ""} onChange={e => onChange({ ...data, heading: e.target.value })} placeholder="Section heading" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Body</Label>
        <Textarea value={(data.body as string) || ""} onChange={e => onChange({ ...data, body: e.target.value })} rows={6} placeholder="Paragraph text..." />
      </div>
    </div>
  );
}

function ImageBlockFields({ data: rawData, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const data = rawData || { url: "", alt: "", caption: "" };
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Image URL</Label>
        <Input value={(data.url as string) || ""} onChange={e => onChange({ ...data, url: e.target.value })} placeholder="https://..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Alt Text</Label>
          <Input value={(data.alt as string) || ""} onChange={e => onChange({ ...data, alt: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Caption (optional)</Label>
          <Input value={(data.caption as string) || ""} onChange={e => onChange({ ...data, caption: e.target.value })} />
        </div>
      </div>
      {(data.url as string) && (
        <img src={data.url as string} alt={(data.alt as string) || ""} className="max-h-40 rounded-md border object-cover" />
      )}
    </div>
  );
}

function FaqBlockFields({ data: rawData, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const data = rawData || { items: [] };
  const items = (data.items as Array<{ question: string; answer: string }>) || [];
  const updateItem = (i: number, field: string, val: string) => {
    const updated = items.map((item, idx) => idx === i ? { ...item, [field]: val } : item);
    onChange({ ...data, items: updated });
  };
  const addItem = () => onChange({ ...data, items: [...items, { question: "", answer: "" }] });
  const removeItem = (i: number) => onChange({ ...data, items: items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border rounded-md p-3 space-y-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">FAQ Item {i + 1}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(i)}><Trash2 className="w-3 h-3" /></Button>
          </div>
          <Input value={item.question} onChange={e => updateItem(i, "question", e.target.value)} placeholder="Question" />
          <Textarea value={item.answer} onChange={e => updateItem(i, "answer", e.target.value)} placeholder="Answer" rows={2} />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add FAQ Item</Button>
    </div>
  );
}

function CtaBlockFields({ data: rawData, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const data = rawData || { heading: "", description: "", buttonText: "", buttonUrl: "" };
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Heading</Label>
        <Input value={(data.heading as string) || ""} onChange={e => onChange({ ...data, heading: e.target.value })} placeholder="Ready to get started?" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Textarea value={(data.description as string) || ""} onChange={e => onChange({ ...data, description: e.target.value })} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Button Text</Label>
          <Input value={(data.buttonText as string) || ""} onChange={e => onChange({ ...data, buttonText: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Button URL</Label>
          <Input value={(data.buttonUrl as string) || ""} onChange={e => onChange({ ...data, buttonUrl: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

function TestimonialBlockFields({ data: rawData, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const data = rawData || { quote: "", author: "", role: "" };
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Quote</Label>
        <Textarea value={(data.quote as string) || ""} onChange={e => onChange({ ...data, quote: e.target.value })} rows={3} placeholder="Customer quote..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Author</Label>
          <Input value={(data.author as string) || ""} onChange={e => onChange({ ...data, author: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Role / Title</Label>
          <Input value={(data.role as string) || ""} onChange={e => onChange({ ...data, role: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

function ListBlockFields({ data: rawData, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const data = rawData || { heading: "", items: [] };
  const items = (data.items as string[]) || [];
  const updateItem = (i: number, val: string) => onChange({ ...data, items: items.map((item, idx) => idx === i ? val : item) });
  const addItem = () => onChange({ ...data, items: [...items, ""] });
  const removeItem = (i: number) => onChange({ ...data, items: items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Heading (optional)</Label>
        <Input value={(data.heading as string) || ""} onChange={e => onChange({ ...data, heading: e.target.value })} />
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input value={item} onChange={e => updateItem(i, e.target.value)} placeholder={`Item ${i + 1}`} />
          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={() => removeItem(i)}><Trash2 className="w-3 h-3" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add Item</Button>
    </div>
  );
}

function GalleryBlockFields({ data: rawData, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const data = rawData || { galleryId: "", heading: "" };
  const { data: galleries = [] } = useQuery({
    queryKey: ["galleries-for-block"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("id, name, gallery_items(count)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Heading (optional)</Label>
        <Input value={(data.heading as string) || ""} onChange={e => onChange({ ...data, heading: e.target.value })} placeholder="Gallery heading" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Select Gallery</Label>
        <Select value={(data.galleryId as string) || ""} onValueChange={v => onChange({ ...data, galleryId: v })}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Choose a gallery..." />
          </SelectTrigger>
          <SelectContent>
            {galleries.map(g => (
              <SelectItem key={g.id} value={g.id}>
                <span className="flex items-center gap-2">
                  <GalleryHorizontalEnd className="w-3.5 h-3.5" />
                  {g.name} ({(g as any).gallery_items?.[0]?.count ?? 0} items)
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!(data.galleryId as string) && (
        <p className="text-xs text-muted-foreground">Select a gallery to embed its images/videos in this content.</p>
      )}
    </div>
  );
}

function BlockFieldsRouter({ block, onChange }: { block: ContentBlock; onChange: (data: Record<string, unknown>) => void }) {
  switch (block.type) {
    case "text": return <TextBlockFields data={block.data} onChange={onChange} />;
    case "image": return <ImageBlockFields data={block.data} onChange={onChange} />;
    case "faq": return <FaqBlockFields data={block.data} onChange={onChange} />;
    case "cta": return <CtaBlockFields data={block.data} onChange={onChange} />;
    case "testimonial": return <TestimonialBlockFields data={block.data} onChange={onChange} />;
    case "list": return <ListBlockFields data={block.data} onChange={onChange} />;
    case "gallery": return <GalleryBlockFields data={block.data} onChange={onChange} />;
    default: return null;
  }
}

function getBlockLabel(block: ContentBlock): string {
  const data = block.data || {};
  switch (block.type) {
    case "text": return (data.heading as string) || (data.body as string)?.slice(0, 30) || "Text Block";
    case "image": return (data.alt as string) || "Image Block";
    case "faq": return `FAQ (${((data.items as unknown[]) || []).length} items)`;
    case "cta": return (data.heading as string) || "Call to Action";
    case "testimonial": return (data.author as string) ? `"${(data.author as string)}"` : "Testimonial";
    case "list": return (data.heading as string) || "Bullet List";
    case "gallery": return (data.heading as string) || "Gallery";
    default: return "Block";
  }
}

export default function ContentBlockEditor({ blocks, onChange }: ContentBlockEditorProps) {
  const [addType, setAddType] = useState<ContentBlock["type"]>("text");
  const [selectedId, setSelectedId] = useState<string | null>(blocks[0]?.id || null);

  const selectedBlock = blocks.find(b => b.id === selectedId) || null;

  const addBlock = () => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type: addType,
      data: getDefaultData(addType),
      order: blocks.length,
    };
    onChange([...blocks, newBlock]);
    setSelectedId(newBlock.id);
  };

  const removeBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id).map((b, i) => ({ ...b, order: i }));
    onChange(newBlocks);
    if (selectedId === id) {
      setSelectedId(newBlocks[0]?.id || null);
    }
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === blocks.length - 1)) return;
    const newBlocks = [...blocks];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[index]];
    onChange(newBlocks.map((b, i) => ({ ...b, order: i })));
  };

  const updateBlockData = (id: string, data: Record<string, unknown>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, data } : b));
  };

  return (
    <div className="flex gap-4 min-h-[350px]">
      {/* Left Panel: Block List */}
      <div className="w-[280px] shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Select value={addType} onValueChange={(v) => setAddType(v as ContentBlock["type"])}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLOCK_TYPES.map(bt => (
                <SelectItem key={bt.value} value={bt.value}>
                  <span className="flex items-center gap-2">
                    <bt.icon className="w-3.5 h-3.5" /> {bt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={addBlock}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 border rounded-lg p-2 bg-muted/30">
          {blocks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No blocks yet. Add one above.</p>
          )}
          {blocks.map((block, index) => (
            <div
              key={block.id}
              onClick={() => setSelectedId(block.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors group text-sm",
                selectedId === block.id
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-muted border border-transparent"
              )}
            >
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <BlockIcon type={block.type} />
              <span className="flex-1 truncate text-xs">{getBlockLabel(block)}</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); moveBlock(index, "up"); }} disabled={index === 0}>
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); moveBlock(index, "down"); }} disabled={index === blocks.length - 1}>
                  <ChevronDown className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Selected Block Form */}
      <div className="flex-1 min-w-0">
        {selectedBlock ? (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BlockIcon type={selectedBlock.type} />
                <span className="capitalize">{selectedBlock.type}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Block {blocks.findIndex(b => b.id === selectedBlock.id) + 1}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BlockFieldsRouter
                block={selectedBlock}
                onChange={(data) => updateBlockData(selectedBlock.id, data)}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
            <p className="text-sm">Select a block to edit, or add one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
