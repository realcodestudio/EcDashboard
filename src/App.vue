<script setup lang="ts">
import { ref } from 'vue';
import ServerStatusCard from './components/ServerStatusCard.vue';

// 控制设置菜单的显示状态
const showSettingsMenu = ref(false);

// LocalStorage Key
const API_URL_STORAGE_KEY = 'serverApiUrl';
const REFRESH_INTERVAL_STORAGE_KEY = 'serverRefreshInterval';

// 从 LocalStorage 读取或使用默认值
const initialApiUrl = localStorage.getItem(API_URL_STORAGE_KEY) || ''; // TODO: 设置您的默认 API 地址
const initialRefreshInterval = localStorage.getItem(REFRESH_INTERVAL_STORAGE_KEY);
const initialRefreshIntervalParsed = initialRefreshInterval ? parseInt(initialRefreshInterval, 10) : 60000; // TODO: 设置您的默认刷新间隔（毫秒）

// 存储服务器 API 地址和刷新间隔
const serverApiUrl = ref(initialApiUrl);
const serverRefreshInterval = ref(initialRefreshIntervalParsed);

// 用于在设置菜单中编辑的值
const editingApiUrl = ref(serverApiUrl.value);
const editingRefreshInterval = ref(serverRefreshInterval.value);

// 处理 ServerStatusCard 发出的 openSettings 事件
const handleOpenSettings = () => {
  // 打开菜单时，将当前值复制到编辑变量中
  editingApiUrl.value = serverApiUrl.value;
  editingRefreshInterval.value = serverRefreshInterval.value;
  showSettingsMenu.value = true;
  console.log('DEV 设置按钮被点击，打开设置菜单');
};

// 保存设置并关闭菜单
const saveSettings = () => {
  // 更新实际使用的值
  serverApiUrl.value = editingApiUrl.value;
  serverRefreshInterval.value = editingRefreshInterval.value;

  // 将设置保存到 LocalStorage
  try {
    localStorage.setItem(API_URL_STORAGE_KEY, serverApiUrl.value);
    localStorage.setItem(REFRESH_INTERVAL_STORAGE_KEY, serverRefreshInterval.value.toString());
    console.log('DEV 设置已保存到 LocalStorage');
  } catch (e) {
    console.error('DEV 保存设置到 LocalStorage 失败:', e);
    // 可以给用户一个提示，例如 LocalStorage 已满或被禁用
    alert('保存设置失败，浏览器存储可能已满或被禁用。');
  }

  showSettingsMenu.value = false;
  console.log('DEV 保存设置并关闭菜单');
};

// 关闭设置菜单
const closeSettingsMenu = () => {
  showSettingsMenu.value = false;
  console.log('DEV 关闭设置菜单');
};

// 用于测试原生点击事件的函数
const testClick = () => {
  console.log('Parent Component: ServerStatusCard clicked (native event)');
};

// TODO: 在这里定义您的设置菜单内容相关的状态和逻辑

// 控制 ServerStatusCard 的最小宽度
const cardMinWidth = ref(450); // 设置您想要的最小宽度（像素）

</script>

<template>
  <div id="app" class="p-4">
    <ServerStatusCard
      :apiUrl="serverApiUrl"
      :refreshInterval="serverRefreshInterval"
      @openSettings="handleOpenSettings"
      @click.native="testClick"
      :minWidthPx="cardMinWidth"
    />

    <!-- 设置菜单区域 -->
    <div v-if="showSettingsMenu" class="settings-menu-overlay">
      <div class="settings-menu-content">
        <h2>服务器设置</h2>
        <div>
          <label for="apiUrl">API 地址:</label>
          <input id="apiUrl" type="text" v-model="editingApiUrl" />
        </div>
        <div>
          <label for="refreshInterval">刷新间隔 (ms):</label>
          <input id="refreshInterval" type="number" v-model.number="editingRefreshInterval" />
        </div>
        <button @click="saveSettings">保存</button>
        <button @click="closeSettingsMenu">取消</button>
      </div>
    </div>
  </div>
</template>

<style>
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
/* 您可以在这里添加一些全局样式 */

/* 为设置菜单添加一些基本样式 */
.settings-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* 半透明背景 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* 确保菜单在最上层 */
}

.settings-menu-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 80%;
  max-width: 500px;
}

.settings-menu-content label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.settings-menu-content input[type="text"],
.settings-menu-content input[type="number"] {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.settings-menu-content button {
  margin-right: 10px;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.settings-menu-content button:first-of-type {
    background-color: #4CAF50;
    color: white;
}

.settings-menu-content button:last-of-type {
    background-color: #f44336;
    color: white;
}
</style>
