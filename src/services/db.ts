import Database from '@tauri-apps/plugin-sql';
import { v7 as uuidv7 } from 'uuid';

// 定义类型
export interface Prompt {
  id: string;
  title: string;
  content: string;
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

  const result = await currentDb.select<any[]>(`SELECT * FROM prompts ORDER BY updated_at DESC`);
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
      title: row.title,
      content: row.content,
      isFavorite: row.is_favorite === 1,
      dateCreated: row.created_at,
      dateModified: row.updated_at,
      tags: tagsResult.map(tag => ({ id: tag.id, name: tag.name, color: tag.color }))
    });
  }

  return prompts;
}

// 获取单个提示词
export async function getPrompt(id: string): Promise<Prompt | null> {
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
    title: row.title,
    content: row.content,
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

  try {
    // 1. 确保标签存在（包含内部处理创建）
    const ensuredTags = await ensureTagsExist(promptData.tags, currentDb);

    // 2. 插入 prompts 表 (无事务)
    await currentDb.execute(
      `INSERT INTO prompts (id, title, content, is_favorite, created_at, updated_at) VALUES ($1, $2, $3, 0, $4, $5)`,
      [promptId, promptData.title, promptData.content, now, now]
    );

    // 3. 插入标签关联 (无事务)
    for (const tag of ensuredTags) {
      await currentDb.execute(
        `INSERT INTO prompt_tags (prompt_id, tag_id) VALUES ($1, $2)`,
        [promptId, tag.id]
      );
    }

    // 4. 构建并返回结果
    return {
      id: promptId,
      title: promptData.title,
      content: promptData.content,
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

// 更新提示词
export async function updatePrompt(id: string, promptData: PromptInput): Promise<Prompt> {
  const currentDb = await ensureDbInitialized();
  const now = new Date().toISOString();

  try {
    // 1. 确保标签存在（包含内部处理创建）
    const ensuredTags = await ensureTagsExist(promptData.tags, currentDb);

    // 2. 获取原始提示词数据 (需要先获取才能返回完整对象)
    const originalPromptResult = await currentDb.select<any[]>(
      `SELECT is_favorite, created_at FROM prompts WHERE id = $1`, [id]
    );
    if (originalPromptResult.length === 0) {
      throw new Error(`更新时未找到提示词 ${id}`);
    }
    const { is_favorite, created_at } = originalPromptResult[0];

    // 3. 更新 prompts 表 (无事务)
    await currentDb.execute(
      `UPDATE prompts SET title = $1, content = $2, updated_at = $3 WHERE id = $4`,
      [promptData.title, promptData.content, now, id]
    );

    // 4. 删除旧的标签关联 (无事务)
    await currentDb.execute(`DELETE FROM prompt_tags WHERE prompt_id = $1`, [id]);

    // 5. 插入新的标签关联 (无事务)
    for (const tag of ensuredTags) {
      await currentDb.execute(
        `INSERT INTO prompt_tags (prompt_id, tag_id) VALUES ($1, $2)`,
        [id, tag.id]
      );
    }

    // 6. 构建并返回结果
    return {
      id,
      title: promptData.title,
      content: promptData.content,
      isFavorite: is_favorite === 1,
      dateCreated: created_at,
      dateModified: now,
      tags: ensuredTags
    };

  } catch (error: any) {
    console.error("Error during prompt update process (original error):", error);
    if (error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    throw error; // 重新抛出错误
  }
}

// 删除提示词
export async function deletePrompt(id: string): Promise<boolean> {
  const currentDb = await ensureDbInitialized();

  try {
    await currentDb.execute(`DELETE FROM prompt_tags WHERE prompt_id = $1`, [id]);
    await currentDb.execute(`DELETE FROM prompts WHERE id = $1`, [id]);
    return true;
  } catch (error: any) { // Type error as any to access stack
    console.error("Error deleting prompt:", error);
    if (error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    throw error; // 仍然抛出错误，以便上层处理 UI 反馈
  }
}

// 切换收藏状态
export async function toggleFavorite(id: string): Promise<boolean> {
  const currentDb = await ensureDbInitialized();

  try {
    // 不需要事务，查询和更新是独立操作
    const result = await currentDb.select<any[]>(
      `SELECT is_favorite FROM prompts WHERE id = $1`, [id]
    );
    if (result.length === 0) {
      console.warn(`ToggleFavorite: Prompt with id ${id} not found.`);
      return false; // 或者抛出错误，取决于期望的行为
    }

    const newValue = result[0].is_favorite === 1 ? 0 : 1;
    await currentDb.execute(
      `UPDATE prompts SET is_favorite = $1 WHERE id = $2`, [newValue, id]
    );

    return newValue === 1;
  } catch (error: any) {
    // 不需要 ROLLBACK，因为没有显式 BEGIN
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
        title: row.title,
        content: row.content,
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