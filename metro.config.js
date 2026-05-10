// Metro config para Expo + paquetes @core/* vendoreados en ./core/.
//
// Los paquetes @core/* viven dentro del proyecto (carpeta `core/`)
// para que EAS Build los suba junto con el resto del bundle. Sus
// fuentes TS usan imports con sufijo ".js" (convención ESM NodeNext)
// que Metro no resuelve por sí solo — el hook de resolveRequest
// reescribe ".js" → ".ts" cuando el módulo origen vive dentro de
// `core/`.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Si existe el monorepo padre (entorno de dev fuera de EAS), también
// observamos sus node_modules. En EAS Build el path no existe y se
// salta sin error.
const monorepoRoot = path.resolve(projectRoot, "../..");
if (fs.existsSync(path.join(monorepoRoot, "package.json"))) {
  config.watchFolders = [monorepoRoot];
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(monorepoRoot, "node_modules"),
  ];
}

config.resolver.unstable_enableSymlinks = true;

const coreDirSegment = `${path.sep}core${path.sep}`;

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith(".js")) {
    const origin = context.originModulePath || "";
    if (origin.includes(coreDirSegment)) {
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
