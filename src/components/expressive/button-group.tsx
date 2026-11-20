"use client";

import * as React from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/expressive/utils";
import type { MotionProp } from "@/lib/expressive/use-motion";
import { useComposedRef, useFluidPress } from "@/lib/expressive/use-fluid";
import { Ripple } from "@/components/expressive/ripple";

/*
 * Button groups, new in M3 Expressive.
 *
 * <ButtonGroup> lays out Buttons and IconButtons with the standard gap, and
 * makes them react to each other: the pressed button widens while its
 * neighbours make room.
 *
 * <ConnectedButtonGroup> lays out ConnectedButtons joined by a 2px gap, with
 * square inner corners and pill ends. The buttons are plain click buttons:
 * there is no selected state and nothing toggles.
 */

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const groupGap: Record<Size, string> = {
  xs: "gap-4.5",
  sm: "gap-3",
  md: "gap-2",
  lg: "gap-2",
  xl: "gap-2",
};

// Each Button's horizontal padding at that size, so a press can scale it.
const groupPad: Record<Size, string> = {
  xs: "[--ex-group-pad:0.75rem]",
  sm: "[--ex-group-pad:1rem]",
  md: "[--ex-group-pad:1.5rem]",
  lg: "[--ex-group-pad:3rem]",
  xl: "[--ex-group-pad:4rem]",
};

export interface ButtonGroupProps extends React.ComponentProps<"div"> {
  /** Match the size of the buttons inside; it sets the gap and the press response. */
  size?: Size;
  /** Accessible name for the group. */
  "aria-label"?: string;
}

export function ButtonGroup({ className, size = "sm", ...props }: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      className={cn(
        "flex items-center",
        groupGap[size],
        groupPad[size],
        "*:transition-[border-radius,background-color,color,box-shadow,padding,width] *:spring-spatial-fast",
        // Buttons: the pressed one gains padding, its neighbours give some up.
        "[&>[data-slot=button]:active]:px-[calc(var(--ex-group-pad)*1.3)]",
        "[&>[data-slot=button]:has(+:active)]:px-[calc(var(--ex-group-pad)*0.75)] [&>:active+[data-slot=button]]:px-[calc(var(--ex-group-pad)*0.75)]",
        // Icon buttons have a fixed width, so scale that instead.
        "[&>[data-slot=icon-button]:active]:w-[calc(var(--ex-control-height)*1.25)]",
        "[&>[data-slot=icon-button]:has(+:active)]:w-[calc(var(--ex-control-height)*0.85)] [&>:active+[data-slot=icon-button]]:w-[calc(var(--ex-control-height)*0.85)]",
        className,
      )}
      {...props}
    />
  );
}

/*
 * Corners are driven by variables so the pill ends never fight the press
 * state: --ex-corner-start / --ex-corner-end pick between the inner radius
 * and a pill, and only --ex-corner-inner changes while a button is pressed.
 */
export const connectedButtonVariants = cva(
  [
    "state-layer focus-ring relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap",
    "h-(--ex-control-height) [--ex-corner-pill:calc(var(--ex-control-height)/2)]",
    "[--ex-corner-start:var(--ex-corner-inner)] [--ex-corner-end:var(--ex-corner-inner)]",
    "first:[--ex-corner-start:var(--ex-corner-pill)] last:[--ex-corner-end:var(--ex-corner-pill)]",
    "[border-start-start-radius:var(--ex-corner-start)] [border-end-start-radius:var(--ex-corner-start)]",
    "[border-start-end-radius:var(--ex-corner-end)] [border-end-end-radius:var(--ex-corner-end)]",
    "active:[--ex-corner-inner:var(--ex-corner-pressed)]",
    "transition-[border-radius,background-color,color] spring-spatial-fast",
    "data-disabled:cursor-default data-disabled:bg-on-surface/(--ex-disabled-container) data-disabled:text-on-surface/(--ex-disabled-content)",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        filled: "bg-surface-container text-on-surface-variant",
        tonal: "bg-secondary-container text-on-secondary-container",
        outlined: "border border-outline-variant text-on-surface-variant",
      },
      size: {
        xs: "gap-1 px-3 text-label-large [--ex-control-height:2rem] [--ex-corner-inner:var(--ex-shape-corner-extra-small)] [--ex-corner-pressed:var(--ex-shape-corner-extra-small)] [&_svg]:size-5",
        sm: "gap-2 px-4 text-label-large [--ex-control-height:2.5rem] [--ex-corner-inner:var(--ex-shape-corner-small)] [--ex-corner-pressed:var(--ex-shape-corner-extra-small)] [&_svg]:size-5",
        md: "gap-2 px-6 text-title-medium [--ex-control-height:3.5rem] [--ex-corner-inner:var(--ex-shape-corner-small)] [--ex-corner-pressed:var(--ex-shape-corner-extra-small)] [&_svg]:size-6",
        lg: "gap-3 px-12 text-headline-small [--ex-control-height:6rem] [--ex-corner-inner:var(--ex-shape-corner-large)] [--ex-corner-pressed:var(--ex-shape-corner-medium)] [&_svg]:size-8",
        xl: "gap-4 px-16 text-headline-large [--ex-control-height:8.5rem] [--ex-corner-inner:var(--ex-shape-corner-large-increased)] [--ex-corner-pressed:var(--ex-shape-corner-large)] [&_svg]:size-10",
      },
    },
    defaultVariants: { variant: "filled", size: "sm" },
  },
);

type ConnectedVariants = VariantProps<typeof connectedButtonVariants>;
const ConnectedContext = React.createContext<ConnectedVariants & { motion?: MotionProp }>({});

export interface ConnectedButtonGroupProps extends Omit<React.ComponentProps<"div">, "className">, ConnectedVariants {
  /** Stretch to the container's width, sharing it equally. */
  fill?: boolean;
  motion?: MotionProp;
  className?: string;
}

export function ConnectedButtonGroup({
  className,
  variant,
  size,
  fill = false,
  motion,
  ...props
}: ConnectedButtonGroupProps) {
  return (
    <ConnectedContext value={{ variant, size, motion }}>
      <div
        role="group"
        data-slot="connected-button-group"
        data-fill={fill ? "" : undefined}
        className={cn(
          "inline-flex items-center gap-0.5",
          "data-fill:flex data-fill:w-full data-fill:*:min-w-0 data-fill:*:flex-1 data-fill:*:basis-0",
          className,
        )}
        {...props}
      />
    </ConnectedContext>
  );
}

/**
 * A vertically stacked version of <ConnectedButtonGroup>.
 * Use the same <ConnectedButton> children.
 */
export interface VerticalConnectedButtonGroupProps extends ConnectedButtonGroupProps { }

export function VerticalConnectedButtonGroup({
  className,
  variant,
  size,
  fill = false,
  motion,
  ...props
}: VerticalConnectedButtonGroupProps) {
  return (
    <ConnectedContext value={{ variant, size, motion }}>
      <div
        role="group"
        aria-orientation="vertical"
        data-slot="vertical-connected-button-group"
        data-fill={fill ? "" : undefined}
        className={cn(
          "inline-flex flex-col items-stretch gap-0.5",
          "data-fill:flex data-fill:w-full data-fill:*:w-full",
          // Round the two outer corners at the top and bottom of the stack.
          "*:data-[slot=connected-button]:[--ex-corner-start:var(--ex-corner-inner)]",
          "*:data-[slot=connected-button]:[--ex-corner-end:var(--ex-corner-inner)]",

          "[&>[data-slot=connected-button]:first-child]:rounded-ss-(--ex-corner-pill)",
          "[&>[data-slot=connected-button]:first-child]:rounded-se-(--ex-corner-pill)",

          "[&>[data-slot=connected-button]:last-child]:rounded-es-(--ex-corner-pill)",
          "[&>[data-slot=connected-button]:last-child]:rounded-ee-(--ex-corner-pill)",
          className,
        )}
        {...props}
      />
    </ConnectedContext>
  );
}

export interface ConnectedButtonProps extends Omit<BaseButton.Props, "className"> {
  /** Leading icon. Icon-only buttons need an `aria-label`. */
  icon?: React.ReactNode;
  className?: string;
}

export function ConnectedButton({ className, icon, children, disabled, render, ref, ...props }: ConnectedButtonProps) {
  const { variant, size, motion } = React.useContext(ConnectedContext);
  const local = React.useRef<HTMLElement>(null);
  useFluidPress(local, motion, !disabled);

  // Automatically determine if we are rendering an anchor link instead of a native button
  const isLink = React.isValidElement(render) && render.type === "a";

  return (
    <BaseButton
      ref={useComposedRef(local, ref)}
      data-slot="connected-button"
      data-motion={motion}
      disabled={disabled}
      nativeButton={!isLink}
      render={render ?? <button type="button" />}
      className={cn(connectedButtonVariants({ variant, size }), !children && "px-0 aspect-square", className)}
      {...props}
    >
      {icon}
      {children}
      <Ripple motion={motion} disabled={disabled} />
    </BaseButton>
  );
}