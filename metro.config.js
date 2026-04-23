// Monorepo-aware Metro config.
//
// El front vive en apps/mexfood pero consume los paquetes @core/* desde
// ../../packages/*. Configuramos Metro para:
//   1. Observar el monorepo entero (hot-reload cuando cambia un @core/*).
//   2. Resolver node_modules tanto del front como de la raíz del monorepo.
//   3. Reescribir imports ".js" → ".ts" dentro de packages/, porque nuestros
//      fuentes TS usan el sufijo .js para cumplir ESM (NodeNext) pero Metro
//      no sabe hacer esa sustitución por sí solo.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.resolver.unstable_enableSymlinks = true;

const packagesDirSegment = `${path.sep}packages${path.sep}`;

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith(".js")) {
    const origin = context.originModulePath || "";
    if (origin.includes(packagesDirSegment)) {
      try {
        return context.resolveRequest(
          context,
          moduleName.slice(0, -3),
          platform,
        );
      } catch {
        // cae al resolver por defecto
      }
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
