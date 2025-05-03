import { v7 as uuidv7 } from 'uuid';
import Database from '@tauri-apps/plugin-sql';

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
        // 3. 如果都找不到，创建新标签 (在主事务外)
        const newTagId = uuidv7(); // Use a new constant for the generated ID
        tagId = newTagId; // Assign the new ID to the outer variable
        existingColor = tag.color; // 使用来自 UI 的随机颜色
        try {
          await currentDb.execute(
            `INSERT INTO tags (id, name, color) VALUES ($1, $2, $3)`,
            [tagId, tag.name, existingColor] // Use tagId here (which now holds the v7 UUID)
          );
          foundInDb = true;
        } catch (insertError: any) {
          // 处理可能的并发插入冲突 (例如 UNIQUE constraint failed)
          if (insertError.message && insertError.message.includes('UNIQUE constraint failed: tags.name')) {
            console.warn(`尝试创建标签 ${tag.name} 时发生并发冲突，重新按名称查找...`);
            // 重新查找，因为另一个进程可能刚刚创建了它
            const retryFind = await currentDb.select<any[]>(
              `SELECT id, color FROM tags WHERE name = $1`, [tag.name]
            );
            if (retryFind.length > 0) {
              tagId = retryFind[0].id;
              existingColor = retryFind[0].color;
              foundInDb = true;
            } else {
              console.error(`并发冲突后仍未能找到或创建标签 ${tag.name}`);
              // 跳过此标签或抛出错误，根据需求决定
              continue;
            }
          } else {
            // 其他插入错误，重新抛出
            throw insertError;
          }
        }
      }
    }

    // 4. 收集结果
    if (tagId && foundInDb) {
      finalTags.push({ id: tagId, name: tag.name, color: existingColor || tag.color });
    } else {
      console.error(`最终未能处理标签: ${JSON.stringify(tag)}`);
    }
  }
  return finalTags;
}

// 创建新提示词
export async function createPrompt(promptData: PromptInput): Promise<Prompt> {
  const currentDb = await ensureDbInitialized();
  const now = new Date().toISOString();
  const id = uuidv7(); // 生成 Prompt ID
  let transactionStarted = false;

  try {
    // 1. 预处理标签（在事务外）
    const ensuredTags = await ensureTagsExist(promptData.tags, currentDb);

    // 2. 开始主事务
    await currentDb.execute('BEGIN TRANSACTION');
    transactionStarted = true;

    // 3. 插入 prompts 表
    await currentDb.execute(
      `INSERT INTO prompts (id, title, content, is_favorite, created_at, updated_at) VALUES ($1, $2, $3, 0, $4, $5)`,
      [id, promptData.title, promptData.content, now, now]
    );

    // 4. 插入新的标签关联 (使用已确保存在的标签 ID)
    for (const tag of ensuredTags) {
      await currentDb.execute(
        `INSERT INTO prompt_tags (prompt_id, tag_id) VALUES ($1, $2)`,
        [id, tag.id] // 使用 ensuredTags 返回的有效 tag.id
      );
    }

    // 5. 提交事务
    await currentDb.execute('COMMIT');
    transactionStarted = false;

    // 6. 直接构建并返回结果
    return {
      id,
      title: promptData.title,
      content: promptData.content,
      isFavorite: false,
      dateCreated: now,
      dateModified: now,
      tags: ensuredTags // 使用预处理后的标签列表
    };

  } catch (error) {
    if (transactionStarted) {
      try {
        await currentDb.execute('ROLLBACK');
      } catch (rollbackError) {
        console.error("回滚事务失败:", rollbackError);
      }
    }
    console.error("Error creating prompt:", error);
    throw error;
  }
}

// 更新提示词
export async function updatePrompt(id: string, promptData: PromptInput): Promise<Prompt> {
  const currentDb = await ensureDbInitialized();
  const now = new Date().toISOString();
  let transactionStarted = false;

  try {
    // 1. 预处理标签（在事务外）
    const ensuredTags = await ensureTagsExist(promptData.tags, currentDb);

    // 2. 开始主事务
    await currentDb.execute('BEGIN TRANSACTION');
    transactionStarted = true;

    // 3. 获取原始提示词数据 (需要在事务内以保证一致性)
    const originalPrompt = await currentDb.select<any[]>(
      `SELECT is_favorite, created_at FROM prompts WHERE id = $1`, [id]
    );
    if (originalPrompt.length === 0) {
      throw new Error(`更新时未找到提示词 ${id}`);
    }
    const { is_favorite, created_at } = originalPrompt[0];

    // 4. 更新 prompts 表
    await currentDb.execute(
      `UPDATE prompts SET title = $1, content = $2, updated_at = $3 WHERE id = $4`,
      [promptData.title, promptData.content, now, id]
    );

    // 5. 删除旧的标签关联
    await currentDb.execute(`DELETE FROM prompt_tags WHERE prompt_id = $1`, [id]);

    // 6. 插入新的标签关联 (使用已确保存在的标签 ID)
    for (const tag of ensuredTags) {
      await currentDb.execute(
        `INSERT INTO prompt_tags (prompt_id, tag_id) VALUES ($1, $2)`,
        [id, tag.id]
      );
    }

    // 7. 提交事务
    await currentDb.execute('COMMIT');
    transactionStarted = false;

    // 8. 直接构建并返回结果
    return {
      id,
      title: promptData.title,
      content: promptData.content,
      isFavorite: is_favorite === 1,
      dateCreated: created_at,
      dateModified: now,
      tags: ensuredTags // 使用预处理后的标签列表
    };

  } catch (error) {
    if (transactionStarted) {
      try {
        await currentDb.execute('ROLLBACK');
      } catch (rollbackError) {
        console.error("回滚事务失败:", rollbackError);
      }
    }
    console.error("Error updating prompt:", error);
    throw error;
  }
}

// 删除提示词
export async function deletePrompt(id: string): Promise<boolean> {
  const currentDb = await ensureDbInitialized();

  try {
    await currentDb.execute(`DELETE FROM prompt_tags WHERE prompt_id = $1`, [id]);
    await currentDb.execute(`DELETE FROM prompts WHERE id = $1`, [id]);
    return true;
  } catch (error) {
    console.error("Error deleting prompt:", error);
    throw error; // 仍然抛出错误，以便上层处理 UI 反馈
  }
}

// 切换收藏状态
export async function toggleFavorite(id: string): Promise<boolean> {
  const currentDb = await ensureDbInitialized();

  try {
    await currentDb.execute('BEGIN TRANSACTION');

    const result = await currentDb.select<any[]>(
      `SELECT is_favorite FROM prompts WHERE id = $1`, [id]
    );
    if (result.length === 0) {
      await currentDb.execute('ROLLBACK');
      return false;
    }

    const newValue = result[0].is_favorite === 1 ? 0 : 1;
    await currentDb.execute(
      `UPDATE prompts SET is_favorite = $1 WHERE id = $2`, [newValue, id]
    );

    await currentDb.execute('COMMIT');
    return newValue === 1;
  } catch (error) {
    try {
      // 确保回滚事务
      await currentDb.execute('ROLLBACK');
    } catch (rollbackError) {
      console.error("回滚事务失败:", rollbackError);
    }
    console.error("切换收藏状态失败:", error);
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