import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import process from "node:process"
import { fileURLToPath, URL } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
const directory = realpathSync(mkdtempSync(join(tmpdir(), "odata-package-smoke-")))
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: "inherit" })
try {
  const tarballs = ["odata-effect", "odata-effect-promise"].map((name) => {
    const packageDir = join(root, "packages", name)
    const pkg = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"))
    run("pnpm", ["--dir", packageDir, "pack", "--pack-destination", directory])
    return join(directory, `${pkg.name.replace("@", "").replace("/", "-")}-${pkg.version}.tgz`)
  })
  for (const sample of ["odata-v2", "trippin"]) {
    const output = join(directory, sample)
    run(process.execPath, [
      "packages/odata-effect-generator/build/esm/bin.js",
      "generate",
      `packages/odata-effect-generator/test/resource/${sample}.xml`,
      output
    ])
    // Test the APIs in this checkout, including changes awaiting a package release.
    const manifestPath = join(output, "package.json")
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
    manifest.dependencies["@odata-effect/odata-effect"] = `file:${tarballs[0]}`
    manifest.dependencies["@odata-effect/odata-effect-promise"] = `file:${tarballs[1]}`
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], output)
    run("npm", ["run", "check"], output)
    run("npm", ["run", "build"], output)
    run(process.execPath, [
      "-e",
      "import(\"./dist/index.js\").then(m => { if (!Object.keys(m).length) throw new Error(\"Empty generated module\") })"
    ], output)
  }
} finally {
  rmSync(directory, { recursive: true, force: true })
}
