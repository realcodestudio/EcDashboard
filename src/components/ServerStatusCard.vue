<script setup lang="ts">
import { defineProps, ref, computed, watchEffect, defineEmits, onUnmounted, watch } from 'vue';

// 更新 ApiData 接口以匹配您提供的结构
interface ApiData {
  code: number;
  data: {
    cpu: string;
    disk: string;
    mem: string;
    name: string;
    net: string;
  };
}

// 更新 DisplayData 接口以匹配新的显示需求
interface DisplayData {
  name: string;
  cpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  diskUsed: number;
  diskTotal: number;
  netUpload: number; // 上传流量 (KB/s)
  netDownload: number; // 下载流量 (KB/s)
  updateTime: string;
}

// 恢复 apiUrl 和 minWidthPx props，移除 apiUrlInput
const props = defineProps<{ apiUrl: string, minWidthPx?: number, refreshInterval?: number }>();

const serverData = ref<DisplayData | null>(null);
const isLoading = ref(false);
const hasError = ref(false);
const errorMessage = ref('');

let refreshTimer: number | null = null; // 定时器ID

const fetchData = async () => {
   if (!props.apiUrl) {
    errorMessage.value = '未提供 API 地址';
    hasError.value = true;
    return;
  }

  isLoading.value = true;
  hasError.value = false;
  errorMessage.value = '';

  try {
    // 使用 apiUrl prop 获取数据
    const response = await fetch(props.apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const apiData: ApiData = await response.json();

    if (apiData.code === 0 && apiData.data) {
      const data = apiData.data;

      // 解析 CPU 使用率
      const cpuMatch = data.cpu.match(/([\d\.]+)%/);
      const cpuUsage = cpuMatch ? parseFloat(cpuMatch[1]) : 0;

      // 解析内存使用
      const memMatch = data.mem.match(/([\d\.]+[mg]) \/ ([\d\.]+[mg])/i);
      let memoryUsed = 0, memoryTotal = 0;
      if (memMatch) {
        memoryUsed = parseSizeToMB(memMatch[1]);
        memoryTotal = parseSizeToMB(memMatch[2]);
      }

      // 解析磁盘使用
      const diskMatch = data.disk.match(/([\d\.]+[mg]) \/ ([\d\.]+[mg])/i);
       let diskUsed = 0, diskTotal = 0;
      if (diskMatch) {
        diskUsed = parseSizeToMB(diskMatch[1]);
        diskTotal = parseSizeToMB(diskMatch[2]);
      }

      // 解析网络流量
      const netMatch = data.net.match(/([\d\.]+[kmg]) \/ ([\d\.]+[kmg])/i); // 假设格式是 upload / download
      let netUpload = 0, netDownload = 0;
       if (netMatch) {
        netUpload = parseSizeToKB(netMatch[1]); // 转换为 KB
        netDownload = parseSizeToKB(netMatch[2]); // 转换为 KB
      }

      serverData.value = {
        name: data.name,
        cpuUsage: cpuUsage,
        memoryUsed: memoryUsed,
        memoryTotal: memoryTotal,
        diskUsed: diskUsed,
        diskTotal: diskTotal,
        netUpload: netUpload,
        netDownload: netDownload,
        updateTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // 使用当前时间作为更新时间
      };
    } else {
      hasError.value = true;
      errorMessage.value = apiData.code === 0 ? 'API 返回数据结构不正确' : `API 返回错误代码: ${apiData.code}`;
      console.error('API returned an error:', apiData);
    }
  } catch (error: any) {
    hasError.value = true;
    errorMessage.value = `获取数据失败: ${error.message}`;
    console.error('Failed to fetch server data:', error);
  } finally {
    isLoading.value = false;
  }
};

// 辅助函数：解析带有单位的尺寸字符串 (e.g., "749.3m", "1.9g") 为 MB
const parseSizeToMB = (sizeStr: string): number => {
  const match = sizeStr.match(/([\d\.]*)([mg])/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'm') return value; // MB
  if (unit === 'g') return value * 1024; // GB to MB
  return 0;
};

// 辅助函数：解析带有单位的流量字符串 (e.g., "6.4k", "1.7m", "1.9g") 为 KB
const parseSizeToKB = (sizeStr: string): number => {
  const match = sizeStr.match(/([\d\.]*)([kmg])/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'k') return value; // KB
  if (unit === 'm') return value * 1024; // MB to KB
  if (unit === 'g') return value * 1024 * 1024; // GB to KB
  return 0;
};

// 辅助函数：格式化流量显示 (KB/s)
const formatTraffic = (speedKb: number): string => {
  if (speedKb < 1024) return `${speedKb.toFixed(1)}KB/s`;
  if (speedKb < 1024 * 1024) return `${(speedKb / 1024).toFixed(1)}MB/s`;
  return `${(speedKb / (1024 * 1024)).toFixed(1)}GB/s`;
};

// 计算属性用于进度条宽度和显示文本
const cpuPercentage = computed(() => serverData.value?.cpuUsage || 0);

const memoryUsedMB = computed(() => serverData.value?.memoryUsed || 0);
const memoryTotalMB = computed(() => serverData.value?.memoryTotal || 0);
const memoryPercentage = computed(() => {
  if (memoryTotalMB.value === 0) return 0;
  return (memoryUsedMB.value / memoryTotalMB.value) * 100;
});

const diskUsedMB = computed(() => serverData.value?.diskUsed || 0);
const diskTotalMB = computed(() => serverData.value?.diskTotal || 0);
const diskPercentage = computed(() => {
   if (diskTotalMB.value === 0) return 0;
  return (diskUsedMB.value / diskTotalMB.value) * 100;
});

const netUploadKb = computed(() => serverData.value?.netUpload || 0);
const netDownloadKb = computed(() => serverData.value?.netDownload || 0);
const netUploadText = computed(() => formatTraffic(netUploadKb.value));
const netDownloadText = computed(() => formatTraffic(netDownloadKb.value));

// 将 MB 转换为带有单位的字符串 (MB, GB)
const formatSizeToUnits = (sizeMb: number): string => {
   if (sizeMb < 1) return `${(sizeMb * 1024).toFixed(1)}KB`; // 小于 1MB 显示为 KB，虽然通常内存/磁盘不会这么小
  if (sizeMb < 1024) return `${sizeMb.toFixed(1)}MB`;
  return `${(sizeMb / 1024).toFixed(1)}GB`;
};

// 在 apiUrl 变化或组件挂载时获取数据
watchEffect(() => {
  if (props.apiUrl) {
    fetchData();
  }
});

// 使用 watch 来监听 refreshInterval 变化并设置定时器
watch(() => props.refreshInterval, (newInterval, oldInterval) => {
  // 清除旧的定时器
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
  }

  // 如果新的间隔有效（大于0），则设置新的定时器
  if (newInterval && newInterval > 0) {
    refreshTimer = setInterval(fetchData, newInterval);
    console.log(`ServerStatusCard: 设置了新的刷新定时器，间隔为 ${newInterval}ms`);
  } else {
     refreshTimer = null;
     console.log('ServerStatusCard: 刷新间隔无效或为0，定时器未设置或已清除');
  }
}, { immediate: true }); // 立即执行一次以设置初始定时器

// 组件卸载时清除定时器防止内存泄漏
onUnmounted(() => {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    console.log('ServerStatusCard: 组件卸载，清除定时器');
  }
});

// 声明要发出的事件
const emit = defineEmits(['openSettings']);

// 设置图标点击事件
const handleSettingsClick = () => {
  console.log('ServerStatusCard: Settings icon clicked, emitting openSettings event.');
  emit('openSettings');
};

</script>

<template>
  <div
    class="bg-white p-6 rounded-lg shadow-md relative"
    :style="{ minWidth: props.minWidthPx ? `${props.minWidthPx}px` : undefined }"
  >
    <!-- 设置图标 (始终显示) -->
    <div @click="handleSettingsClick" class="absolute bottom-4 right-4 cursor-pointer z-10">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>

    <div v-if="isLoading && !serverData" class="flex items-center justify-center h-48">
      <p>加载中...</p>
    </div>
    <div v-else-if="hasError" class="flex items-center justify-center h-48">
      <p class="text-red-500">{{ errorMessage }}</p>
    </div>
    <div v-else-if="serverData">
      <!-- 顶部区域：服务器名称和网络流量 -->
      <div class="flex justify-between items-center mb-4">
        <!-- 服务器名称 -->
        <h2 class="text-2xl font-semibold text-gray-800 text-left">{{ serverData.name }}</h2> 

        <!-- 网络流量显示 -->
        <div class="text-gray-600 text-sm flex items-center">
          <span>{{ netUploadText }} ↑</span>
          <span class="ml-2">{{ netDownloadText }} ↓</span>
        </div>
      </div>

      <div class="space-y-4">
        <!-- CPU 使用率 -->
        <div class="flex items-center">
          <div class="w-7 h-7 flex items-center justify-center mr-4">
            <!-- CPU 图标 -->
            <svg t="1748622820679" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3507" width="200" height="200"><path d="M256 768h512V256H256v512z m341.333333 85.333333h-170.666666v85.333334H341.333333v-85.333334H213.333333a42.666667 42.666667 0 0 1-42.666666-42.666666v-128H85.333333v-85.333334h85.333334v-170.666666H85.333333V341.333333h85.333334V213.333333a42.666667 42.666667 0 0 1 42.666666-42.666666h128V85.333333h85.333334v85.333334h170.666666V85.333333h85.333334v85.333334h128a42.666667 42.666667 0 0 1 42.666666 42.666666v128h85.333334v85.333334h-85.333334v170.666666h85.333334v85.333334h-85.333334v128a42.666667 42.666667 0 0 1-42.666666 42.666666h-128v85.333334h-85.333334v-85.333334zM341.333333 341.333333h341.333334v341.333334H341.333333V341.333333z" fill="#000000" p-id="3508"></path></svg>
          </div>
          <div class="flex-1">
            <!-- 状态文本 -->
            <div class="text-sm text-gray-600 mb-1"> CPU使用率 {{ cpuPercentage.toFixed(1) }}%</div>
            <!-- 进度条容器 -->
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div class="bg-cyan-400 h-3 rounded-full" :style="{ width: cpuPercentage + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- 内存使用 -->
        <div class="flex items-center">
          <div class="w-7 h-7 flex items-center justify-center mr-4">
            <!-- 内存图标 -->
            <svg t="1748622584945" class="h-10 w-10 text-gray-700" viewBox="0 0 1024 1024" stroke="currentColor">version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2420" width="200" height="200"><path d="M128 298.666667h768v426.666666h-85.333333v-85.333333h-85.333334v85.333333h-85.333333v-85.333333h-85.333333v85.333333h-85.333334v-85.333333H384v85.333333H298.666667v-85.333333H213.333333v85.333333H128V298.666667zM85.333333 213.333333a42.666667 42.666667 0 0 0-42.666666 42.666667v512a42.666667 42.666667 0 0 0 42.666666 42.666667h853.333334a42.666667 42.666667 0 0 0 42.666666-42.666667V256a42.666667 42.666667 0 0 0-42.666666-42.666667H85.333333z m384 170.666667H213.333333v128h256V384z m85.333334 0h256v128h-256V384z" fill="#000000" p-id="2421"></path></svg>
          </div>
          <div class="flex-1">
             <!-- 状态文本 -->
            <div class="text-sm text-gray-600 mb-1">运行内存 {{ formatSizeToUnits(memoryUsedMB) }}/{{ formatSizeToUnits(memoryTotalMB) }}</div>
            <!-- 进度条容器 -->
             <div class="w-full bg-gray-200 rounded-full h-3">
              <div class="bg-yellow-400 h-3 rounded-full" :style="{ width: memoryPercentage + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- 磁盘使用 -->
        <div class="flex items-center">
          <div class="w-7 h-7 flex items-center justify-center mr-4">
            <!-- 磁盘图标 -->
            <svg t="1748622941969" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10950" width="200" height="200"><path d="M511.7 473.5c38.6 0 70-31.4 70-70s-31.4-70-70-70-70 31.4-70 70c0 38.7 31.4 70 70 70z" fill="#2c2c2c" opacity=".8" p-id="10951"></path><path d="M849.1 21H175.2C129.8 21 93 57.8 93 103.2v815.6c0 45.4 36.8 82.2 82.2 82.2h673.9c45.4 0 81.9-36.8 81.9-82.2V103.2c0-45.4-36.5-82.2-81.9-82.2z m-588 896c-38.6 0-70-31.4-70-70s31.4-70 70-70 70 31.4 70 70-31.3 70-70 70zM449 673.2c-122.2-28.4-213.1-137.9-213.1-268.7 0-152.4 123.4-275.8 275.8-275.8s275.8 123.4 275.8 275.8c0 79.5-33.5 151.2-87.4 201.4-27.6-20.8-53.3-41.3-68-56.2-43.9-43.9-115-43.9-158.9 0-33.4 33.4-41.4 82.6-24.2 123.5z m369.4 222.9c-27.6 27.5-72.2 27.5-100 0-23.6-23.6-176-234.3-182.5-240.6-11.8-12-11.8-31.1 0-42.9 11.8-11.8 30.9-11.8 42.9 0 6.9 7.1 217.2 161.1 239.6 183.6 27.6 27.7 27.6 72.4 0 99.9z" fill="#2c2c2c" p-id="10952"></path></svg>
          </div>
          <div class="flex-1">
             <!-- 状态文本 -->
            <div class="text-sm text-gray-600 mb-1">储存空间 {{ formatSizeToUnits(diskUsedMB) }}/{{ formatSizeToUnits(diskTotalMB) }}</div>
            <!-- 进度条容器 -->
             <div class="w-full bg-gray-200 rounded-full h-3">
               <div class="bg-red-400 h-3 rounded-full" :style="{ width: diskPercentage + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center mt-6 text-sm text-gray-500">
        <span>数据更新时间: {{ serverData.updateTime }}</span>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 可以根据需要添加额外的样式 */
</style> 