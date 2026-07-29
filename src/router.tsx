import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter, Outlet } from 'react-router-dom';

const pageModules = import.meta.glob('./pages/**/page.tsx', { eager: true });
const layoutModules = import.meta.glob('./pages/**/layout.tsx', { eager: true });

function parsePath(path: string) {
  // Removes './pages' and '/page.tsx' or '/layout.tsx'
  let normalized = path.replace(/^\.\/pages/, '').replace(/\/(page|layout)\.tsx$/, '');
  if (normalized === '') normalized = '/';
  
  // Convert [param] to :param
  return normalized.replace(/\[([^\]]+)\]/g, ':$1');
}

type RouteNode = {
  path: string; 
  fullPath: string;
  page?: React.ComponentType<any>;
  layout?: React.ComponentType<any>;
  children: Map<string, RouteNode>;
};

const root: RouteNode = { path: '', fullPath: '/', children: new Map() };

function getNode(pathStr: string): RouteNode {
  if (pathStr === '/' || pathStr === '') return root;
  const segments = pathStr.split('/').filter(Boolean);
  let current = root;
  let full = '';
  for (const segment of segments) {
    full += '/' + segment;
    if (!current.children.has(segment)) {
      current.children.set(segment, { path: segment, fullPath: full, children: new Map() });
    }
    current = current.children.get(segment)!;
  }
  return current;
}

for (const [path, module] of Object.entries(layoutModules)) {
  const parsed = parsePath(path);
  const node = getNode(parsed);
  node.layout = (module as any).default;
}

for (const [path, module] of Object.entries(pageModules)) {
  const parsed = parsePath(path);
  const node = getNode(parsed);
  node.page = (module as any).default;
}

function buildReactRoutes(node: RouteNode): RouteObject {
  const children = Array.from(node.children.values()).map(buildReactRoutes);
  
  const element = node.page ? React.createElement(node.page) : undefined;
  
  if (node.layout) {
    const layoutElement = React.createElement(node.layout, null, React.createElement(Outlet));
    
    const layoutChildren: RouteObject[] = [...children];
    if (element) {
       layoutChildren.push({ index: true, element });
    }
    
    return {
      path: node.path,
      element: layoutElement,
      children: layoutChildren,
    };
  }

  if (children.length > 0 && element) {
    return {
      path: node.path,
      children: [
        { index: true, element },
        ...children,
      ],
    };
  }

  return {
    path: node.path,
    element,
    children: children.length > 0 ? children : undefined,
  };
}

const routerTree = buildReactRoutes(root);
routerTree.path = '/'; // Ensure root path matches '/'

export const router = createBrowserRouter([routerTree]);
