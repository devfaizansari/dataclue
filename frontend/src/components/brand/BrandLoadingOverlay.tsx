"use client";

import { AnimatePresence } from "framer-motion";
import BrandSplash from "./BrandSplash";

type BrandLoadingOverlayProps = {
  show: boolean;
  message?: string;
};

export default function BrandLoadingOverlay({
  show,
  message = "Computing your results",
}: BrandLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <BrandSplash
          key="calc-splash"
          mode="loading"
          message={message}
          size="md"
        />
      )}
    </AnimatePresence>
  );
}
