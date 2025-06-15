import Database from '@tauri-apps/plugin-sql';
import { v7 as uuidv7 } from 'uuid';

// 定义类型
export interface Prompt {
  id: string;
  promptGroupId: string;
  version: number;
  isLatest: boolean;
  title: string;
  content: string;
  sourceUrl?: string;
  note?: string;
  isFavorite: boolean;
  dateCreated: string;
  dateModified: string;
  tags: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  count?: number;
}

// 用于创建或更新提示词的接口
export interface PromptInput {
  title: string;
  content: string;
  sourceUrl?: string;
  note?: string;
  tags: Tag[];
}

// 数据库连接实例和初始化 Promise
let db: Database | null = null;
let initPromise: Promise<Database> | null = null;

// 初始化数据库（确保只执行一次）
export function initDatabase(): Promise<Database> {
  if (db) {
    return Promise.resolve(db);
  }
  if (!initPromise) {
    initPromise = (async () => {
      try {
        console.log('Attempting to load database...');
        // 连接SQLite数据库
        const loadedDb = await Database.load('sqlite:promptgenie.db');
        console.log('Database loaded successfully.');
        db = loadedDb; // Assign to the global variable *after* successful load
        return db;
      } catch (err) {
        console.error('数据库初始化失败:', err);
        initPromise = null; // Reset promise on error
        throw err;
      }
    })();
  }
  return initPromise;
}

// 辅助函数：确保数据库已初始化
async function ensureDbInitialized(): Promise<Database> {
  let retries = 3; // 最多重试3次

  while (retries > 0) {
    try {
      if (!db) {
        // 如果 db 未设置，等待初始化完成
        db = await initDatabase();
      }

      // 验证连接是否可用
      try {
        await db.execute('SELECT 1');
      } catch (connError) {
        console.warn('数据库连接不可用，尝试重新初始化...', connError);
        db = null; // 重置连接
        throw connError; // 让外层 catch 处理重试
      }

      return db;
    } catch (err) {
      retries--;
      if (retries <= 0) {
        console.error('数据库初始化重试失败:', err);
        throw new Error('数据库连接失败，请重启应用');
      }

      console.warn(`数据库初始化失败，剩余重试次数: ${retries}`);
      // 等待短暂时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 清除当前失败的初始化 Promise
      initPromise = null;
    }
  }

  throw new Error('数据库连接失败'); // 不应该到达这里，但为了 TypeScript 类型检查
}

// 获取所有提示词
export async function getAllPrompts(): Promise<Prompt[]> {
  const currentDb = await ensureDbInitialized();

  const result = await currentDb.select<any[]>(`
    SELECT * FROM prompts 
    WHERE is_latest = 1 
    ORDER BY updated_at DESC
  `);
  const prompts: Prompt[] = [];

  for (const row of result) {
    const tagsResult = await currentDb.select<any[]>(`
      SELECT t.* 
      FROM tags t
      JOIN prompt_tags pt ON t.id = pt.tag_id
      WHERE pt.prompt_id = $1
    `, [row.id]);

    prompts.push({
      id: row.id,
      promptGroupId: row.prompt_group_id,
      version: row.version,
      isLatest: row.is_latest === 1,
      title: row.title,
      content: row.content,
      sourceUrl: row.source_url,
      note: row.note,
      isFavorite: row.is_favorite === 1,
      dateCreated: row.created_at,
      dateModified: row.updated_at,
      tags: tagsResult.map(tag => ({ id: tag.id, name: tag.name, color: tag.color }))
    });
  }

  return prompts;
}

// 获取单个提示词 (最新版本)
export async function getPrompt(promptGroupId: string): Promise<Prompt | null> {
  const currentDb = await ensureDbInitialized();
  const result = await currentDb.select<any[]>(`
    SELECT * FROM prompts 
    WHERE prompt_group_id = $1 AND is_latest = 1
  `, [promptGroupId]);

  if (result.length === 0) return null;

  const row = result[0];
  const tagsResult = await currentDb.select<any[]>(`
    SELECT t.* 
    FROM tags t
    JOIN prompt_tags pt ON t.id = pt.tag_id
    WHERE pt.prompt_id = $1
  `, [row.id]);

  return {
    id: row.id,
    promptGroupId: row.prompt_group_id,
    version: row.version,
    isLatest: row.is_latest === 1,
    title: row.title,
    content: row.content,
    sourceUrl: row.source_url,
    note: row.note,
    isFavorite: row.is_favorite === 1,
    dateCreated: row.created_at,
    dateModified: row.updated_at,
    tags: tagsResult.map(tag => ({ id: tag.id, name: tag.name, color: tag.color }))
  };
}

// 辅助函数：预处理标签，确保它们存在于数据库中，并返回最终的标签列表
async function ensureTagsExist(tags: Tag[], currentDb: Database): Promise<Tag[]> {
  const finalTags: Tag[] = [];
  for (const tag of tags) {
    let tagId: string | undefined = tag.id;
    let existingColor: string | undefined;
    let foundInDb = false;

    // 1. 按 ID 查找
    if (tagId) {
      const byId = await currentDb.select<any[]>(
        `SELECT id, color FROM tags WHERE id = $1`, [tagId]
      );
      if (byId.length > 0) {
        existingColor = byId[0].color;
        foundInDb = true;
      } else {
        console.warn(`提供的标签 ID ${tagId} 未找到，将按名称查找...`);
        tagId = undefined; // ID 无效，清除它
      }
    }

    // 2. 如果没有有效 ID，按名称查找
    if (!foundInDb) {
      const byName = await currentDb.select<any[]>(
        `SELECT id, color FROM tags WHERE name = $1`, [tag.name]
      );
      if (byName.length > 0) {
        tagId = byName[0].id;
        existingColor = byName[0].color;
        foundInDb = true;
      } else {
        // 3. 如果都找不到，创建新标签
        tagId = uuidv7();
        existingColor = tag.color;
        try {
          // 执行单个 INSERT，不再需要内部事务
          // await currentDb.execute('BEGIN TRANSACTION');
          await currentDb.execute(
            `INSERT INTO tags (id, name, color) VALUES ($1, $2, $3)`,
            [tagId, tag.name, existingColor]
          );
          // await currentDb.execute('COMMIT');
          foundInDb = true;
        } catch (insertError: any) {
          // 数据库错误（例如唯一约束）
          console.error(`创建标签 ${tag.name} 失败:`, insertError);
          if (insertError.message && insertError.message.includes('UNIQUE constraint failed: tags.name')) {
            console.warn(`创建标签 ${tag.name} 时发生并发冲突，重新按名称查找...`);
            const retryFind = await currentDb.select<any[]>(
              `SELECT id, color FROM tags WHERE name = $1`, [tag.name]
            );
            if (retryFind.length > 0) {
              tagId = retryFind[0].id;
              existingColor = retryFind[0].color;
              foundInDb = true;
            } else {
              console.error(`并发冲突后重试查找标签 ${tag.name} 失败`);
              continue; // 跳过此标签
            }
          } else {
            // 对于其他类型的插入错误，继续处理或抛出
            console.error(`创建标签时发生未知错误: ${tag.name}`, insertError);
            continue; // 跳过此标签
            // 或者根据需要抛出: throw insertError;
          }
        }
      }
    }

    // 4. 收集结果
    if (tagId && foundInDb) {
      const finalTag = { id: tagId, name: tag.name, color: existingColor || tag.color };
      finalTags.push(finalTag);
      console.log(`[ensureTagsExist] Added tag to final list:`, finalTag);
    } else {
      console.error(`最终未能处理标签: ${JSON.stringify(tag)}`);
    }
  }
  console.log('[ensureTagsExist] Returning finalTags:', finalTags);
  return finalTags;
}

// 创建新提示词
export async function createPrompt(promptData: PromptInput): Promise<Prompt> {
  const currentDb = await ensureDbInitialized();
  const now = new Date().toISOString();
  const promptId = uuidv7();
  const promptGroupId = uuidv7(); // 新的 group ID

  try {
    // 1. 确保标签存在
    const ensuredTags = await ensureTagsExist(promptData.tags, currentDb);

    // 2. 插入 prompts 表
    await currentDb.execute(
      `INSERT INTO prompts (id, prompt_group_id, version, is_latest, title, content, source_url, note, is_favorite, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [promptId, promptGroupId, 1, 1, promptData.title, promptData.content, promptData.sourceUrl, promptData.note, 0, now, now]
    );

    // 3. 插入标签关联
    for (const tag of ensuredTags) {
      await currentDb.execute(
        `INSERT INTO prompt_tags (prompt_id, tag_id) VALUES ($1, $2)`,
        [promptId, tag.id]
      );
    }

    // 4. 构建并返回结果
    return {
      id: promptId,
      promptGroupId: promptGroupId,
      version: 1,
      isLatest: true,
      title: promptData.title,
      content: promptData.content,
      sourceUrl: promptData.sourceUrl,
      note: promptData.note,
      isFavorite: false,
      dateCreated: now,
      dateModified: now,
      tags: ensuredTags
    };

  } catch (error: any) {
    console.error("Error during prompt creation process (original error):", error);
    if (error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    throw error; // 重新抛出错误
  }
}

// 更新提示词（创建新版本）
export async function updatePrompt(promptGroupId: string, promptData: PromptInput): Promise<Prompt> {
  const currentDb = await ensureDbInitialized();
  const now = new Date().toISOString();

  // 1. 查找当前的最新版本
  const latestVersionResult = await currentDb.select<any[]>(
    `SELECT * FROM prompts WHERE prompt_group_id = $1 AND is_latest = 1`,
    [promptGroupId]
  );

  if (latestVersionResult.length === 0) {
    throw new Error(`更新时未找到提示词组 ${promptGroupId}`);
  }
  const latestVersion = latestVersionResult[0];

  // 2. 将旧版本标记为非最新
  await currentDb.execute(
    `UPDATE prompts SET is_latest = 0 WHERE id = $1`,
    [latestVersion.id]
  );

  // 3. 创建新版本
  const newPromptId = uuidv7();
  const newVersionNumber = latestVersion.version + 1;
  await currentDb.execute(
    `INSERT INTO prompts (id, prompt_group_id, version, is_latest, title, content, source_url, note, is_favorite, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      newPromptId,
      promptGroupId,
      newVersionNumber,
      1, // is_latest
      promptData.title,
      promptData.content,
      promptData.sourceUrl,
      promptData.note,
      latestVersion.is_favorite,
      latestVersion.created_at, // 保持原始创建时间
      now,
    ]
  );

  // 4. 确保标签存在
  const ensuredTags = await ensureTagsExist(promptData.tags, currentDb);

  // 5. 为新版本关联标签
  for (const tag of ensuredTags) {
    await currentDb.execute(
      `INSERT INTO prompt_tags (prompt_id, tag_id) VALUES ($1, $2)`,
      [newPromptId, tag.id]
    );
  }
  
  // 6. 构建并返回新版本的结果
  return {
    id: newPromptId,
    promptGroupId,
    version: newVersionNumber,
    isLatest: true,
    title: promptData.title,
    content: promptData.content,
    sourceUrl: promptData.sourceUrl,
    note: promptData.note,
    isFavorite: latestVersion.is_favorite === 1,
    dateCreated: latestVersion.created_at,
    dateModified: now,
    tags: ensuredTags
  };
}

// 新增：获取单个提示词的指定版本
export async function getPromptByVersionId(id: string): Promise<Prompt | null> {
  const currentDb = await ensureDbInitialized();
  const result = await currentDb.select<any[]>(`SELECT * FROM prompts WHERE id = $1`, [id]);

  if (result.length === 0) return null;

  const row = result[0];
  const tagsResult = await currentDb.select<any[]>(`
    SELECT t.* 
    FROM tags t
    JOIN prompt_tags pt ON t.id = pt.tag_id
    WHERE pt.prompt_id = $1
  `, [id]);

  return {
    id: row.id,
    promptGroupId: row.prompt_group_id,
    version: row.version,
    isLatest: row.is_latest === 1,
    title: row.title,
    content: row.content,
    sourceUrl: row.source_url,
    note: row.note,
    isFavorite: row.is_favorite === 1,
    dateCreated: row.created_at,
    dateModified: row.updated_at,
    tags: tagsResult.map(tag => ({ id: tag.id, name: tag.name, color: tag.color }))
  };
}

// 新增：获取一个提示词的所有版本历史
export async function getPromptHistory(promptGroupId: string): Promise<Prompt[]> {
  const currentDb = await ensureDbInitialized();
  const result = await currentDb.select<any[]>(`
    SELECT * FROM prompts 
    WHERE prompt_group_id = $1 
    ORDER BY version DESC
  `, [promptGroupId]);

  const history: Prompt[] = [];
  for (const row of result) {
    history.push({
      id: row.id,
      promptGroupId: row.prompt_group_id,
      version: row.version,
      isLatest: row.is_latest === 1,
      title: row.title,
      content: row.content,
      sourceUrl: row.source_url,
      note: row.note,
      isFavorite: row.is_favorite === 1,
      dateCreated: row.created_at,
      dateModified: row.updated_at,
      tags: [] // 历史记录中暂不加载标签，以提高性能
    });
  }
  return history;
}

// 删除提示词 (删除整个版本组)
export async function deletePrompt(promptGroupId: string): Promise<boolean> {
  const currentDb = await ensureDbInitialized();

  try {
    // 1. 查找该组下的所有版本ID
    const versions = await currentDb.select<any[]>(
      `SELECT id FROM prompts WHERE prompt_group_id = $1`,
      [promptGroupId]
    );
    const versionIds = versions.map(v => v.id);

    // 2. 删除所有版本的标签关联
    if (versionIds.length > 0) {
      const placeholders = versionIds.map(() => '?').join(',');
      await currentDb.execute(
        `DELETE FROM prompt_tags WHERE prompt_id IN (${placeholders})`,
        versionIds
      );
    }

    // 3. 删除所有版本
    await currentDb.execute(`DELETE FROM prompts WHERE prompt_group_id = $1`, [promptGroupId]);
    return true;
  } catch (error: any) { 
    console.error("Error deleting prompt group:", error);
    if (error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
}

// 切换收藏状态 (应用于整个版本组)
export async function toggleFavorite(promptGroupId: string): Promise<boolean> {
  const currentDb = await ensureDbInitialized();

  try {
    const result = await currentDb.select<any[]>(
      `SELECT is_favorite FROM prompts WHERE prompt_group_id = $1 AND is_latest = 1`, [promptGroupId]
    );
    if (result.length === 0) {
      console.warn(`ToggleFavorite: Prompt group with id ${promptGroupId} not found.`);
      return false;
    }

    const newValue = result[0].is_favorite === 1 ? 0 : 1;
    await currentDb.execute(
      `UPDATE prompts SET is_favorite = $1 WHERE prompt_group_id = $2`, [newValue, promptGroupId]
    );

    return newValue === 1;
  } catch (error: any) {
    console.error("切换收藏状态失败:", error);
    if (error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
}

// 获取所有标签及其关联的提示词数量
export async function getAllTags(): Promise<Tag[]> {
  const currentDb = await ensureDbInitialized();
  // 使用 LEFT JOIN 和 COUNT 来统计每个标签关联的提示词数量
  const result = await currentDb.select<any[]>(`
    SELECT 
      t.id, 
      t.name, 
      t.color, 
      COUNT(pt.prompt_id) as prompt_count
    FROM tags t
    LEFT JOIN prompt_tags pt ON t.id = pt.tag_id
    GROUP BY t.id, t.name, t.color
    ORDER BY t.name ASC
  `);
  // 注意：这里返回的 Tag 类型需要包含 count
  return result.map(row => ({
    id: row.id,
    name: row.name,
    color: row.color,
    count: row.prompt_count
  }));
}

// 更新提示词的最后使用时间
export async function updatePromptLastUsed(id: string): Promise<boolean> {
  const currentDb = await ensureDbInitialized();
  try {
    const result = await currentDb.execute(
      'UPDATE prompts SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    console.log(`Updated last_used_at for prompt ${id}, rows affected: ${result.rowsAffected}`);

    // 更新后立即刷新托盘菜单
    updateTrayMenu().catch(err => {
      console.error('Failed to update tray menu after prompt use:', err);
    });

    return result.rowsAffected > 0;
  } catch (err) {
    console.error(`Failed to update last_used_at for prompt ${id}:`, err);
    return false;
  }
}

// 获取最近使用的提示词
export async function getRecentlyUsedPrompts(limit: number = 5): Promise<Prompt[]> {
  const currentDb = await ensureDbInitialized();

  try {
    // 获取最近使用的提示词，优先按last_used_at排序，如果为空则按updated_at排序
    const result = await currentDb.select<any[]>(`
      SELECT * FROM prompts 
      WHERE last_used_at IS NOT NULL
      ORDER BY last_used_at DESC
      LIMIT $1
    `, [limit]);

    const prompts: Prompt[] = [];

    for (const row of result) {
      const tagsResult = await currentDb.select<any[]>(`
        SELECT t.* 
        FROM tags t
        JOIN prompt_tags pt ON t.id = pt.tag_id
        WHERE pt.prompt_id = $1
      `, [row.id]);

      prompts.push({
        id: row.id,
        promptGroupId: row.prompt_group_id,
        version: row.version,
        isLatest: row.is_latest === 1,
        title: row.title,
        content: row.content,
        sourceUrl: row.source_url,
        note: row.note,
        isFavorite: row.is_favorite === 1,
        dateCreated: row.created_at,
        dateModified: row.updated_at,
        tags: tagsResult.map(tag => ({ id: tag.id, name: tag.name, color: tag.color }))
      });
    }

    return prompts;
  } catch (err) {
    console.error('Failed to get recently used prompts:', err);
    return [];
  }
}

// 更新托盘菜单
export async function updateTrayMenu(): Promise<void> {
  try {
    // 获取最近使用的提示词
    const recentPrompts = await getRecentlyUsedPrompts(5);

    // 将提示词转换为托盘菜单项格式
    const menuItems = recentPrompts.map(prompt => ({
      id: prompt.id,
      title: prompt.title
    }));

    // 动态导入Tauri API并调用后端更新托盘菜单
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('update_tray_menu', { items: menuItems });
      console.log('Tray menu updated with recent prompts:', menuItems);
    } catch (apiError) {
      console.error('Error importing Tauri API or updating tray menu:', apiError);
    }
  } catch (err) {
    console.error('Failed to update tray menu:', err);
  }
}

// 根据ID复制提示词内容到剪贴板
export async function copyPromptToClipboard(id: string): Promise<boolean> {
  try {
    // 获取提示词
    const prompt = await getPrompt(id);
    if (!prompt) {
      console.error(`找不到ID为${id}的提示词`);
      return false;
    }

    try {
      // 使用Tauri的剪贴板插件
      const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
      await writeText(prompt.content);
      console.log(`提示词 "${prompt.title}" 已复制到剪贴板`);
    } catch (clipboardError) {
      console.error('使用Tauri剪贴板插件失败:', clipboardError);
      // 尝试使用浏览器API作为备选
      await navigator.clipboard.writeText(prompt.content);
      console.log(`使用浏览器API复制提示词 "${prompt.title}" 到剪贴板`);
    }

    // 更新最后使用时间
    await updatePromptLastUsed(id);

    return true;
  } catch (err) {
    console.error('复制提示词到剪贴板失败:', err);
    return false;
  }
}

// 更新标签（修改名称或颜色）
export async function updateTag(id: string, name: string, color: string): Promise<boolean> {
  const currentDb = await ensureDbInitialized();
  try {
    await currentDb.execute(
      `UPDATE tags SET name = $1, color = $2 WHERE id = $3`,
      [name, color, id]
    );
    return true;
  } catch (error: any) {
    console.error("更新标签失败:", error);
    if (error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
}

// 删除标签
export async function deleteTag(id: string): Promise<boolean> {
  const currentDb = await ensureDbInitialized();
  try {
    // 删除标签与提示词的关联
    await currentDb.execute(`DELETE FROM prompt_tags WHERE tag_id = $1`, [id]);
    // 删除标签本身
    await currentDb.execute(`DELETE FROM tags WHERE id = $1`, [id]);
    return true;
  } catch (error: any) {
    console.error("删除标签失败:", error);
    if (error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
}

// 导出所有数据
export async function exportAllData(): Promise<any> {
  const currentDb = await ensureDbInitialized();
  
  // 获取所有提示词组
  const promptGroups = await currentDb.select<any[]>(`
    SELECT DISTINCT prompt_group_id, title, is_favorite, created_at, updated_at
    FROM prompts 
    WHERE is_latest = 1
  `);
  
  const exportPrompts = [];
  
  for (const group of promptGroups) {
    // 获取该组的所有版本
    const versions = await currentDb.select<any[]>(`
      SELECT * FROM prompts 
      WHERE prompt_group_id = $1 
      ORDER BY version ASC
    `, [group.prompt_group_id]);
    
    // 获取标签
    const latestVersion = versions.find(v => v.is_latest === 1);
    const tags = latestVersion ? await currentDb.select<any[]>(`
      SELECT t.id 
      FROM tags t
      JOIN prompt_tags pt ON t.id = pt.tag_id
      WHERE pt.prompt_id = $1
    `, [latestVersion.id]) : [];
    
    exportPrompts.push({
      promptGroupId: group.prompt_group_id,
      title: group.title,
      isFavorite: group.is_favorite === 1,
      dateCreated: group.created_at,
      dateModified: group.updated_at,
      versions: versions.map(v => ({
        id: v.id,
        version: v.version,
        content: v.content,
        sourceUrl: v.source_url,
        note: v.note,
        isLatest: v.is_latest === 1,
        dateCreated: v.created_at
      })),
      tags: tags.map(t => t.id)
    });
  }
  
  // 获取所有标签
  const allTags = await currentDb.select<any[]>(`
    SELECT * FROM tags ORDER BY name ASC
  `);
  
  const exportTags = allTags.map(tag => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    dateCreated: tag.created_at
  }));
  
  return {
    version: "1.0.0",
    exportDate: new Date().toISOString(),
    metadata: {
      appVersion: "1.0.0",
      totalPrompts: exportPrompts.length,
      totalTags: exportTags.length,
      exportedBy: "PromptGenie"
    },
    prompts: exportPrompts,
    tags: exportTags
  };
}

// 导入数据
export async function importData(data: any, options: any): Promise<any> {
  const currentDb = await ensureDbInitialized();
  
  let importedPrompts = 0;
  let importedTags = 0;
  let skippedPrompts = 0;
  let skippedTags = 0;
  const errors: string[] = [];
  
  try {
    // 导入标签（不使用事务，每个操作独立执行）
    if (options.includeTags && data.tags) {
      for (const tag of data.tags) {
        try {
          const existing = await currentDb.select<any[]>(`
            SELECT id FROM tags WHERE name = $1
          `, [tag.name]);
          
          if (existing.length === 0) {
            // 标签不存在，创建新标签
            await currentDb.execute(`
              INSERT INTO tags (id, name, color, created_at)
              VALUES ($1, $2, $3, $4)
            `, [tag.id, tag.name, tag.color, tag.dateCreated]);
            importedTags++;
          } else if (options.mode === 'overwrite') {
            // 覆盖模式：更新现有标签
            await currentDb.execute(`
              UPDATE tags SET color = $2 WHERE id = $1
            `, [existing[0].id, tag.color]);
            importedTags++;
          } else {
            // 跳过或合并模式：跳过已存在的标签
            skippedTags++;
          }
        } catch (error) {
          errors.push(`导入标签 ${tag.name} 失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    // 导入提示词
    for (const prompt of data.prompts) {
      try {
        const existing = await currentDb.select<any[]>(`
          SELECT prompt_group_id FROM prompts WHERE prompt_group_id = $1 LIMIT 1
        `, [prompt.promptGroupId]);
        
        if (existing.length > 0 && options.mode === 'skip') {
          skippedPrompts++;
          continue;
        }
        
        // 处理不同的导入模式
        let targetPromptGroupId = prompt.promptGroupId;
        let shouldImport = true;
        
        if (existing.length > 0) {
          if (options.mode === 'overwrite') {
            // 覆盖模式：删除现有数据
            try {
              await currentDb.execute(`
                DELETE FROM prompt_tags WHERE prompt_id IN (
                  SELECT id FROM prompts WHERE prompt_group_id = $1
                )
              `, [prompt.promptGroupId]);
              await currentDb.execute(`
                DELETE FROM prompts WHERE prompt_group_id = $1
              `, [prompt.promptGroupId]);
            } catch (deleteError) {
              errors.push(`删除现有提示词 ${prompt.title} 失败: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`);
              continue;
            }
          } else if (options.mode === 'merge') {
            // 合并模式：检查是否存在相同标题和内容的提示词
            const latestVersion = prompt.versions.find((v: any) => v.isLatest) || prompt.versions[0];
            const duplicateCheck = await currentDb.select<any[]>(`
              SELECT p.prompt_group_id FROM prompts p
              WHERE p.title = $1 AND p.content = $2 AND p.is_latest = 1
              LIMIT 1
            `, [prompt.title, latestVersion.content]);
            
            if (duplicateCheck.length > 0) {
              // 发现重复内容，跳过导入
              skippedPrompts++;
              shouldImport = false;
            } else {
              // 没有重复，生成新的 promptGroupId
              targetPromptGroupId = uuidv7();
            }
          }
        }
        
        if (!shouldImport) {
          continue;
        }
        
        // 插入版本
        let versionInserted = false;
        for (const version of prompt.versions) {
          if (!options.includeVersionHistory && !version.isLatest) {
            continue;
          }
          
          try {
            // 为每个版本生成新的ID以避免冲突
            const versionId = uuidv7();
            
            await currentDb.execute(`
              INSERT INTO prompts (
                id, prompt_group_id, version, is_latest, title, content, source_url, note,
                is_favorite, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
              versionId,
              targetPromptGroupId,
              version.version,
              version.isLatest ? 1 : 0,
              prompt.title,
              version.content,
              version.sourceUrl,
              version.note,
              prompt.isFavorite ? 1 : 0,
              version.dateCreated,
              prompt.dateModified
            ]);
            
            versionInserted = true;
            
            // 插入标签关联
            if (options.includeTags && prompt.tags && prompt.tags.length > 0) {
              for (const tagId of prompt.tags) {
                try {
                  // 检查标签是否存在
                  const tagExists = await currentDb.select<any[]>(`
                    SELECT id FROM tags WHERE id = $1
                  `, [tagId]);
                  
                  if (tagExists.length > 0) {
                    await currentDb.execute(`
                      INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id)
                      VALUES ($1, $2)
                    `, [versionId, tagId]);
                  }
                } catch (tagError) {
                  console.warn(`插入标签关联失败: ${tagError}`);
                }
              }
            }
          } catch (versionError) {
            errors.push(`导入提示词版本 ${prompt.title} v${version.version} 失败: ${versionError instanceof Error ? versionError.message : String(versionError)}`);
          }
        }
        
        if (versionInserted) {
          importedPrompts++;
        }
      } catch (error) {
        errors.push(`导入提示词 ${prompt.title} 失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return {
      success: true,
      message: `成功导入 ${importedPrompts} 个提示词和 ${importedTags} 个标签${skippedPrompts > 0 ? `，跳过 ${skippedPrompts} 个重复提示词` : ''}${skippedTags > 0 ? `，跳过 ${skippedTags} 个重复标签` : ''}`,
      importedPrompts,
      importedTags,
      skippedPrompts,
      skippedTags,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      message: `导入失败: ${error instanceof Error ? error.message : String(error)}`,
      importedPrompts,
      importedTags,
      skippedPrompts,
      skippedTags,
      errors: [...errors, error instanceof Error ? error.message : String(error)]
    };
  }
} 