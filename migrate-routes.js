import { Project, SyntaxKind } from 'ts-morph';
import path from 'path';

const project = new Project();
project.addSourceFilesAtPaths('src/pages/**/*.tsx');

let modifiedCount = 0;

for (const sourceFile of project.getSourceFiles()) {
  let isModified = false;
  const filePath = sourceFile.getFilePath();

  // Handle Next.js page components and layouts
  const defaultExport = sourceFile.getDefaultExportSymbol();
  if (defaultExport) {
    const declaration = defaultExport.getDeclarations()[0];
    if (declaration && declaration.getKind() === SyntaxKind.FunctionDeclaration) {
      const funcDecl = declaration.asKind(SyntaxKind.FunctionDeclaration);
      if (funcDecl) {
        // Remove `async` keyword if present
        if (funcDecl.isAsync()) {
          funcDecl.setIsAsync(false);
          isModified = true;
        }

        // Replace `params` handling
        const parameters = funcDecl.getParameters();
        if (parameters.length > 0) {
          const firstParam = parameters[0];
          // E.g. { params }: { params: Promise<{ id: string }> }
          
          let hasParamsProperty = false;
          let hasSearchParamsProperty = false;

          // Check if it's destructured
          if (firstParam.getNameNode().getKind() === SyntaxKind.ObjectBindingPattern) {
             const elements = firstParam.getNameNode().asKind(SyntaxKind.ObjectBindingPattern).getElements();
             for (const el of elements) {
               if (el.getName() === 'params') hasParamsProperty = true;
               if (el.getName() === 'searchParams') hasSearchParamsProperty = true;
             }
          }

          if (hasParamsProperty || hasSearchParamsProperty || firstParam.getName() === 'props') {
             // We need to inject React Router hooks inside the function body
             
             // First, remove the parameter completely since React Router doesn't pass props to route components
             firstParam.remove();
             isModified = true;

             // Find `await params` or `await searchParams` in the body
             const body = funcDecl.getBody();
             if (body && body.getKind() === SyntaxKind.Block) {
               const block = body.asKind(SyntaxKind.Block);
               let addedUseParams = false;
               let addedUseSearchParams = false;

               // Iterate statements to replace variable declarations like: const { id } = await params;
               const statements = block.getStatements();
               for (const stmt of statements) {
                 if (stmt.getKind() === SyntaxKind.VariableStatement) {
                   const varStmt = stmt.asKind(SyntaxKind.VariableStatement);
                   for (const decl of varStmt.getDeclarations()) {
                     const init = decl.getInitializer();
                     if (init && init.getKind() === SyntaxKind.AwaitExpression) {
                       const awaitedExpr = init.asKind(SyntaxKind.AwaitExpression).getExpression();
                       if (awaitedExpr.getText() === 'params') {
                         init.replaceWithText('useParams()');
                         addedUseParams = true;
                         isModified = true;
                       } else if (awaitedExpr.getText() === 'searchParams') {
                         init.replaceWithText('useSearchParams()[0]'); // React router returns [searchParams, setSearchParams]
                         addedUseSearchParams = true;
                         isModified = true;
                       }
                     }
                     // Fallback if they didn't await (e.g. Next.js 14)
                     else if (init && init.getText() === 'params') {
                         init.replaceWithText('useParams()');
                         addedUseParams = true;
                         isModified = true;
                     }
                   }
                 }
               }

               // Add imports to the top of the file if needed
               if (addedUseParams || addedUseSearchParams) {
                 const importsToAdd = [];
                 if (addedUseParams) importsToAdd.push('useParams');
                 if (addedUseSearchParams) importsToAdd.push('useSearchParams');
                 
                 // Check if import { ... } from 'react-router-dom' exists
                 const reactRouterImport = sourceFile.getImportDeclaration('react-router-dom');
                 if (reactRouterImport) {
                    const namedImports = reactRouterImport.getNamedImports().map(i => i.getName());
                    for (const i of importsToAdd) {
                       if (!namedImports.includes(i)) {
                          reactRouterImport.addNamedImport(i);
                       }
                    }
                 } else {
                    sourceFile.addImportDeclaration({
                       namedImports: importsToAdd,
                       moduleSpecifier: 'react-router-dom'
                    });
                 }
               }
             }
          }
        }
      }
    }
  }

  // Remove next specific imports
  const nextImports = sourceFile.getImportDeclarations().filter(i => 
    i.getModuleSpecifierValue().startsWith('next/') || 
    i.getModuleSpecifierValue() === 'next' ||
    i.getModuleSpecifierValue() === '@vercel/analytics/next'
  );
  
  if (nextImports.length > 0) {
    for (const imp of nextImports) {
      imp.remove();
    }
    isModified = true;
  }

  // Fix root layout.tsx specific things
  if (filePath.endsWith('src/pages/layout.tsx') || filePath.endsWith('src\\pages\\layout.tsx')) {
    // Replace <html> and <body> with fragments or divs since they shouldn't be in a react router tree (they belong in index.html)
    sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement).forEach(jsxElem => {
      const tagName = jsxElem.getOpeningElement().getTagNameNode().getText();
      if (tagName === 'html' || tagName === 'body') {
        jsxElem.getOpeningElement().getTagNameNode().replaceWithText('div');
        jsxElem.getClosingElement().getTagNameNode().replaceWithText('div');
        isModified = true;
      }
    });
    
    // Remove Metadata export
    const metadataExport = sourceFile.getVariableStatement('metadata');
    if (metadataExport) {
       metadataExport.remove();
       isModified = true;
    }
  }

  if (isModified) {
    modifiedCount++;
    console.log(`Modified: ${filePath}`);
  }
}

project.saveSync();
console.log(`Successfully migrated ${modifiedCount} files.`);
