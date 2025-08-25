# API 参考

本文档提供了 Acoustic Harmony 应用“API”的参考。由于应用使用 Next.js Server Actions，所谓的“API”由 `src/lib/actions.ts` 中导出的函数和 `src/lib/types.ts` 中定义的数据类型组成。

---

## 数据类型 (`src/lib/types.ts`)

### `Device`
代表一个已配置的 B&O 设备。
```ts
interface Device {
  id: string;       // 唯一标识符
  name: string;     // 用户友好的名称（例如，“客厅音响”）
  ip: string;       // 设备的 IP 地址
  online: boolean;  // 在线状态
}
```

### `Track`
代表一个单独的音轨。
```ts
interface Track {
  id: string;            // 唯一标识符
  title: string;         // 标题
  artist: string;        // 艺术家
  albumArtUrl: string;   // 专辑封面 URL
  duration: number;      // 时长（秒）
  path?: string;         // 可选的本地文件系统路径
}
```

### `PlaybackState`
代表设备播放的完整实时状态。
```ts
interface PlaybackState {
    state: 'playing' | 'paused' | 'stopped' | 'buffering'; // 播放状态
    progress: number;      // 进度（秒）
    volume: number;        // 音量（0-100）
    source: string;        // 当前活动音源的 ID
    playMode: 'sequential' | 'repeat-list' | 'repeat-one' | 'shuffle'; // 播放模式
    track: Track | null;   // 当前播放的曲目
}
```

### `Source`
代表设备上可用的播放音源。
```ts
interface Source {
  id: string;   // ID
  name: string; // 名称
  type: string; // 例如 'spotify', 'line-in'
}
```

*(其他类型如 `Playlist`, `Schedule` 等也在此文件中定义。)*

---

## Server Actions (`src/lib/actions.ts`)

以下是客户端应用可以调用的主要函数。

### 设备管理

- **`getDevices(): Promise<Device[]>`**
  - 从数据库检索所有已保存的设备，并检查它们的当前在线状态。

- **`addDevice(device: NewDevice): Promise<Device>`**
  - 向数据库添加一个新设备。`NewDevice` 类似于 `Device`，但没有 `id` 和 `online` 字段。

- **`deleteDevice(deviceId: string): Promise<{success: boolean}>`**
  - 按 ID 从数据库中删除一个设备。

- **`discoverDevices(): Promise<Omit<Device, 'id' | 'online'>[]>`**
  - 与本地发现服务通信，以在网络上寻找新设备。

### 播放控制

- **`getAvailableSources(deviceId: string, ip: string): Promise<Source[]>`**
  - 获取特定设备的可用播放音源列表（例如，Spotify, TV）。

- **`getPlaybackState(deviceId: string, ip: string): Promise<PlaybackState>`**
  - 从设备获取完整的当前播放状态。

- **`setPlaybackState(deviceId: string, ip: string, state: 'playing' | 'paused'): Promise<void>`**
  - 向设备发送播放或暂停命令。

- **`setVolume(deviceId: string, ip: string, volume: number): Promise<void>`**
  - 设置设备的音量（0-100）。

- **`seekTo(deviceId: string, ip: string, progress: number): Promise<void>`**
  - 将当前播放的曲目跳转到特定时间（秒）。

- **`nextTrack(deviceId: string, ip: string): Promise<void>`**
- **`previousTrack(deviceId: string, ip: string): Promise<void>`**
  - 跳到播放队列中的下一首或上一首曲目。

- **`changeSource(deviceId: string, ip: string, sourceId: string): Promise<void>`**
  - 更改设备上的当前活动输入源。

- **`setPlayMode(deviceId: string, ip: string, mode: PlayMode): Promise<void>`**
  - 设置播放模式（例如，'shuffle', 'repeat-list'）。

### 音乐库

- **`getMusicFolders(): Promise<MusicFolder[]>`**
  - 检索已配置的本地音乐文件夹路径列表。

- **`saveMusicFolders(folders: MusicFolder[]): Promise<void>`**
  - 将音乐文件夹路径列表保存到数据库。

- **`getAvailableTracks(): Promise<Track[]>`**
  - 从数据库检索所有已发现的曲目。

- **`scanMusicFolders(): Promise<{ success: boolean, message: string, count: number }>`**
  - 在服务器上触发对已配置音乐文件夹的扫描以查找音频文件。
