"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils"; // shadcn util

const ModalContext = createContext(undefined);

export const ModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  return <ModalContext.Provider value={{ open, setOpen }}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within a ModalProvider");
  return ctx;
};

export function Modal({ children }) {
  return <ModalProvider>{children}</ModalProvider>;
}

export const ModalTrigger = ({ children, className }) => {
  const { setOpen } = useModal();
  return (
    <button
      onClick={() => setOpen(true)}
      className={cn(
        "relative overflow-hidden rounded-md px-4 py-2 text-center text-black dark:text-white",
        className
      )}
    >
      {children}
    </button>
  );
};

export const ModalBody = ({ children, className }) => {
  const { open, setOpen } = useModal();
  const modalRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  useOutsideClick(modalRef, () => setOpen(false));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex h-full w-full items-center justify-center [perspective:800px] [transform-style:preserve-3d]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        >
          <Overlay />

          <motion.div
            ref={modalRef}
            className={cn(
              "relative z-50 flex max-h-[90%] min-h-[50%] flex-1 flex-col overflow-hidden border border-transparent bg-white dark:border-neutral-800 dark:bg-neutral-950 md:max-w-[40%] md:rounded-2xl",
              className
            )}
            initial={{ opacity: 0, scale: 0.5, rotateX: 40, y: 40 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, rotateX: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
          >
            <CloseIcon />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ModalContent = ({ children, className }) => {
  return <div className={cn("flex flex-1 flex-col p-8 md:p-10", className)}>{children}</div>;
};

export const ModalFooter = ({ children, className }) => {
  return (
    <div className={cn("bg-gray-100 p-4 dark:bg-neutral-900 flex justify-end gap-3", className)}>
      {children}
    </div>
  );
};

const Overlay = ({ className }) => (
  <motion.div
    className={cn("fixed inset-0 z-40 h-full w-full bg-black/50", className)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
  />
);

const CloseIcon = () => {
  const { setOpen } = useModal();
  return (
    <button onClick={() => setOpen(false)} className="group absolute right-4 top-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-black transition duration-200 group-hover:rotate-3 group-hover:scale-125 dark:text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
      </svg>
    </button>
  );
};

// click-outside helper
export const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      callback(e);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};
