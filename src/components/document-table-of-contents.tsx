"use client";

import { type MouseEvent, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type TableOfContentsItem = {
  href: string;
  label: string;
};

type DocumentTableOfContentsProps = {
  ariaLabel: string;
  items: TableOfContentsItem[];
};

export function DocumentTableOfContents({
  ariaLabel,
  items,
}: DocumentTableOfContentsProps) {
  const [activeHref, setActiveHref] = useState(items[0]?.href ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              first.boundingClientRect.top - second.boundingClientRect.top,
          )[0];

        if (activeEntry?.target.id) {
          setActiveHref(`#${activeEntry.target.id}`);
        }
      },
      {
        rootMargin: "-96px 0px -70% 0px",
        threshold: 0.01,
      },
    );

    sections.forEach((section) => observer.observe(section));

    function handleHashChange() {
      const hash = window.location.hash;
      if (items.some((item) => item.href === hash)) {
        setActiveHref(hash);
      }
    }

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [items]);

  function handleAnchorClick(
    event: MouseEvent<HTMLAnchorElement>,
    item: TableOfContentsItem,
  ) {
    const section = document.getElementById(item.href.slice(1));

    if (!section) return;

    event.preventDefault();
    setActiveHref(item.href);
    window.history.pushState(null, "", item.href);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav aria-label={ariaLabel} className="grid gap-2">
      {items.map((item) => {
        const isActive = item.href === activeHref;

        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={isActive ? "location" : undefined}
            className={cn(
              "text-sm transition-colors",
              isActive
                ? "font-medium text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={(event) => handleAnchorClick(event, item)}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
