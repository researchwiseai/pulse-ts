import fs from 'fs'

let lcov;
try {
    lcov = fs.readFileSync('coverage/lcov.info', 'utf8');
} catch (err) {
    console.error("Error: Unable to read 'coverage/lcov.info'. Please ensure the file exists and is accessible.");
    process.exit(1);
}
const sections = lcov.split('end_of_record');
const groups = {
    starters: [/src\/starters\.ts$/],
    dsl: [/src\/dsl\.ts$/],
    pipeline: [/src\/analyzer\.ts$/, /src\/processes\//],
    core: [/src\/core\/clients\//],
}
const totals = {}
for (const [g] of Object.entries(groups)) totals[g] = { lines: 0, hits: 0 }

for (const sec of sections) {
    const m = sec.match(/SF:(.+)/)
    if (!m) continue
    const file = m[1].trim()
    const lfMatch = sec.match(/LF:(\d+)/)
    const lhMatch = sec.match(/LH:(\d+)/)
    if (!lfMatch || !lhMatch) continue
    const lf = parseInt(lfMatch[1], 10)
    const lh = parseInt(lhMatch[1], 10)
    for (const [group, patterns] of Object.entries(groups)) {
        if (patterns.some(p => p.test(file))) {
            totals[group].lines += lf
            totals[group].hits += lh
            break
        }
    }
}

for (const [group, { lines, hits }] of Object.entries(totals)) {
    const pct = lines === 0 ? 0 : ((100 * hits) / lines).toFixed(2)
    console.log(`${group}: ${pct}% (${hits}/${lines})`)
}
