import fs from 'fs';
let content = fs.readFileSync('src/components/ui/dialog.tsx', 'utf-8');

const oldTrigger = `function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}`;

const newTrigger = `function DialogTrigger({ asChild, children, ...props }: DialogPrimitive.Trigger.Props & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" render={children} {...props} />
  }
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props}>{children}</DialogPrimitive.Trigger>
}`;

content = content.replace(oldTrigger, newTrigger);

fs.writeFileSync('src/components/ui/dialog.tsx', content);
