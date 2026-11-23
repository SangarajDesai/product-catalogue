const api = "^apps/api/src/";
const web = "^apps/web/src/";
const modules = `${api}modules/([^/]+)/`;

module.exports = {
  forbidden: [
    {
      name: "no-unresolved-imports",
      severity: "error",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "api-and-web-are-independent",
      severity: "error",
      from: { path: "^apps/(api|web)/" },
      to: { path: "^apps/(api|web)/", pathNot: "^apps/$1/" },
    },
    {
      name: "modules-connect-through-composition",
      severity: "error",
      from: { path: modules },
      to: { path: modules, pathNot: `${api}modules/$1/` },
    },
    {
      name: "domain-depends-only-on-its-domain",
      severity: "error",
      from: { path: `${modules}domain/` },
      to: { pathNot: `${api}modules/$1/domain/` },
    },
    {
      name: "application-depends-only-on-business-code",
      severity: "error",
      from: { path: `${modules}application/|${api}shared/application/` },
      to: { pathNot: [`${api}modules/$1/(application|domain)/`, `${api}shared/application/`] },
    },
    {
      name: "http-and-infrastructure-are-independent",
      severity: "error",
      from: { path: `${modules}(http|infrastructure)/` },
      to: { path: `${api}(modules/[^/]+|shared)/(http|infrastructure)/`, pathNot: `${api}(modules/$1|shared)/$2/` },
    },
    {
      name: "shared-code-does-not-import-features",
      severity: "error",
      from: { path: `${api}shared/|${web}shared/` },
      to: { path: `${api}modules/|${web}(app|features)/` },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
  },
};
