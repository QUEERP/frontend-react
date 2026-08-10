import os

add_path = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/pages/dashboard/[businessId]/leads/add/page.tsx'
edit_path = 'c:/Users/DELL/Downloads/new-queerp/frontend/src/pages/dashboard/[businessId]/leads/[id]/edit/page.tsx'

with open(add_path, 'r', encoding='utf-8') as f:
    add_content = f.read()

with open(edit_path, 'r', encoding='utf-8') as f:
    edit_content = f.read()

return_idx = add_content.find('  return (')
return_block = add_content[return_idx:]

new_return_block = return_block.replace('Add New Lead', 'Edit Lead')\
    .replace('Create a new lead to track in your pipeline', 'Update lead information')\
    .replace('Create Lead', 'Update Lead')\
    .replace('>Saving Lead...<', '>Updating Lead...<')

edit_return_idx = edit_content.find('  return (')
edit_content = edit_content[:edit_return_idx] + new_return_block

if 'useBusinessData' not in edit_content:
    edit_content = edit_content.replace(
        "import { usersAPI, BusinessUser } from '@/lib/api/users'",
        "import { usersAPI, BusinessUser } from '@/lib/api/users'\nimport { useBusinessData } from '@/components/dashboard/business-data-provider'"
    )

if 'const { business } = useBusinessData()' not in edit_content:
    edit_content = edit_content.replace(
        "const { id } = useParams();",
        "const { business } = useBusinessData();\n  const { id } = useParams();"
    )

edit_content = edit_content.replace(
    "defaultLanguage: 'English',",
    "defaultLanguage: 'English',\n    currency: '',"
)

edit_content = edit_content.replace(
    "defaultLanguage: leadData.defaultLanguage || 'English',",
    "defaultLanguage: leadData.defaultLanguage || 'English',\n            currency: leadData.currency || '',"
)

with open(edit_path, 'w', encoding='utf-8') as f:
    f.write(edit_content)

print('Done')
