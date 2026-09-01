import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

const oldMock = `          // This is a mock structure for now until the real backend endpoint is implemented
          // We would actually POST to /api/import/analyze
          setTimeout(() => {
            setPreviewData({
              detected: {
                buildings: 1,
                apartments: Array.isArray(parsedData.apartments) ? parsedData.apartments.length : 0,
                residents: Array.isArray(parsedData.residents) ? parsedData.residents.length : 0,
                debts: Array.isArray(parsedData.debts) ? parsedData.debts.length : 0,
                payments: Array.isArray(parsedData.payments) ? parsedData.payments.length : 0,
                expenses: Array.isArray(parsedData.expenses) ? parsedData.expenses.length : 0,
              },
              financialTotals: {
                legacyExpected: 15000,
                legacyCollected: 10000,
                legacyOutstanding: 5000
              },
              warnings: ["بعض الدفعات ليس لها رقم مرجعي", "لم يتم العثور على أرقام هواتف لبعض السكان"],
              valid: true
            });
            setLoading(false);
          }, 1500);`;

const newCode = `          fetch('/api/import/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${localStorage.getItem('token')}\` },
            body: JSON.stringify(parsedData)
          }).then(res => res.json())
          .then(data => {
            if (data.error) {
                alert(data.error);
                setLoading(false);
                return;
            }
            setPreviewData(data);
            setLoading(false);
          }).catch(err => {
            alert('حدث خطأ أثناء تحليل الملف');
            setLoading(false);
          });`;

content = content.replace(oldMock, newCode);

const oldMockImport = `    // Mock execution
    setTimeout(() => {
      setImportResult({
        success: true,
        reconciliation: {
          legacyExpected: previewData.financialTotals.legacyExpected,
          legacyCollected: previewData.financialTotals.legacyCollected,
          legacyOutstanding: previewData.financialTotals.legacyOutstanding,
          status: 'PASS',
          difference: 0
        }
      });
      setLoading(false);
    }, 2000);`;

const newImport = `    fetch('/api/import/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${localStorage.getItem('token')}\` },
      body: JSON.stringify({ data: JSON.parse(importFileContent), hash: previewData.hash, isDryRun: false })
    }).then(res => res.json())
    .then(data => {
      if (data.error) {
          alert(data.error);
          setLoading(false);
          return;
      }
      setImportResult(data);
      setLoading(false);
    }).catch(err => {
      alert('حدث خطأ أثناء الاستيراد');
      setLoading(false);
    });`;

content = content.replace(oldMockImport, newImport);

fs.writeFileSync('src/pages/Settings.tsx', content);
