import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Loader2, Plus, RefreshCw, Star, X } from "lucide-react";

import { adminListGoogleReviews, adminSaveGoogleReviews, adminSearchGooglePlaces } from "@/lib/google-reviews.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GoogleReviewsManager() {
  const { i18n } = useTranslation();
  const ar = (i18n.resolvedLanguage ?? i18n.language).startsWith("ar");
  const lang = ar ? "ar" : "en";
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "google-reviews", lang],
    queryFn: () => adminListGoogleReviews({ data: { lang } }),
  });
  const [places, setPlaces] = useState<string[]>([]);
  const [shown, setShown] = useState<string[]>([]);
  const [newPlace, setNewPlace] = useState("");

  useEffect(() => {
    if (q.data) {
      setPlaces(q.data.config.places);
      setShown(q.data.config.shown);
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: (v: { places: string[]; shown: string[] }) => adminSaveGoogleReviews({ data: v }),
    onSuccess: () => {
      toast.success(ar ? "تم الحفظ" : "Saved");
      void qc.invalidateQueries({ queryKey: ["admin", "google-reviews"] });
      void qc.invalidateQueries({ queryKey: ["public", "google-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (id: string, on: boolean) => {
    const next = on ? [...shown, id] : shown.filter((s) => s !== id);
    setShown(next);
    save.mutate({ places, shown: next });
  };
  const [results, setResults] = useState<{ id: string; name: string; address: string; reviews: number }[]>([]);
  const search = useMutation({
    mutationFn: (query: string) => adminSearchGooglePlaces({ data: { query, lang } }),
    onSuccess: (r) => {
      setResults(r);
      if (!r.length) toast.error(ar ? "لم يتم العثور على نتائج" : "No listings found");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const addId = (id: string) => {
    if (places.includes(id)) {
      toast.info(ar ? "هذا الموقع مضاف مسبقاً" : "Already added");
      return;
    }
    if (places.length >= 10) {
      toast.error(ar ? "الحد الأقصى 10 مواقع" : "Maximum 10 listings");
      return;
    }
    const next = [...places, id];
    setPlaces(next);
    setNewPlace("");
    setResults([]);
    save.mutate({ places: next, shown });
  };
  const addPlace = () => {
    const raw = newPlace.trim();
    if (!raw) return;
    const fromUrl = raw.match(/(?:place_id[:=]|!1s|^)(ChIJ[A-Za-z0-9_-]{10,200})/)?.[1];
    if (fromUrl) return addId(fromUrl);
    if (/^[A-Za-z0-9_-]{20,200}$/.test(raw) && !raw.includes(" ")) return addId(raw);
    search.mutate(raw);
  };
  const removePlace = (id: string) => {
    const next = places.filter((p) => p !== id);
    if (!next.length) return;
    const nextShown = shown.filter((s) => !s.startsWith(`places/${id}/`));
    setPlaces(next);
    setShown(nextShown);
    save.mutate({ places: next, shown: nextShown });
  };

  const reviews = q.data?.reviews ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">{ar ? "تقييمات Google Maps" : "Google Maps reviews"}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {ar
              ? "فعّل التقييمات التي تريد عرضها في الموقع. يعرض Google حتى 5 تقييمات لكل موقع، ويمكنك إضافة أكثر من محطة."
              : "Turn on the reviews to show on the website. Google provides up to 5 reviews per listing; add more stations for more reviews."}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => q.refetch()} disabled={q.isFetching}>
          <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="text-xs font-medium">{ar ? "مواقع Google (Place ID)" : "Google listings (Place ID)"}</div>
          <div className="flex flex-wrap gap-2">
            {places.map((p) => {
              const name = reviews.find((r) => r.placeId === p)?.placeName;
              return (
                <span key={p} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs">
                  {name ? `${name} · ` : ""}
                  <span className="font-mono text-muted-foreground">{p.slice(0, 12)}…</span>
                  {places.length > 1 ? (
                    <button onClick={() => removePlace(p)} aria-label="Remove">
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                </span>
              );
            })}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addPlace();
            }}
          >
            <Input
              value={newPlace}
              onChange={(e) => setNewPlace(e.target.value)}
              placeholder={ar ? "ابحث باسم المحطة أو الصق Place ID" : "Search station name or paste Place ID"}
              className="max-w-sm"
            />
            <Button type="submit" size="sm" variant="outline" disabled={search.isPending || save.isPending}>
              {search.isPending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Plus className="me-1 h-4 w-4" />}
              {ar ? "بحث / إضافة" : "Search / Add"}
            </Button>
          </form>
          {results.length ? (
            <div className="max-w-xl space-y-1 rounded-lg border border-border p-2">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => addId(r.id)}
                  className="flex w-full items-start justify-between gap-3 rounded-md px-2 py-1.5 text-start text-xs hover:bg-muted"
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{r.name}</span>
                    <span className="block truncate text-muted-foreground">{r.address}</span>
                  </span>
                  <span className="shrink-0 text-muted-foreground">{r.reviews} ★</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {q.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {ar ? "جارٍ التحميل…" : "Loading…"}
          </div>
        ) : null}
        {q.error ? <p className="text-sm text-destructive">{(q.error as Error).message}</p> : null}
        {q.data?.errors.length ? (
          <p className="text-xs text-destructive">{q.data.errors.join(" · ")}</p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {r.authorPhoto ? (
                    <img src={r.authorPhoto} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full" />
                  ) : null}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{r.author}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {Array.from({ length: Math.round(r.rating) }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-accent text-accent" />
                      ))}
                      <span className="ms-1">{r.relativeTime}</span>
                    </div>
                  </div>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {ar ? "ظاهر" : "Show"}
                  <Switch checked={shown.includes(r.id)} onCheckedChange={(v) => toggle(r.id, v)} />
                </label>
              </div>
              <p className="mt-3 line-clamp-5 text-sm text-muted-foreground">{r.text || "—"}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate">{r.placeName}</span>
                {r.googleMapsUri ? (
                  <a href={r.googleMapsUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                    Google <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
