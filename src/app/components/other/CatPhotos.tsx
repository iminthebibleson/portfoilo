"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/expressive/button";
import { Carousel, CarouselItem } from "@/components/expressive/carousel";
import { Loading } from "@/components/expressive/loading";

type CatImage = {
    id: string;
    url: string;
    width: number;
    height: number;
};

const CAT_API = "https://api.thecatapi.com/v1/images/search";

// How many photos to load up front, and how many to add each time you near the end.
const BATCH_SIZE = 4;

// Downloads the image into the browser cache so it shows instantly later.
function preloadImage(url: string) {
    return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // a broken image shouldn't block the batch
        img.src = url;
    });
}

async function fetchJson(url: string): Promise<CatImage[]> {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch cat image");
    return response.json();
}

// Gets `count` new cats that aren't in `seen`. Asks for them all in one request,
// then tops up with single requests if the API returned fewer (or repeats).
async function fetchCats(count: number, seen: Set<string>): Promise<CatImage[]> {
    const batch: CatImage[] = [];
    const take = (list: CatImage[]) => {
        for (const cat of list) {
            if (cat?.url && !seen.has(cat.id)) {
                seen.add(cat.id);
                batch.push(cat);
            }
        }
    };

    take(await fetchJson(`${CAT_API}?limit=${count}`));

    if (batch.length < count) {
        const missing = count - batch.length;
        const extra = await Promise.all(
            Array.from({ length: missing }, () => fetchJson(`${CAT_API}?limit=1`))
        );
        extra.forEach(take);
    }

    if (!batch.length) throw new Error("No cat images returned");
    return batch;
}

export default function CatPhotos() {
    const [cats, setCats] = useState<CatImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const seenRef = useRef<Set<string>>(new Set());
    const loadingMoreRef = useRef(false);

    const loadInitial = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            setCats([]);
            seenRef.current = new Set();

            const batch = await fetchCats(BATCH_SIZE, seenRef.current);
            await Promise.all(batch.map((cat) => preloadImage(cat.url)));

            setCats(batch);
        } catch (err) {
            console.error("Cat API error:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    // Called as you move through the carousel: quietly preload 4 more and append them.
    const loadMore = useCallback(async () => {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;

        try {
            const batch = await fetchCats(BATCH_SIZE, seenRef.current);
            await Promise.all(batch.map((cat) => preloadImage(cat.url)));
            setCats((prev) => [...prev, ...batch]);
        } catch (err) {
            console.error("Cat API error (load more):", err);
        } finally {
            loadingMoreRef.current = false;
        }
    }, []);

    useEffect(() => {
        loadInitial();
    }, [loadInitial]);

    const handleScrollCapture = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.target;
        if (!(el instanceof HTMLElement)) return;
        if (el.scrollWidth <= el.clientWidth) return;

        const remaining = el.scrollWidth - el.scrollLeft - el.clientWidth;
        if (remaining < el.clientWidth * 1.5) loadMore();
    };

    return (
        <div className="w-full rounded-field bg-base-300 p-6 row-span-1">
            <div className="relative w-full" onScrollCapture={handleScrollCapture}>
                {loading && (
                    <div className="flex aspect-3/2 w-full items-center justify-center">
                        <Loading variant="morph" contained />
                    </div>
                )}

                {error && !loading && (
                    <div className="flex aspect-3/2 w-full flex-col items-center justify-center">
                        <p className="text-on-surface-variant text-sm">
                            Failed to load cat images
                        </p>

                        <Button onClick={loadInitial}>
                            <svg className="fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px"><path d="M12,20q-3.35,0-5.68-2.32T4,12T6.33,6.32T12,4q1.73,0 3.3,0.71Q16.88,5.43 18,6.75V4h2v7H13V9h4.2q-0.8-1.4-2.19-2.2T12,6Q9.5,6 7.75,7.75T6,12t1.75,4.25T12,18q1.93,0 3.48-1.1T17.65,14h2.1q-0.7,2.65-2.85,4.32T12,20Z"/></svg>
                            Try again
                        </Button>
                    </div>
                )}

                {!loading && !error && cats.length > 0 && (
                    <Carousel aria-label="Random cat photos">
                        {cats.map((cat, i) => (
                            <CarouselItem key={cat.id} >
                                <img
                                    src={cat.url}
                                    alt="A random cat"
                                    loading="eager"
                                    decoding="async"
                                    className="h-full w-full object-cover"
                                />
                            </CarouselItem>
                        ))}
                    </Carousel>
                )}
            </div>
        </div>
    );
}