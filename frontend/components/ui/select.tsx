'use client';

import * as React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { inputVariants } from './input';

/**
 * Select — the one dropdown for the signed-in app, on @radix-ui/react-select
 * (keyboard nav, type-ahead, aria-activedescendant, outside-click and Esc to
 * close, portalled to <body>).
 *
 * Drop-in for the old native <select> wrapper: it still takes <option>
 * children and calls `onChange(e)` with `e.target.value`, so every caller kept
 * its exact values and handlers. New callers can pass `options` instead, which
 * adds per-option icons and descriptions.
 */
export interface SelectOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

type ChangeLike = React.ChangeEvent<HTMLSelectElement>;

export interface SelectProps {
  id?: string;
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  /** Native-compatible: `e.target.value` is the chosen value. */
  onChange?: (e: ChangeLike) => void;
  onValueChange?: (value: string) => void;
  options?: SelectOption[];
  /** <option> elements, as with a native select. */
  children?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  inputSize?: 'sm' | 'md' | 'lg' | null;
  state?: 'default' | 'invalid' | 'valid' | null;
  className?: string;
  title?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/** Radix reserves '' for "no value", but '' is a real option here ("All …"). */
const EMPTY = '__kyriq_empty__';
const toRadix = (v: string) => (v === '' ? EMPTY : v);
const fromRadix = (v: string) => (v === EMPTY ? '' : v);

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

/** <option> children -> SelectOption[]; fragments and arrays are flattened. */
function optionsFromChildren(children: React.ReactNode): SelectOption[] {
  const out: SelectOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<any>(child)) return;
    if (child.type === React.Fragment) {
      out.push(...optionsFromChildren(child.props.children));
      return;
    }
    if (child.type === 'option') {
      const label = child.props.children;
      out.push({
        // A native <option> without `value` submits its text.
        value: child.props.value != null ? String(child.props.value) : textOf(label),
        label,
        disabled: child.props.disabled,
      });
    }
  });
  return out;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      id,
      name,
      value,
      defaultValue,
      onChange,
      onValueChange,
      options,
      children,
      placeholder,
      disabled,
      required,
      inputSize,
      state,
      className,
      title,
      ...aria
    },
    ref
  ) => {
    const items = React.useMemo(() => options ?? optionsFromChildren(children), [options, children]);
    // Uncontrolled native selects default to their first option.
    const initial = defaultValue != null ? String(defaultValue) : placeholder ? undefined : items[0]?.value;

    const handleChange = (raw: string) => {
      const v = fromRadix(raw);
      onValueChange?.(v);
      if (onChange) {
        const target = { value: v, name } as HTMLSelectElement;
        onChange({ target, currentTarget: target } as ChangeLike);
      }
    };

    return (
      <RadixSelect.Root
        value={value != null ? toRadix(String(value)) : undefined}
        defaultValue={value == null && initial != null ? toRadix(initial) : undefined}
        onValueChange={handleChange}
        disabled={disabled}
        required={required}
        name={name}
      >
        <RadixSelect.Trigger
          ref={ref}
          id={id}
          title={title}
          aria-invalid={state === 'invalid' || undefined}
          {...aria}
          className={cn(
            inputVariants({ state, inputSize }),
            'group inline-flex items-center justify-between gap-2 text-left',
            'data-[placeholder]:text-ink-faint data-[state=open]:border-brand data-[state=open]:ring-[3px] data-[state=open]:ring-ring/50',
            inputSize === 'sm' ? 'pl-3 pr-2.5' : 'pr-3',
            className
          )}
        >
          <span className="min-w-0 flex-1 truncate">
            <RadixSelect.Value placeholder={placeholder} />
          </span>
          <RadixSelect.Icon asChild>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-ink-faint transition-transform duration-quick ease-settle group-data-[state=open]:rotate-180"
              aria-hidden
            />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            // data-skin: the portal lands on <body>, outside the layout that
            // sets the glass tokens (same reason as Dialog).
            data-skin="glass"
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              'glass-modal z-[1000] overflow-hidden rounded-input border border-glass-hairline text-ink-strong',
              'min-w-[var(--radix-select-trigger-width)] max-h-[min(22rem,var(--radix-select-content-available-height))]',
              'animate-dialog-pop'
            )}
          >
            <RadixSelect.ScrollUpButton className="flex h-6 items-center justify-center text-ink-faint">
              <ChevronUp className="h-4 w-4" aria-hidden />
            </RadixSelect.ScrollUpButton>
            <RadixSelect.Viewport className="p-1">
              {items.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={toRadix(opt.value)}
                  disabled={opt.disabled}
                  textValue={textOf(opt.label) || opt.value}
                  className={cn(
                    'relative flex cursor-pointer select-none items-start gap-2.5 rounded-[10px] py-2 pl-2.5 pr-8 text-sm text-ink-body outline-none',
                    'transition-colors duration-quick ease-settle',
                    'data-[highlighted]:bg-brand/[0.08] data-[highlighted]:text-ink-strong',
                    'data-[state=checked]:font-medium data-[state=checked]:text-ink-strong',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-disabled'
                  )}
                >
                  {opt.icon ? <span className="mt-0.5 shrink-0 text-ink-faint" aria-hidden>{opt.icon}</span> : null}
                  <span className="min-w-0 flex-1">
                    <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                    {opt.description ? (
                      <span className="mt-0.5 block text-xs font-normal text-ink-faint">{opt.description}</span>
                    ) : null}
                  </span>
                  <RadixSelect.ItemIndicator className="absolute right-2.5 top-2.5 text-brand">
                    <Check className="h-4 w-4" aria-hidden />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
            <RadixSelect.ScrollDownButton className="flex h-6 items-center justify-center text-ink-faint">
              <ChevronDown className="h-4 w-4" aria-hidden />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    );
  }
);
Select.displayName = 'Select';
