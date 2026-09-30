with open('web/src/components/layout/AppLayout.tsx', 'r') as f:
    content = f.read()

# Fix the commented roleLabel object
content = content.replace('''// const roleLabel: Record<UserRole, string> = {
  FAMILY_HEAD: 'Family Head',
  MEMBER: 'Adult Member',
  DOCTOR: 'Doctor',
  ADMIN: 'Clinic Administrator',
  ONBOARDING: 'New account',
}''', '''// const roleLabel: Record<UserRole, string> = {
//   FAMILY_HEAD: 'Family Head',
//   MEMBER: 'Adult Member',
//   DOCTOR: 'Doctor',
//   ADMIN: 'Clinic Administrator',
//   ONBOARDING: 'New account',
// }''')

with open('web/src/components/layout/AppLayout.tsx', 'w') as f:
    f.write(content)

