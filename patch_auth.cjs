const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.tsx', 'utf8');

const interfaceReplacement = `interface AppUser {
  id: number;
  authId: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'accountant' | 'viewer' | 'tenant';
  isActive: boolean;
}`;

code = code.replace(/interface AppUser \{[\s\S]*?\}/, interfaceReplacement);

const fetchReplacement = `  const fetchUserRecord = async (token: string) => {
    try {
      const res = await fetch('/api/me', {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserRecord(data.user);
      } else {
        const errorData = await res.json().catch(() => null);
        if (res.status === 403 && errorData?.error === 'Account is disabled') {
            setUserRecord({ isActive: false } as any);
        } else {
            setUserRecord(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user record', error);
      setUserRecord(null);
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(/  const fetchUserRecord = async \([\s\S]*?  \};\n/m, fetchReplacement + "\n");

// And also we should make sure loading is true when we start fetching
const effectReplacement = `  useEffect(() => {
    // Initial fetch of session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        fetchUserRecord(session.access_token);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        fetchUserRecord(session.access_token);
      } else {
        setUserRecord(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);`;

code = code.replace(/  useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/m, effectReplacement);

fs.writeFileSync('src/lib/auth.tsx', code);
console.log("auth.tsx patched");
