import fs from 'fs';
let content = fs.readFileSync('src/pages/RentContracts.tsx', 'utf-8');

const oldActions = `<DropdownMenuItem onClick={() => setExpandedContract(expandedContract === contract.id ? null : contract.id)}>                                عرض التفاصيل                              </DropdownMenuItem>                              <DropdownMenuItem className="text-destructive">                                إيقاف العقد                              </DropdownMenuItem>`;

const newActions = `<DropdownMenuItem onClick={() => setExpandedContract(expandedContract === contract.id ? null : contract.id)}>                                عرض التفاصيل                              </DropdownMenuItem>
                              {contract.tenant?.phone && (
                                <DropdownMenuItem onClick={() => {
                                  const msg = encodeURIComponent(\`مرحباً \${contract.tenant.name}، تذكير بخصوص عقد الإيجار لشقة \${contract.apartment?.number}\`);
                                  window.open(\`https://wa.me/\${contract.tenant.phone}?text=\${msg}\`, '_blank');
                                }}>
                                  تواصل واتساب
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive">                                إيقاف العقد                              </DropdownMenuItem>`;

content = content.replace(oldActions, newActions);
fs.writeFileSync('src/pages/RentContracts.tsx', content);
console.log("WhatsApp button added");
