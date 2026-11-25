import * as SwitchPrimitive from '@radix-ui/react-switch'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export default function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
      className="relative h-[26px] w-[46px] shrink-0 rounded-full border border-border bg-surface transition-colors duration-200 data-[state=checked]:border-accent data-[state=checked]:bg-accent"
    >
      <SwitchPrimitive.Thumb className="block h-[20px] w-[20px] translate-x-[3px] rounded-full bg-text-dim transition-transform duration-200 data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-bg-deep" />
    </SwitchPrimitive.Root>
  )
}
