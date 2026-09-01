import fs from 'fs';
let content = fs.readFileSync('src/pages/Accounting.tsx', 'utf-8');

// The block for "إضافة دين"
const oldDebtBlock = `            <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
              <DialogTrigger render={<Button variant="outline" className="gap-2" />} />}>
                
                  <Plus className="h-4 w-4" />
                إضافة دين
              
            />
            <DialogContent`;

const newDebtBlock = `            <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة دين
                </Button>
              </DialogTrigger>
            <DialogContent`;
            
content = content.replace(oldDebtBlock, newDebtBlock);

// The block for "تسجيل دفعة"
const oldPaymentBlock = `              <DialogTrigger render={<Button className="gap-2" />} />}>
                
                  <Plus className="h-4 w-4" />
                  تسجيل دفعة
                
              />
              <DialogContent`;
              
const newPaymentBlock = `              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  تسجيل دفعة
                </Button>
              </DialogTrigger>
              <DialogContent`;

content = content.replace(oldPaymentBlock, newPaymentBlock);

fs.writeFileSync('src/pages/Accounting.tsx', content);
