import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";
import { ArrowDown, ArrowUp, ImageIcon, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { readFinancing, type WebsiteFinancing } from "@/lib/blueFlameWebsite";

type Plan = { badge: string; title: string; apr: string; apr_unit: string; text: string; bullets: string[]; button_text: string };
type Step = { title: string; text: string; icon: string };
type Faq = { question: string; answer: string; icon: string };
type F = {
  enabled: boolean;
  hero_badge: string; hero_title: string; hero_intro: string;
  hero_button1: string; hero_button2: string;
  plans_badge: string; plans_title: string; plans_subtitle: string;
  plans: Plan[];
  calc_badge: string; calc_title: string; calc_subtitle: string;
  calc_min: string; calc_max: string; calc_default: string; calc_rebate: string;
  steps_badge: string; steps_title: string; steps_subtitle: string;
  steps: Step[];
  form_badge: string; form_title: string; form_subtitle: string; form_button: string;
  faq_badge: string; faq_title: string;
  faqs: Faq[];
};
const str = (v: unknown, d = "") => (typeof v === "string" && v.trim() ? v : d);
const sections: Record<string, { title: string; fields: (keyof F)[] }> = {
  "page-heading": { title: "Page Heading", fields: ["enabled", "hero_badge", "hero_title", "hero_intro", "hero_button1", "hero_button2"] },
  "payment-plans": { title: "Payment Plans", fields: ["plans_badge", "plans_title", "plans_subtitle", "plans"] },
  "payment-calculator": { title: "Payment Calculator", fields: ["calc_badge", "calc_title", "calc_subtitle", "calc_min", "calc_max", "calc_default", "calc_rebate"] },
  "how-it-works": { title: "How It Works", fields: ["steps_badge", "steps_title", "steps_subtitle", "steps"] },
  "pre-qualify-form": { title: "Pre-Qualify Form", fields: ["form_badge", "form_title", "form_subtitle", "form_button"] },
  "financing-faqs": { title: "Financing FAQs", fields: ["faq_badge", "faq_title", "faqs"] },
};

export default function FinancingSettings() {
  const { companyId, section } = useParams<{ companyId: string; section: string }>();
  const currentSection = section ? sections[section] : undefined;
  const client = useQueryClient();
  const [data, setData] = useState<F | null>(null);
  const [saving, setSaving] = useState(false);
  const [pick, setPick] = useState<string | null>(null);

  const company = useQuery({
    queryKey: ["company-financing", companyId], enabled: Boolean(companyId), staleTime: 30_000,
    queryFn: async () => {
      if (!companyId) throw new Error("Company required");
      const { data: row, error } = await supabase.from("companies").select("*").eq("id", companyId).single();
      if (error) throw error;
      return row as { name: string; financing?: unknown };
    },
  });
  const template = useQuery({
    queryKey: ["financing-template"], staleTime: Infinity,
    queryFn: async () => readFinancing(await (await fetch("/blueflame-site/financing.html")).text()),
  });

  useEffect(() => {
    if (!company.data || !template.data) return;
    const raw = company.data.financing;
    const s = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as WebsiteFinancing;
    const t = template.data;
    const plans = Array.isArray(s.plans) ? s.plans : [];
    const steps = Array.isArray(s.steps) ? s.steps : [];
    const faqs = Array.isArray(s.faqs) ? s.faqs : [];
    setData({
      enabled: s.enabled !== false,
      hero_badge: str(s.hero_badge, t.hero_badge), hero_title: str(s.hero_title, t.hero_title), hero_intro: str(s.hero_intro, t.hero_intro),
      hero_button1: str(s.hero_button1, t.hero_button1), hero_button2: str(s.hero_button2, t.hero_button2),
      plans_badge: str(s.plans_badge, t.plans_badge), plans_title: str(s.plans_title, t.plans_title), plans_subtitle: str(s.plans_subtitle, t.plans_subtitle),
      plans: Array.from({ length: Math.max(plans.length, (t.plans || []).length) }, (_, i) => ({
        badge: str(plans[i]?.badge, t.plans?.[i]?.badge),
        title: str(plans[i]?.title, t.plans?.[i]?.title),
        apr: str(plans[i]?.apr, t.plans?.[i]?.apr),
        apr_unit: str(plans[i]?.apr_unit, t.plans?.[i]?.apr_unit),
        text: str(plans[i]?.text, t.plans?.[i]?.text),
        bullets: Array.from({ length: Math.max(plans[i]?.bullets?.length || 0, t.plans?.[i]?.bullets?.length || 0) }, (_, j) => str(plans[i]?.bullets?.[j], t.plans?.[i]?.bullets?.[j])),
        button_text: str(plans[i]?.button_text, t.plans?.[i]?.button_text),
      })),
      calc_badge: str(s.calc_badge, t.calc_badge), calc_title: str(s.calc_title, t.calc_title), calc_subtitle: str(s.calc_subtitle, t.calc_subtitle),
      calc_min: str(s.calc_min, t.calc_min), calc_max: str(s.calc_max, t.calc_max), calc_default: str(s.calc_default, t.calc_default), calc_rebate: str(s.calc_rebate, t.calc_rebate),
      steps_badge: str(s.steps_badge, t.steps_badge), steps_title: str(s.steps_title, t.steps_title), steps_subtitle: str(s.steps_subtitle, t.steps_subtitle),
      steps: Array.from({ length: Math.max(steps.length, (t.steps || []).length) }, (_, i) => ({
        title: str(steps[i]?.title, t.steps?.[i]?.title),
        text: str(steps[i]?.text, t.steps?.[i]?.text),
        icon: str(steps[i]?.icon),
      })),
      form_badge: str(s.form_badge, t.form_badge), form_title: str(s.form_title, t.form_title), form_subtitle: str(s.form_subtitle, t.form_subtitle), form_button: str(s.form_button, t.form_button),
      faq_badge: str(s.faq_badge, t.faq_badge), faq_title: str(s.faq_title, t.faq_title),
      faqs: Array.from({ length: Math.max(faqs.length, (t.faqs || []).length) }, (_, i) => ({
        question: str(faqs[i]?.question, t.faqs?.[i]?.question),
        answer: str(faqs[i]?.answer, t.faqs?.[i]?.answer),
        icon: str(faqs[i]?.icon),
      })),
    });
    setPick(null);
  }, [company.data, template.data, section]);

  const setPlan = (i: number, p: Partial<Plan>) => setData(d => d && ({ ...d, plans: d.plans.map((x, j) => j === i ? { ...x, ...p } : x) }));
  const setStep = (i: number, p: Partial<Step>) => setData(d => d && ({ ...d, steps: d.steps.map((x, j) => j === i ? { ...x, ...p } : x) }));
  const setFaq = (i: number, p: Partial<Faq>) => setData(d => d && ({ ...d, faqs: d.faqs.map((x, j) => j === i ? { ...x, ...p } : x) }));
  const addFaq = () => setData(d => d && ({ ...d, faqs: [...d.faqs, { question: "", answer: "", icon: "" }] }));
  const removeFaq = (i: number) => setData(d => d && ({ ...d, faqs: d.faqs.filter((_, j) => j !== i) }));
  const moveFaq = (i: number, dir: -1 | 1) => setData(d => {
    if (!d) return d;
    const j = i + dir;
    if (j < 0 || j >= d.faqs.length) return d;
    const faqs = [...d.faqs];
    [faqs[i], faqs[j]] = [faqs[j], faqs[i]];
    return { ...d, faqs };
  });

  const onPick = (url: string) => {
    if (!pick) return;
    const [kind, n] = pick.split("-");
    const i = Number(n);
    if (kind === "step") setStep(i, { icon: url });
    else if (kind === "faq") setFaq(i, { icon: url });
    setPick(null);
  };

  const save = async () => {
    if (!companyId || !data || !currentSection) return;
    setSaving(true);
    try {
      const { data: latest, error: readError } = await supabase.from("companies").select("financing").eq("id", companyId).single();
      if (readError) throw readError;
      const raw = latest.financing;
      const existing = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
      const changes = Object.fromEntries(currentSection.fields.map(field => [field, data[field]]));
      const { error } = await supabase.from("companies").update({ financing: JSON.parse(JSON.stringify({ ...existing, ...changes })) } as never).eq("id", companyId).select("id").single();
      if (error) throw error;
      await client.invalidateQueries({ queryKey: ["company-financing", companyId] });
      toast.success(`${currentSection.title} saved`);
    } catch { toast.error("Could not save Financing"); }
    finally { setSaving(false); }
  };

  if (!currentSection && companyId) return <Navigate to={`/admin/page-builder/company/${companyId}/financing/page-heading`} replace />;
  if (company.isError || template.isError) return <div className="space-y-4"><p className="text-destructive">Could not load this section.</p><Button variant="outline" onClick={() => { company.refetch(); template.refetch(); }}>Retry</Button></div>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const iconRow = (icon: string, kind: string, i: number, clear: () => void) => (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {icon ? <img src={icon} alt="Icon" className="h-full w-full object-contain" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setPick(`${kind}-${i}`)}>{icon ? "Change icon" : "Choose icon"}</Button>
      {icon && <Button type="button" variant="ghost" size="icon" aria-label="Remove icon" onClick={clear}><X className="h-4 w-4" /></Button>}
    </div>
  );

  return <div className="space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-sm text-muted-foreground">Financing</p><h1 className="text-2xl font-bold">{currentSection?.title}</h1><p className="text-muted-foreground">{company.data?.name}</p></div>
      {section === "page-heading" && <div className="flex items-center gap-2"><Label htmlFor="fin-enabled">Show on website</Label><Switch id="fin-enabled" checked={data.enabled} onCheckedChange={enabled => setData(d => d && ({ ...d, enabled }))} /></div>}
    </header>

    {section === "page-heading" && <section className="space-y-4">
      <h2 className="font-semibold">Page heading</h2>
      <div className="space-y-2"><Label htmlFor="fin-hero-badge">Badge text</Label><Input id="fin-hero-badge" value={data.hero_badge} onChange={e => setData(d => d && ({ ...d, hero_badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-hero-title">Title</Label><Input id="fin-hero-title" value={data.hero_title} onChange={e => setData(d => d && ({ ...d, hero_title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-hero-intro">Intro paragraph</Label><Textarea id="fin-hero-intro" rows={3} value={data.hero_intro} onChange={e => setData(d => d && ({ ...d, hero_intro: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-hero-btn1">Main button text</Label><Input id="fin-hero-btn1" value={data.hero_button1} onChange={e => setData(d => d && ({ ...d, hero_button1: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-hero-btn2">Second button text</Label><Input id="fin-hero-btn2" value={data.hero_button2} onChange={e => setData(d => d && ({ ...d, hero_button2: e.target.value }))} /></div>
    </section>}

    {section === "payment-plans" && <section className="space-y-4">
      <h2 className="font-semibold">Section heading</h2>
      <div className="space-y-2"><Label htmlFor="fin-plans-badge">Badge text</Label><Input id="fin-plans-badge" value={data.plans_badge} onChange={e => setData(d => d && ({ ...d, plans_badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-plans-title">Title</Label><Input id="fin-plans-title" value={data.plans_title} onChange={e => setData(d => d && ({ ...d, plans_title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-plans-subtitle">Subtitle</Label><Input id="fin-plans-subtitle" value={data.plans_subtitle} onChange={e => setData(d => d && ({ ...d, plans_subtitle: e.target.value }))} /></div>
      <h2 className="font-semibold">Plan cards</h2>
      {data.plans.map((p, i) => <div key={i} className="space-y-3 rounded-md border p-4">
        <p className="text-sm font-medium">Plan {i + 1}</p>
        <Input aria-label={`Plan ${i + 1} badge`} placeholder="Badge" value={p.badge} onChange={e => setPlan(i, { badge: e.target.value })} />
        <Input aria-label={`Plan ${i + 1} title`} placeholder="Title" value={p.title} onChange={e => setPlan(i, { title: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input aria-label={`Plan ${i + 1} rate`} placeholder="Rate (e.g. 0%)" value={p.apr} onChange={e => setPlan(i, { apr: e.target.value })} />
          <Input aria-label={`Plan ${i + 1} rate label`} placeholder="Rate label (e.g. APR)" value={p.apr_unit} onChange={e => setPlan(i, { apr_unit: e.target.value })} />
        </div>
        <Textarea aria-label={`Plan ${i + 1} description`} rows={2} placeholder="Description" value={p.text} onChange={e => setPlan(i, { text: e.target.value })} />
        {p.bullets.map((b, j) => <Input key={j} aria-label={`Plan ${i + 1} bullet ${j + 1}`} placeholder={`Bullet ${j + 1}`} value={b} onChange={e => setPlan(i, { bullets: p.bullets.map((x, k) => k === j ? e.target.value : x) })} />)}
        <Input aria-label={`Plan ${i + 1} button`} placeholder="Button text" value={p.button_text} onChange={e => setPlan(i, { button_text: e.target.value })} />
      </div>)}
    </section>}

    {section === "payment-calculator" && <section className="space-y-4">
      <h2 className="font-semibold">Payment calculator</h2>
      <div className="space-y-2"><Label htmlFor="fin-calc-badge">Badge text</Label><Input id="fin-calc-badge" value={data.calc_badge} onChange={e => setData(d => d && ({ ...d, calc_badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-calc-title">Title</Label><Input id="fin-calc-title" value={data.calc_title} onChange={e => setData(d => d && ({ ...d, calc_title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-calc-subtitle">Subtitle</Label><Textarea id="fin-calc-subtitle" rows={2} value={data.calc_subtitle} onChange={e => setData(d => d && ({ ...d, calc_subtitle: e.target.value }))} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2"><Label htmlFor="fin-calc-min">Lowest project cost ($)</Label><Input id="fin-calc-min" inputMode="numeric" value={data.calc_min} onChange={e => setData(d => d && ({ ...d, calc_min: e.target.value }))} /></div>
        <div className="space-y-2"><Label htmlFor="fin-calc-max">Highest project cost ($)</Label><Input id="fin-calc-max" inputMode="numeric" value={data.calc_max} onChange={e => setData(d => d && ({ ...d, calc_max: e.target.value }))} /></div>
        <div className="space-y-2"><Label htmlFor="fin-calc-default">Starting amount ($)</Label><Input id="fin-calc-default" inputMode="numeric" value={data.calc_default} onChange={e => setData(d => d && ({ ...d, calc_default: e.target.value }))} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="fin-calc-rebate">Rebate amount shown</Label><Input id="fin-calc-rebate" value={data.calc_rebate} onChange={e => setData(d => d && ({ ...d, calc_rebate: e.target.value }))} /></div>
    </section>}

    {section === "how-it-works" && <section className="space-y-4">
      <h2 className="font-semibold">Section heading</h2>
      <div className="space-y-2"><Label htmlFor="fin-steps-badge">Badge text</Label><Input id="fin-steps-badge" value={data.steps_badge} onChange={e => setData(d => d && ({ ...d, steps_badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-steps-title">Title</Label><Input id="fin-steps-title" value={data.steps_title} onChange={e => setData(d => d && ({ ...d, steps_title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-steps-subtitle">Subtitle</Label><Input id="fin-steps-subtitle" value={data.steps_subtitle} onChange={e => setData(d => d && ({ ...d, steps_subtitle: e.target.value }))} /></div>
      <h2 className="font-semibold">Steps</h2>
      {data.steps.map((s, i) => <div key={i} className="space-y-3 rounded-md border p-4">
        <p className="text-sm font-medium">Step {i + 1}</p>
        {iconRow(s.icon, "step", i, () => setStep(i, { icon: "" }))}
        <Input aria-label={`Step ${i + 1} title`} placeholder="Title" value={s.title} onChange={e => setStep(i, { title: e.target.value })} />
        <Textarea aria-label={`Step ${i + 1} text`} rows={2} placeholder="Text" value={s.text} onChange={e => setStep(i, { text: e.target.value })} />
      </div>)}
    </section>}

    {section === "pre-qualify-form" && <section className="space-y-4">
      <h2 className="font-semibold">Pre-qualify form</h2>
      <div className="space-y-2"><Label htmlFor="fin-form-badge">Badge text</Label><Input id="fin-form-badge" value={data.form_badge} onChange={e => setData(d => d && ({ ...d, form_badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-form-title">Title</Label><Input id="fin-form-title" value={data.form_title} onChange={e => setData(d => d && ({ ...d, form_title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-form-subtitle">Subtitle</Label><Input id="fin-form-subtitle" value={data.form_subtitle} onChange={e => setData(d => d && ({ ...d, form_subtitle: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-form-button">Submit button text</Label><Input id="fin-form-button" value={data.form_button} onChange={e => setData(d => d && ({ ...d, form_button: e.target.value }))} /></div>
    </section>}

    {section === "financing-faqs" && <section className="space-y-4">
      <h2 className="font-semibold">Section heading</h2>
      <div className="space-y-2"><Label htmlFor="fin-faq-badge">Badge text</Label><Input id="fin-faq-badge" value={data.faq_badge} onChange={e => setData(d => d && ({ ...d, faq_badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="fin-faq-title">Title</Label><Input id="fin-faq-title" value={data.faq_title} onChange={e => setData(d => d && ({ ...d, faq_title: e.target.value }))} /></div>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Questions ({data.faqs.length})</h2>
        <Button type="button" variant="outline" size="sm" onClick={addFaq}><Plus className="mr-2 h-4 w-4" />Add question</Button>
      </div>
      {data.faqs.map((q, i) => <div key={i} className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Question {i + 1}</p>
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => moveFaq(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={i === data.faqs.length - 1} onClick={() => moveFaq(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Remove question" onClick={() => removeFaq(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        {iconRow(q.icon, "faq", i, () => setFaq(i, { icon: "" }))}
        <Input aria-label={`Question ${i + 1}`} placeholder="Question" value={q.question} onChange={e => setFaq(i, { question: e.target.value })} />
        <Textarea aria-label={`Answer ${i + 1}`} rows={3} placeholder="Answer" value={q.answer} onChange={e => setFaq(i, { answer: e.target.value })} />
      </div>)}
      <Button type="button" variant="outline" onClick={addFaq}><Plus className="mr-2 h-4 w-4" />Add another question</Button>
    </section>}

    <FileManagerPicker open={pick !== null} onOpenChange={o => { if (!o) setPick(null); }} accept="image/*" title="Select Icon" onSelect={onPick} />
    <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save {currentSection?.title}</Button></div>
  </div>;
}
