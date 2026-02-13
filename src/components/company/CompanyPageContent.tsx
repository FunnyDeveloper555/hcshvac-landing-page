import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface ContentBlock {
  id: string;
  type: "text" | "image" | "faq" | "cta" | "testimonial" | "list";
  data: Record<string, unknown>;
  order: number;
}

interface PageContent {
  title: string;
  subtitle: string;
  content: string;
  enabled: boolean;
  blocks?: ContentBlock[];
}

interface CompanyPageContentProps {
  pageContent: PageContent | null;
  pageLabel: string;
}

function TextBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-2">
      {(data.heading as string) && <h3 className="text-2xl font-semibold">{data.heading as string}</h3>}
      {(data.body as string) && <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed text-lg">{data.body as string}</p>}
    </div>
  );
}

function ImageBlock({ data }: { data: Record<string, unknown> }) {
  if (!(data.url as string)) return null;
  return (
    <figure className="space-y-2">
      <img src={data.url as string} alt={(data.alt as string) || ""} className="w-full max-h-96 object-cover rounded-xl" />
      {(data.caption as string) && <figcaption className="text-sm text-muted-foreground text-center">{data.caption as string}</figcaption>}
    </figure>
  );
}

function FaqBlock({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as Array<{ question: string; answer: string }>) || [];
  if (items.length === 0) return null;
  return (
    <Accordion type="multiple" className="w-full">
      {items.map((item, i) => (
        <AccordionItem key={i} value={`faq-${i}`}>
          <AccordionTrigger className="text-left text-lg">{item.question}</AccordionTrigger>
          <AccordionContent><p className="text-foreground/80 text-base">{item.answer}</p></AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function CtaBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-10 text-center space-y-4">
      {(data.heading as string) && <h3 className="text-3xl font-bold">{data.heading as string}</h3>}
      {(data.description as string) && <p className="text-muted-foreground text-lg max-w-xl mx-auto">{data.description as string}</p>}
      {(data.buttonText as string) && (
        <a href={(data.buttonUrl as string) || "#"}>
          <Button size="lg" className="mt-2">{data.buttonText as string}</Button>
        </a>
      )}
    </div>
  );
}

function TestimonialBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <blockquote className="border-l-4 border-primary pl-6 py-4 space-y-3">
      <p className="text-xl italic text-foreground/80">"{data.quote as string}"</p>
      <footer className="text-sm text-muted-foreground">
        — <span className="font-medium text-foreground">{(data.author as string) || "Anonymous"}</span>
        {(data.role as string) && <span>, {data.role as string}</span>}
      </footer>
    </blockquote>
  );
}

function ListBlock({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as string[]) || [];
  return (
    <div className="space-y-3">
      {(data.heading as string) && <h3 className="text-2xl font-semibold">{data.heading as string}</h3>}
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <span className="text-foreground/80 text-lg">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CompanyPageContent({ pageContent, pageLabel }: CompanyPageContentProps) {
  const title = pageContent?.title || pageLabel;
  const subtitle = pageContent?.subtitle;
  const blocks = pageContent?.blocks;
  const legacyContent = pageContent?.content;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
        {subtitle && <p className="text-xl text-muted-foreground">{subtitle}</p>}
      </div>

      {blocks && blocks.length > 0 ? (
        <div className="space-y-10">
          {blocks.map((block) => {
            switch (block.type) {
              case "text": return <TextBlock key={block.id} data={block.data} />;
              case "image": return <ImageBlock key={block.id} data={block.data} />;
              case "faq": return <FaqBlock key={block.id} data={block.data} />;
              case "cta": return <CtaBlock key={block.id} data={block.data} />;
              case "testimonial": return <TestimonialBlock key={block.id} data={block.data} />;
              case "list": return <ListBlock key={block.id} data={block.data} />;
              default: return null;
            }
          })}
        </div>
      ) : legacyContent ? (
        <div className="prose prose-lg max-w-none">
          <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed">{legacyContent}</p>
        </div>
      ) : (
        <p className="text-center text-muted-foreground">Content for this page is coming soon.</p>
      )}
    </div>
  );
}
