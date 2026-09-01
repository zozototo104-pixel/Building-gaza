import fs from 'fs';
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf-8');

if (!content.includes('handleExportCSV')) {
    const csvExport = `
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === 'debts') {
        csvContent += "الشقة,الساكن,إجمالي الدين\\n";
        debts.forEach(d => {
            csvContent += \`\${d.apartment_number},\${d.resident_name || ''},\${d.total_debt}\\n\`;
        });
    } else if (activeTab === 'payments') {
        csvContent += "التاريخ,الشقة,الساكن,المبلغ,طريقة الدفع\\n";
        payments.forEach(p => {
            csvContent += \`\${new Date(p.date).toLocaleDateString('ar-EG')},\${p.apartment_number},\${p.resident_name || ''},\${p.amount},\${p.method}\\n\`;
        });
    } else if (activeTab === 'expenses') {
        csvContent += "التاريخ,الجهة,المبلغ,المسؤول\\n";
        expenses.forEach(e => {
            csvContent += \`\${new Date(e.date).toLocaleDateString('ar-EG')},\${e.beneficiary},\${e.amount},\${e.created_by_name || ''}\\n\`;
        });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", \`report_\${activeTab}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
`;
    content = content.replace("const handlePrint = () => {", csvExport + "\n  const handlePrint = () => {");
    
    content = content.replace(
        `<Button onClick={handlePrint} className="gap-2">`,
        `<Button variant="outline" onClick={handleExportCSV} className="gap-2">تصدير CSV</Button>\n        <Button onClick={handlePrint} className="gap-2">`
    );
}
fs.writeFileSync('src/pages/Reports.tsx', content);
