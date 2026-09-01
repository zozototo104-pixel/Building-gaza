const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const analyzeReplacement = `  const handleAnalyze = async () => {
    if (!file) return;
    setImportStatus('ANALYZING');
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const parsedData = JSON.parse(content);
          
          const token = await getToken();
          const res = await fetch('/api/import/analyze', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: \`Bearer \${token}\`
            },
            body: JSON.stringify(parsedData)
          });
          
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'فشل التحليل');
          
          setPreviewData({
             ...data,
             parsedData // store to send later
          });
          setImportStatus('PREVIEW');
        } catch (err: any) {
          toast.error(err.message || "ملف غير صالح.");
          setImportStatus('ERROR');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      toast.error('حدث خطأ أثناء قراءة الملف');
      setImportStatus('ERROR');
    }
  };

  const handleDryRun = async () => {
    toast.info("جاري محاكاة الاستيراد (Dry Run)...");
    try {
        const token = await getToken();
        const res = await fetch('/api/import/execute', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: \`Bearer \${token}\`
            },
            body: JSON.stringify({
                data: previewData.parsedData,
                hash: previewData.hash,
                isDryRun: true
            })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            toast.success(data.message);
        } else {
            throw new Error(data.error);
        }
    } catch (err: any) {
        toast.error(err.message || "فشل محاكاة الاستيراد");
    }
  };

  const handleImport = async () => {
    if (!confirm('تحذير: هل أنت متأكد من رغبتك في استيراد هذه البيانات؟ هذه العملية ستؤثر على قاعدة البيانات الحالية.')) {
      return;
    }
    
    setImportStatus('IMPORTING');
    
    try {
        const token = await getToken();
        const res = await fetch('/api/import/execute', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: \`Bearer \${token}\`
            },
            body: JSON.stringify({
                data: previewData.parsedData,
                hash: previewData.hash,
                isDryRun: false
            })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            setImportStatus('DONE');
            toast.success("تم استيراد البيانات بنجاح");
        } else {
            throw new Error(data.error);
        }
    } catch (err: any) {
        toast.error(err.message || "فشل استيراد البيانات");
        setImportStatus('ERROR');
    }
  };`;

code = code.replace(/  const handleAnalyze = async \(\) => \{[\s\S]*?  \};\n\n  const handleImport = () => \{[\s\S]*?  \};\n/m, analyzeReplacement + "\n");

// I also need to ensure getToken is available from useAuth
code = code.replace(/const \{ userRecord \} = useAuth\(\);/, 'const { userRecord, getToken } = useAuth();');

fs.writeFileSync('src/pages/Settings.tsx', code);
console.log("Settings.tsx patched for Import API");
