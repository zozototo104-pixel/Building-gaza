import fs from 'fs';
let content = fs.readFileSync('src/pages/Accounting.tsx', 'utf-8');

const newTableStr = `                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الشقة</TableHead>
                      <TableHead className="text-right">اسم الساكن</TableHead>
                      <TableHead className="text-right">إجمالي الدين</TableHead>
                      <TableHead className="text-right">التفاصيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          جاري التحميل...
                        </TableCell>
                      </TableRow>
                    ) : filteredSummary.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          لا توجد ديون مطابقة
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSummary.map((summary) => (
                        <React.Fragment key={summary.apartmentId}>
                          <TableRow className="bg-muted/30">
                            <TableCell className="font-bold text-primary">شقة {summary.apartmentNumber}</TableCell>
                            <TableCell>{summary.residentName}</TableCell>
                            <TableCell className="font-bold text-destructive">\${summary.totalDebt}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => setExpandedApartment(expandedApartment === summary.apartmentId ? null : summary.apartmentId)}>
                                {expandedApartment === summary.apartmentId ? 'إخفاء' : 'عرض التفاصيل'}
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedApartment === summary.apartmentId && (
                            <TableRow>
                              <TableCell colSpan={4} className="p-0">
                                <div className="p-4 bg-muted/10 border-b">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-right">المصدر</TableHead>
                                        <TableHead className="text-right">الوصف</TableHead>
                                        <TableHead className="text-right">الأصل</TableHead>
                                        <TableHead className="text-right">المتبقي</TableHead>
                                        <TableHead className="text-right">الحالة</TableHead>
                                        <TableHead className="text-right">إجراء</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {summary.details.map((debt: any) => (
                                        <TableRow key={debt.id}>
                                          <TableCell>{debt.source}</TableCell>
                                          <TableCell>{debt.notes || '-'}</TableCell>
                                          <TableCell>\${debt.originalAmount}</TableCell>
                                          <TableCell className="font-bold text-destructive">\${debt.remainingAmount}</TableCell>
                                          <TableCell>
                                            <span className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold \${
                                              debt.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                                              debt.status === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' : 
                                              'bg-red-100 text-red-800'
                                            }\`}>
                                              {debt.status === 'PAID' ? 'مدفوع' : 
                                                debt.status === 'PARTIALLY_PAID' ? 'مدفوع جزئياً' : 
                                                'مفتوح'}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            <Button variant="outline" size="sm" onClick={() => {
                                              setSelectedDebt(debt);
                                              setIsPaymentDialogOpen(true);
                                            }}>
                                              سداد
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>`;

// I will use regex to replace everything between <TableHeader> and </TableBody> for the FIRST table (which is the debts table)
content = content.replace(/<TableHeader>[\s\S]*?<\/TableBody>/, newTableStr);

fs.writeFileSync('src/pages/Accounting.tsx', content);
console.log("Accounting page fixed");
