import { createElement, forwardRef, type CSSProperties, type ReactNode } from 'react';

type MotionElementProps = {
  children?: ReactNode;
  className?: string;
  style?: (CSSProperties & Record<string, unknown>) | undefined;
  [key: string]: unknown;
};

const motionOnlyProps = new Set([
  'animate',
  'exit',
  'initial',
  'layout',
  'transition',
  'variants',
  'viewport',
  'whileHover',
  'whileInView',
  'whileTap',
]);

const transformStyleProps = new Set([
  'rotate',
  'rotateX',
  'rotateY',
  'scale',
  'scaleX',
  'scaleY',
  'x',
  'y',
  'z',
]);

function cleanStyle(style: MotionElementProps['style']) {
  if (!style) return undefined;

  const nextStyle: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(style)) {
    if (!transformStyleProps.has(key) && value !== undefined) {
      nextStyle[key] = value;
    }
  }

  return nextStyle;
}

function cleanProps(props: MotionElementProps) {
  const nextProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (motionOnlyProps.has(key)) continue;
    if (key === 'style') {
      const style = cleanStyle(value as MotionElementProps['style']);
      if (style) nextProps.style = style;
      continue;
    }
    nextProps[key] = value;
  }

  return nextProps;
}

function createMotionElement(tagName: string) {
  return forwardRef<HTMLElement, MotionElementProps>(function MotionElement(props, ref) {
    return createElement(tagName, { ...cleanProps(props), ref });
  });
}

export const motion = {
  a: createMotionElement('a'),
  div: createMotionElement('div'),
  nav: createMotionElement('nav'),
  p: createMotionElement('p'),
};
