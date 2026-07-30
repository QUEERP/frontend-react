const fs = require('fs');
const path = 'src/components/dashboard/expense-page-client.tsx';
let c = fs.readFileSync(path, 'utf-8');
const original = c;

// Add EyeIcon import
c = c.replace(/EditIcon,/g, 'EditIcon,\n  EyeIcon,');

// Add isDownloadingPdf state
if (!c.includes('isDownloadingPdf')) {
  c = c.replace(/const \[deleting, setDeleting\] = useState\(false\)/, "const [deleting, setDeleting] = useState(false)\n  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)");
}

// Modify handleDownloadPdf
const newDownload = `const handleDownloadPdf = (id: string) => {
    const token = getCookie('token') || getCookie('accessToken')
    if (!token) return

    setIsDownloadingPdf(true)
    const url = \`\${API_BASE}/api/expenses/\${id}/pdf\`
    fetch(url, {
      headers: {
        Authorization: \`Bearer \${token}\`,
        'x-business-id': businessId,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to generate PDF')
        const blob = await res.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = \`Expense_\${id.substring(0, 8)}.pdf\`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(downloadUrl)
        toast({ title: 'Success', description: 'PDF downloaded successfully' })
      })
      .catch((err) => {
        toast({
          title: 'Error',
          description: err.message || 'Could not download PDF',
          variant: 'destructive',
        })
      })
      .finally(() => setIsDownloadingPdf(false))
  }`;
c = c.replace(/const handleDownloadPdf = \(id: string\) => \{[\s\S]*?\}\n  \}/s, newDownload);

// Add View Action
const viewAction = `<DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(\`/dashboard/\${businessId}/expenses/\${item.id}/view\`) }} className="text-sm cursor-pointer rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-900/30 dark:focus:text-indigo-400">
                                  <EyeIcon className="mr-2 size-4" />
                                  View Expense
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(\`/dashboard/\${businessId}/expenses/\${item.id}/edit\`) }}`;
c = c.replace(/<DropdownMenuItem onClick=\{\(e\) => \{ e\.stopPropagation\(\); navigate\(`\/dashboard\/\$\{businessId\}\/expenses\/\$\{item\.id\}\/edit`\) \}\}/, viewAction);

// Add Processing Dialog
const dialog = `<Dialog open={isDownloadingPdf} onOpenChange={setIsDownloadingPdf}>
        <DialogContent className="sm:max-w-[425px] flex flex-col items-center justify-center p-8">
          <Loader2Icon className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <DialogTitle className="text-xl font-semibold">Processing PDF</DialogTitle>
          <DialogDescription className="text-center mt-2">
            Please wait while your PDF is being generated and downloaded...
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  )
}
`;
c = c.replace(/<\/div>\s*\)\s*\}\s*$/, dialog);

if (c !== original) {
  fs.writeFileSync(path, c);
  console.log("Updated expense page");
} else {
  console.log("No changes made!");
}
