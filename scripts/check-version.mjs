import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const changelog = readFileSync(new URL('../docs/CHANGELOG.md', import.meta.url), 'utf8')

if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) {
  console.error(`版本号格式不合法：${pkg.version}`)
  process.exit(1)
}

if (!changelog.includes(`## [${pkg.version}]`)) {
  console.error(`docs/CHANGELOG.md 缺少 ${pkg.version} 的更新记录`)
  process.exit(1)
}

console.log(`版本 ${pkg.version} 校验通过`)
