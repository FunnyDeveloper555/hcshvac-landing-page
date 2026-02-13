import type { ContentBlock } from "./ContentBlockEditor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

function TextBlockPreview({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-2">
      {(data.heading as string) && <h3 className="text-xl font-semibold">{data.heading as string}</h3>}
      {(data.body as string) && <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">{data.body as string}</p>}
    </div>
  );
}

function ImageBlockPreview({ data }: { data: Record<string, unknown> }) {
  if (!(data.url as string)) return <div className="h-40 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">No image URL</div>;
  return (
    <figure className="space-y-2">
      <img src={data.url as string} alt={(data.alt as string) || ""} className="w-full max-h-64 object-cover rounded-lg" />
      {(data.caption as string) && <figcaption className="text-sm text-muted-foreground text-center">{data.caption as string}</figcaption>}
    </figure>
  );
}

function FaqBlockPreview({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as Array<{ question: string; answer: string }>) || [];
  if (items.length === 0) return null;
  return (
    <Accordion type="multiple" className="w-full">
      {items.map((item, i) => (
        <AccordionItem key={i} value={`faq-${i}`}>
          <AccordionTrigger className="text-left">{item.question || "Untitled Question"}</AccordionTrigger>
          <AccordionContent><p className="text-foreground/80">{item.answer}</p></AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function CtaBlockPreview({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center space-y-4">
      {(data.heading as string) && <h3 className="text-2xl font-bold">{data.heading as string}</h3>}
      {(data.description as string) && <p className="text-muted-foreground max-w-lg mx-auto">{data.description as string}</p>}
      {(data.buttonText as string) && (
        <Button className="mt-2">{data.buttonText as string}</Button>
      )}
    </div>
  );
}

function TestimonialBlockPreview({ data }: { data: Record<string, unknown> }) {
  return (
    <blockquote className="border-l-4 border-primary pl-6 py-2 space-y-2">
      <p className="text-lg italic text-foreground/80">"{data.quote as string}"</p>
      <footer className="text-sm text-muted-foreground">
        — <span className="font-medium text-foreground">{(data.author as string) || "Anonymous"}</span>
        {(data.role as string) && <span>, {data.role as string}</span>}
      </footer>
    </blockquote>
  );
}

function ListBlockPreview({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as string[]) || [];
  return (
    <div className="space-y-2">
      {(data.heading as string) && <h3 className="text-xl font-semibold">{data.heading as string}</h3>}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
            <span className="text-foreground/80">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ContentBlockPreview({ blocks }: { blocks: ContentBlock[] }) {
  if (blocks.length === 0) {
    return <p className="text-muted-foreground text-center py-6">No content blocks to preview.</p>;
  }

  return (
    <div className="space-y-8">
      {blocks.map((block) => {
        switch (block.type) {
          case "text": return <TextBlockPreview key={block.id} data={block.data} />;
          case "image": return <ImageBlockPreview key={block.id} data={block.data} />;
          case "faq": return <FaqBlockPreview key={block.id} data={block.data} />;
          case "cta": return <CtaBlockPreview key={block.id} data={block.data} />;
          case "testimonial": return <TestimonialBlockPreview key={block.id} data={block.data} />;
          case "list": return <ListBlockPreview key={block.id} data={block.data} />;
          default: return null;
        }
      })}
    </div>
  );
}
