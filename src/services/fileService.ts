import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { ExportData, ImportOptions, ImportResult } from '../types/export';
import { exportAllData, importData } from './db';

// 导出数据到文件
export async function exportToFile(): Promise<boolean> {
  try {
    // 获取导出数据
    const data: ExportData = await exportAllData();
    
    // 打开保存对话框
    const filePath = await save({
      filters: [{
        name: 'JSON Files',
        extensions: ['json']
      }],
      defaultPath: `promptgenie-export-${new Date().toISOString().split('T')[0]}.json`
    });
    
    if (!filePath) {
      return false; // 用户取消了保存
    }
    
    // 写入文件
    await writeTextFile(filePath, JSON.stringify(data, null, 2));
    
    return true;
  } catch (error) {
    console.error('导出失败:', error);
    throw new Error(`导出失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 从文件导入数据
export async function importFromFile(options: ImportOptions): Promise<ImportResult> {
  try {
    // 打开文件选择对话框
    const filePath = await open({
      filters: [{
        name: 'JSON Files',
        extensions: ['json']
      }],
      multiple: false
    });
    
    if (!filePath) {
      return {
        success: false,
        message: '未选择文件',
        importedPrompts: 0,
        importedTags: 0,
        skippedPrompts: 0,
        skippedTags: 0,
        errors: []
      };
    }
    
    // 读取文件内容
    const fileContent = await readTextFile(filePath as string);
    
    // 解析 JSON
    let data: ExportData;
    try {
      data = JSON.parse(fileContent);
    } catch (parseError) {
      return {
        success: false,
        message: '文件格式无效，请选择有效的 JSON 文件',
        importedPrompts: 0,
        importedTags: 0,
        skippedPrompts: 0,
        skippedTags: 0,
        errors: ['JSON 解析失败']
      };
    }
    
    // 验证数据格式
    if (!data.version || !data.prompts || !Array.isArray(data.prompts)) {
      return {
        success: false,
        message: '文件格式不正确，请选择有效的 PromptGenie 导出文件',
        importedPrompts: 0,
        importedTags: 0,
        skippedPrompts: 0,
        skippedTags: 0,
        errors: ['数据格式验证失败']
      };
    }
    
    // 执行导入
    const result = await importData(data, options);
    
    return result;
  } catch (error) {
    console.error('导入失败:', error);
    return {
      success: false,
      message: `导入失败: ${error instanceof Error ? error.message : String(error)}`,
      importedPrompts: 0,
      importedTags: 0,
      skippedPrompts: 0,
      skippedTags: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

// 验证导出文件格式
export function validateExportFile(data: any): boolean {
  try {
    return (
      data &&
      typeof data.version === 'string' &&
      typeof data.exportDate === 'string' &&
      data.metadata &&
      Array.isArray(data.prompts) &&
      Array.isArray(data.tags)
    );
  } catch {
    return false;
  }
} 