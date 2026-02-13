import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Type, Image, HelpCircle, MousePointerClick, MessageSquareQuote, List } from "lucide-react";

export interface ContentBlock {
  id: string;
  type: "text" | "image" | "faq" | "cta" | "testimonial" | "list";
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
] as const;

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function getDefaultData(type: ContentBlock["type"]): Record<string, unknown> {
  switch (type) {
    case "text":
      return { heading: "", body: "" };
    case "image":
      return { url: "", alt: "", caption: "" };
    case "faq":
      return { items: [{ question: "Question?", answer: "Answer." }] };
    case "cta":
      return { heading: "", description: "", buttonText: "Learn More", buttonUrl: "#" };
    case "testimonial":
      return { quote: "", author: "", role: "" };
    case "list":
      return { heading: "", items: ["Item 1"] };
    default:
      return {};
  }
}

function BlockIcon({ type }: { type: ContentBlock["type"] }) {
  const found = BLOCK_TYPES.find(b => b.value === type);
  if (!found) return null;
  const Icon = found.icon;
  return <Icon className="w-4 h-4" />;
}

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
        <Textarea value={(data.body as string) || ""} onChange={e => onChange({ ...data, body: e.target.value })} rows={4} placeholder="Paragraph text..." />
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

function BlockFieldsRouter({ block, onChange }: { block: ContentBlock; onChange: (data: Record<string, unknown>) => void }) {
  switch (block.type) {
    case "text": return <TextBlockFields data={block.data} onChange={onChange} />;
    case "image": return <ImageBlockFields data={block.data} onChange={onChange} />;
    case "faq": return <FaqBlockFields data={block.data} onChange={onChange} />;
    case "cta": return <CtaBlockFields data={block.data} onChange={onChange} />;
    case "testimonial": return <TestimonialBlockFields data={block.data} onChange={onChange} />;
    case "list": return <ListBlockFields data={block.data} onChange={onChange} />;
    default: return null;
  }
}

export default function ContentBlockEditor({ blocks, onChange }: ContentBlockEditorProps) {
  const [addType, setAddType] = useState<ContentBlock["type"]>("text");

  const addBlock = () => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type: addType,
      data: getDefaultData(addType),
      order: blocks.length,
    };
    onChange([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id).map((b, i) => ({ ...b, order: i })));
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={addType} onValueChange={(v) => setAddType(v as ContentBlock["type"])}>
          <SelectTrigger className="w-[180px]">
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
        <Button variant="outline" size="sm" onClick={addBlock}>
          <Plus className="w-4 h-4 mr-1" /> Add Block
        </Button>
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
          <p className="text-sm">No content blocks yet. Add one above to get started.</p>
        </div>
      )}

      {blocks.map((block, index) => (
        <Card key={block.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <BlockIcon type={block.type} />
                <span className="capitalize">{block.type}</span>
                <span className="text-xs text-muted-foreground font-normal">Block {index + 1}</span>
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveBlock(index, "up")} disabled={index === 0}>
                  <ChevronUp className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveBlock(index, "down")} disabled={index === blocks.length - 1}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeBlock(block.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BlockFieldsRouter block={block} onChange={(data) => updateBlockData(block.id, data)} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
