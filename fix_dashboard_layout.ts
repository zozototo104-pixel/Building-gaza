import fs from 'fs';
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

content = content.replace('const { appUser, signOut } = useAuth();', 'const { userRecord, signOut } = useAuth();');
content = content.replace(/appUser/g, 'userRecord');

const newNavLinks = `  const NavLinks = () => {
    let filteredGroups = navigationGroups;
    if (userRecord?.role === 'tenant') {
      filteredGroups = [
        {
          title: 'الساكن',
          items: [
            { name: 'بوابة الساكن', href: '/tenant', icon: DoorOpen },
            { name: 'الإعلانات والزيارات', href: '/community', icon: Megaphone }
          ]
        }
      ];
    }
    
    return (
    <div className="space-y-4">
      {filteredGroups.map((group, idx) => (`;

content = content.replace(`  const NavLinks = () => (
    <div className="space-y-4">
      {navigationGroups.map((group, idx) => (`, newNavLinks);
      
// Fix the closing bracket of NavLinks
content = content.replace(`        </div>
      ))}
    </div>
  );`, `        </div>
      ))}
    </div>
    );
  };`);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
console.log("Dashboard layout fixed");
