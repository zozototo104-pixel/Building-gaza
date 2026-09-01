import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

const newTabsList = `        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="gap-2"><SettingsIcon className="w-4 h-4" /> إعدادات عامة</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> المستخدمين والصلاحيات</TabsTrigger>
          <TabsTrigger value="backup" className="gap-2"><HardDrive className="w-4 h-4" /> النسخ الاحتياطي</TabsTrigger>
          <TabsTrigger value="closing" className="gap-2"><Lock className="w-4 h-4" /> الإقفال الشهري</TabsTrigger>
          <TabsTrigger value="about" className="gap-2"><Info className="w-4 h-4" /> حول النظام</TabsTrigger>
        </TabsList>`;

content = content.replace(/<TabsList className="grid w-full grid-cols-4">[\s\S]*?<\/TabsList>/, newTabsList);

const aboutTab = `
        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>حول النظام</CardTitle>
              <CardDescription>معلومات مطور نظام إدارة العمارة السكنية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-lg">
              <div className="p-6 bg-muted/20 rounded-xl border">
                <h3 className="font-bold text-2xl text-primary mb-4">المهندس محمد محمود الهندي «أبو مصعب»</h3>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-semibold text-foreground">الجوال:</span> <span dir="ltr">+972594403737</span>
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-semibold text-foreground">البريد الإلكتروني:</span> <span dir="ltr">mohammedalhendi1983@gmail.com</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
`;

content = content.replace(/<\/Tabs>/, aboutTab + '\n      </Tabs>');

// Add import Info
if(!content.includes('Info,')) {
    content = content.replace('Lock,', 'Lock, Info,');
}

fs.writeFileSync('src/pages/Settings.tsx', content);
console.log("About tab added");
