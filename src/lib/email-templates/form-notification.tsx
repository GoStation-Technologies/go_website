import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

type Props = { title?: string; reference?: string; timestamp?: string; fields?: Record<string, unknown>; links?: { label: string; url: string }[]; subject?: string };
function FormNotification({ title = "GoStation notification", reference = "", timestamp = "", fields = {}, links = [] }: Props) {
  return <Html><Head /><Preview>{title} — {reference}</Preview>
    <Body style={{ backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif", color: "#1a1554" }}>
      <Container style={{ maxWidth: "640px", padding: "24px" }}>
        <Text style={{ color: "#ee743b", fontWeight: 700 }}>GOStation</Text>
        <Heading as="h1" style={{ fontSize: "22px" }}>{title}</Heading>
        <Text>Reference: {reference}</Text><Text>Submitted: {timestamp}</Text>
        {Object.entries(fields).filter(([, value]) => value !== null && value !== undefined && String(value).trim()).map(([label, value]) =>
          <Section key={label} style={{ borderBottom: "1px solid #e8e8ee", padding: "8px 0" }}>
            <Text style={{ margin: "0", fontWeight: 700 }}>{label.replace(/_/g, " ")}</Text>
            <Text dir="auto" style={{ margin: "4px 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{typeof value === "object" ? JSON.stringify(value) : String(value)}</Text>
          </Section>)}
        {links.map(link => <Text key={link.url}><Link href={link.url}>{link.label}</Link></Text>)}
      </Container>
    </Body></Html>;
}
export const template = {
  component: FormNotification,
  subject: (data) => data.subject || "GoStation form notification",
  displayName: "GoStation — Form notification",
  previewData: { title: "New contact message", reference: "PREVIEW", timestamp: "2026-11-05", fields: { full_name: "Preview visitor", message: "Contact request preview" } },
} satisfies TemplateEntry;