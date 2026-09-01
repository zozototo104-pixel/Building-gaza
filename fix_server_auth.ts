import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

const oldAuthError = `    } catch (error) {
      console.error('Error verifying auth token', error);
      res.status(401).json({ error: 'Unauthorized' });
    }`;

const newAuthError = `    } catch (error: any) {
      if (error?.message && (error.message.includes('invalid JWT') || error.message.includes('jwt expired'))) {
        res.status(401).json({ error: 'Unauthorized - Invalid or expired token' });
      } else {
        console.error('Error verifying auth token', error?.message || error);
        res.status(401).json({ error: 'Unauthorized' });
      }
    }`;

content = content.replace(oldAuthError, newAuthError);
fs.writeFileSync('server.ts', content);

let authTsx = fs.readFileSync('src/lib/auth.tsx', 'utf-8');
const oldAuthTsx = `        } else {
            setUserRecord(null);
        }`;
const newAuthTsx = `        } else {
            setUserRecord(null);
            if (res.status === 401) {
                await supabase.auth.signOut();
            }
        }`;
authTsx = authTsx.replace(oldAuthTsx, newAuthTsx);
fs.writeFileSync('src/lib/auth.tsx', authTsx);

console.log("Server and Auth fixes applied.");
