import { Quote, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";

type Leader = Database["public"]["Tables"]["leaders"]["Row"];

export function ManagementProfile({ leader, language, statement, photo }: {
  leader: Leader;
  language: "ar" | "en";
  statement?: string;
  photo?: string;
}) {
  const name = language === "ar" ? leader.name_ar : leader.name_en;
  const title = language === "ar" ? leader.title_ar : leader.title_en;
  const description = language === "ar" ? leader.bio_ar : leader.bio_en;
  const portrait = photo || leader.photo_url;
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-lg border-border shadow-none">
      <div className={`flex shrink-0 items-end justify-center overflow-hidden bg-muted/40 ${statement ? "h-72 sm:h-80" : "h-72"}`}>
        {portrait ? (
          <img src={portrait} alt={name} className="h-full w-full object-contain object-bottom" loading="lazy" />
        ) : (
          <Users aria-hidden="true" className="m-auto h-16 w-16 text-muted-foreground/40" />
        )}
      </div>
      <CardContent className="flex flex-1 flex-col border-t border-border p-6 sm:p-7">
        <h3 className="font-display text-xl font-bold leading-relaxed text-foreground">{name}</h3>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-accent">{title}</p>
        {statement ? (
          <blockquote className="mt-6 border-s-2 border-accent ps-5">
            <Quote aria-hidden="true" className="mb-3 h-5 w-5 text-accent" />
            <p className="whitespace-pre-line text-base leading-8 text-muted-foreground">{statement}</p>
          </blockquote>
        ) : (
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}