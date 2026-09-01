const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const loginReplacement = `    try {
      await signIn(email, password);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/', { replace: true });
    } catch (err: any) {`;

code = code.replace(/    try \{\s*await signIn\(email, password\);\s*toast\.success\('تم تسجيل الدخول بنجاح'\);\s*\} catch \(err: any\) \{/m, loginReplacement);

const protectedReplacement = `const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userRecord, loading, signOut } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (!userRecord) return <div className="min-h-screen flex items-center justify-center">جاري تحميل الملف الشخصي...</div>;

  if (userRecord.isActive === false) {
    signOut();
    return <div className="min-h-screen flex items-center justify-center text-destructive font-bold text-lg">حسابك معطل. يرجى مراجعة الإدارة.</div>;
  }

  return <>{children}</>;
};`;

code = code.replace(/const ProtectedRoute = \(\{ children \}: \{ children: React\.ReactNode \}\) => \{[\s\S]*?return <[^>]+>\{children\}<\/[^>]+>;\n\};/m, protectedReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx patched");
