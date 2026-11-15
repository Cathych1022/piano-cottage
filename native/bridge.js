import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Only installed builds load this module. Website storage and downloads stay unchanged.
if (Capacitor.isNativePlatform()) {
  window.NativeCottage = {
    isNative: true,
    async exportBackup(data, filename) {
      if (!/^piano-cottage-backup-\d{4}-\d{2}-\d{2}\.json$/.test(filename)) {
        throw new Error('Invalid backup filename');
      }
      const file = await Filesystem.writeFile({
        path: filename, data, directory: Directory.Cache, encoding: Encoding.UTF8
      });
      await Share.share({
        title: document.documentElement.lang.startsWith('en') ? 'Piano Cottage backup' : '钢琴小屋备份',
        files: [file.uri]
      });
    }
  };
  // Save the latest foreground practice data before iOS suspends this version.
  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) window.P7?.save();
  }).catch(() => {});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.P7?.save();
  });
}
