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

    const scrollContainer = sections[0]?.closest<HTMLElement>("main, [data-slot=app-content]");
    const scrollTarget = scrollContainer ?? window;

    function updateActiveSection() {
      const top = scrollContainer?.getBoundingClientRect().top ?? 0;
      let activeSection = sections[0];
      for (const section of sections) {
        const margin = Number.parseFloat(getComputedStyle(section).scrollMarginTop) || 32;
        if (section.getBoundingClientRect().top <= top + margin + 1) {
          activeSection = section;
        }
      }
      if (activeSection) setActiveHref(`#${activeSection.id}`);
    }

    scrollTarget.addEventListener("scroll", updateActiveSection, { passive: true });

    function handleHashChange() {
      const hash = window.location.hash;
      if (items.some((item) => item.href === hash)) {
        setActiveHref(hash);
      }
    }

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => {
      scrollTarget.removeEventListener("scroll", updateActiveSection);
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
    const scrollContainer = section.closest<HTMLElement>("main, [data-slot=app-content]");
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth";

    if (scrollContainer) {
      const offset = Number.parseFloat(getComputedStyle(section).scrollMarginTop) || 32;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollTop + section.getBoundingClientRect().top
          - scrollContainer.getBoundingClientRect().top - offset,
        behavior,
      });
    } else {
      section.scrollIntoView({ behavior, block: "start" });
    }
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
                ? "font-medium text-foreground"
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
