import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

if (!content.includes('حول النظام')) {
    content = content.replace(
        '<TabsTrigger value="roles">الصلاحيات</TabsTrigger>',
        '<TabsTrigger value="roles">الصلاحيات</TabsTrigger>\n            <TabsTrigger value="about">حول النظام</TabsTrigger>'
    );
    
    const aboutSection = `
        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الهوية</CardTitle>
              <CardDescription>معلومات مطور النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-6 border rounded-lg bg-muted/10 text-center">
                  <h3 className="text-2xl font-bold mb-2">نظام إدارة العمارة السكنية</h3>
                  <div className="mt-6 space-y-2 text-lg">
                    <p className="font-semibold text-primary">المهندس محمد محمود الهندي «أبو مصعب»</p>
                    <p className="flex items-center justify-center gap-2 text-muted-foreground"><span dir="ltr">+972 59 440 3737</span> :الجوال</p>
                    <p className="flex items-center justify-center gap-2 text-muted-foreground">mohammedalhendi1983@gmail.com :البريد الإلكتروني</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
    `;
    
    content = content.replace('</Tabs>', aboutSection + '\n        </Tabs>');
}

fs.writeFileSync('src/pages/Settings.tsx', content);
