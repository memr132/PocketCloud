const fs = require('fs');
const os = require('os');
const { STORAGE_ROOT } = require('../config');

function getSystemStats(req, res) {
  try {
    let totalBytes = 0;
    let freeBytes = 0;
    let usedBytes = 0;

    try {
      if (fs.statfsSync) {
        const stats = fs.statfsSync(STORAGE_ROOT);
        freeBytes = Number(stats.bfree) * Number(stats.bsize);
        totalBytes = Number(stats.blocks) * Number(stats.bsize);
        usedBytes = totalBytes - freeBytes;
      }
    } catch (e) {
      // Fallback if statfsSync fails
    }

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptime = os.uptime();
    const nodeUptime = process.uptime();
    const cpus = os.cpus();
    const loadAvg = os.loadavg ? os.loadavg() : [0, 0, 0];

    let isTermux = false;
    let wakelockActive = false;
    try {
      if (fs.existsSync('/data/data/com.termux')) {
        isTermux = true;
      }
      if (fs.existsSync('/sys/power/wake_lock')) {
        const lockContent = fs.readFileSync('/sys/power/wake_lock', 'utf8');
        if (lockContent.includes('termux')) {
          wakelockActive = true;
        }
      }
    } catch (err) {}

    return res.status(200).json({
      success: true,
      stats: {
        storage: {
          totalBytes,
          freeBytes,
          usedBytes,
          path: STORAGE_ROOT
        },
        memory: {
          totalBytes: totalMem,
          freeBytes: freeMem,
          usedBytes: usedMem,
          nodeMemoryUsage: process.memoryUsage()
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          cpusCount: cpus.length,
          cpuModel: cpus[0] ? cpus[0].model : 'Unknown ARM CPU',
          uptimeSeconds: uptime,
          nodeUptimeSeconds: nodeUptime,
          loadAvg,
          isTermux,
          wakelockActive
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getSystemStats
};
