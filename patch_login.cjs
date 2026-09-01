const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const loginHookReplacement = `  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {`;

code = code.replace(/  const \{ signIn \} = useAuth\(\);\s*const navigate = useNavigate\(\);\s*const \[email, setEmail\] = useState\(''\);\s*const \[password, setPassword\] = useState\(''\);\s*const \[loading, setLoading\] = useState\(false\);\s*const \[checkingSetup, setCheckingSetup\] = useState\(true\);\s*useEffect\(\(\) => \{/m, loginHookReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx login hook patched");
