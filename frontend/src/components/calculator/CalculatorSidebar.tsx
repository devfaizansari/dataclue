"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  standaloneTests,
  testCategories,
  defaultActiveTestId,
  type TestCategory,
} from "@/data/statisticalTests";

type CalculatorSidebarProps = {
  activeTestId?: string;
  onTestSelect?: (testId: string) => void;
};

export default function CalculatorSidebar({
  activeTestId = defaultActiveTestId,
  onTestSelect,
}: CalculatorSidebarProps) {
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => {
    const activeCategory = testCategories.find((category) =>
      category.tests.some((test) => test.id === defaultActiveTestId),
    );
    return activeCategory ? [activeCategory.id] : [];
  });

  useEffect(() => {
    const activeCategory = testCategories.find((category) =>
      category.tests.some((test) => test.id === activeTestId),
    );
    if (activeCategory) {
      setExpandedCategories((prev) =>
        prev.includes(activeCategory.id) ? prev : [...prev, activeCategory.id],
      );
    }
  }, [activeTestId]);

  const filteredStandaloneTests = standaloneTests.filter((test) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return test.label.toLowerCase().includes(query);
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const filterCategories = (categories: TestCategory[]) => {
    if (!search.trim()) return categories;

    const query = search.toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        tests: category.tests.filter(
          (test) =>
            test.label.toLowerCase().includes(query) ||
            category.label.toLowerCase().includes(query),
        ),
      }))
      .filter((category) => category.tests.length > 0);
  };

  const filteredCategories = filterCategories(testCategories);
  const isSearching = search.trim().length > 0;

  return (
    <aside className="flex h-full flex-col rounded-xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border p-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search tests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <nav className="max-h-[calc(100vh-220px)] overflow-y-auto p-2">
        {filteredStandaloneTests.length > 0 && (
          <div className="mb-3 border-b border-border pb-3">
            <p className="px-3 pb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">
              Machine Learning
            </p>
            <ul className="space-y-0.5">
              {filteredStandaloneTests.map((test) => {
                const isActive = test.id === activeTestId;
                return (
                  <li key={test.id}>
                    <button
                      type="button"
                      onClick={() => onTestSelect?.(test.id)}
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-primary-light font-medium text-primary"
                          : "text-foreground hover:bg-surface-muted"
                      }`}
                    >
                      {test.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {filteredCategories.map((category) => {
          const isExpanded =
            isSearching || expandedCategories.includes(category.id);

          return (
            <div key={category.id} className="mb-0.5">
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-xs font-bold tracking-wide text-slate-500 uppercase transition-colors hover:bg-surface-muted"
              >
                {category.label}
                <svg
                  className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {isExpanded && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-0.5 overflow-hidden pb-2"
                >
                  {category.tests.map((test) => {
                    const isActive = test.id === activeTestId;

                    return (
                      <li key={test.id}>
                        <button
                          type="button"
                          onClick={() => onTestSelect?.(test.id)}
                          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-primary-light font-medium text-primary"
                              : "text-foreground hover:bg-surface-muted"
                          }`}
                        >
                          {test.label}
                        </button>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
