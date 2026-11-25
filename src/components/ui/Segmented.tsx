import * as RadioGroup from '@radix-ui/react-radio-group'

interface SegmentedProps {
  items: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  label: string
}

export default function Segmented({ items, value, onChange, label }: SegmentedProps) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={onChange}
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-[12px] border border-border bg-surface p-0.5"
    >
      {items.map((item) => (
        <RadioGroup.Item
          key={item.value}
          value={item.value}
          className="flex min-h-8 items-center justify-center rounded-[10px] px-2 text-[12px] text-text-secondary transition-colors duration-150 active:bg-surface-hover data-[state=checked]:bg-accent data-[state=checked]:text-bg-deep"
        >
          {item.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  )
}
