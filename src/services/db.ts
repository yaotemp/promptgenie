import { v4 as uuidv4 } from 'uuid';
import Database from '@tauri-apps/plugin-sql';
import { appLocalDataDir } from '@tauri-apps/api/path';

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
  if (!db) {
    // 如果 db 未设置，等待初始化完成
    return await initDatabase();
  }
  return db;
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

// 创建新提示词
export async function createPrompt(promptData: PromptInput): Promise<Prompt> {
  const currentDb = await ensureDbInitialized();
  const now = new Date().toISOString();
  const id = uuidv4();

  await currentDb.execute('BEGIN TRANSACTION');
  let finalTags: Tag[] = [];
  try {
    await currentDb.execute(
      `INSERT INTO prompts (id, title, content, is_favorite, created_at, updated_at) VALUES ($1, $2, $3, 0, $4, $5)`,
      [id, promptData.title, promptData.content, now, now]
    );

    for (const tag of promptData.tags) {
      let tagId = tag.id;
      let finalTag = { ...tag }; // Copy tag data

      if (!tagId) {
        const existingTags = await currentDb.select<any[]>(
          `SELECT id FROM tags WHERE name = $1`, [tag.name]
        );

        if (existingTags.length > 0) {
          tagId = existingTags[0].id;
        } else {
          tagId = uuidv4();
          await currentDb.execute(
            `INSERT INTO tags (id, name, color) VALUES ($1, $2, $3)`,
            [tagId, tag.name, tag.color]
          );
        }
        finalTag.id = tagId; // Update the tag object with the new/found ID
      }

      finalTags.push(finalTag); // Add the tag with a guaranteed ID

      await currentDb.execute(
        `INSERT INTO prompt_tags (prompt_id, tag_id) VALUES ($1, $2)`,
        [id, tagId]
      );
    }

    await currentDb.execute('COMMIT');

    return {
      id,
      title: promptData.title,
      content: promptData.content,
      isFavorite: false,
      dateCreated: now,
      dateModified: now,
      tags: finalTags // Use the tags with updated IDs
    };
  } catch (error) {
    await currentDb.execute('ROLLBACK');
    console.error("Error creating prompt:", error);
    throw error;
  }
}

// 更新提示词
export async function updatePrompt(id: string, promptData: PromptInput): Promise<Prompt> {
  const currentDb = await ensureDbInitialized();
  const now = new Date().toISOString();

  await currentDb.execute('BEGIN TRANSACTION');
  let finalTags: Tag[] = [];
  try {
    await currentDb.execute(
      `UPDATE prompts SET title = $1, content = $2, updated_at = $3 WHERE id = $4`,
      [promptData.title, promptData.content, now, id]
    );

    await currentDb.execute(`DELETE FROM prompt_tags WHERE prompt_id = $1`, [id]);

    for (const tag of promptData.tags) {
      let tagId = tag.id;
      let finalTag = { ...tag };

      if (!tagId) {
        const existingTags = await currentDb.select<any[]>(
          `SELECT id FROM tags WHERE name = $1`, [tag.name]
        );

        if (existingTags.length > 0) {
          tagId = existingTags[0].id;
        } else {
          tagId = uuidv4();
          await currentDb.execute(
            `INSERT INTO tags (id, name, color) VALUES ($1, $2, $3)`,
            [tagId, tag.name, tag.color]
          );
        }
        finalTag.id = tagId;
      }

      finalTags.push(finalTag);

      await currentDb.execute(
        `INSERT INTO prompt_tags (prompt_id, tag_id) VALUES ($1, $2)`,
        [id, tagId]
      );
    }

    await currentDb.execute('COMMIT');

    const updated = await getPrompt(id); // getPrompt uses ensureDbInitialized internally
    if (!updated) throw new Error(`提示词 ${id} 未找到`);
    return updated;
  } catch (error) {
    await currentDb.execute('ROLLBACK');
    console.error("Error updating prompt:", error);
    throw error;
  }
}

// 删除提示词
export async function deletePrompt(id: string): Promise<boolean> {
  const currentDb = await ensureDbInitialized();
  await currentDb.execute('BEGIN TRANSACTION');
  try {
    await currentDb.execute(`DELETE FROM prompt_tags WHERE prompt_id = $1`, [id]);
    await currentDb.execute(`DELETE FROM prompts WHERE id = $1`, [id]);
    await currentDb.execute('COMMIT');
    return true;
  } catch (error) {
    await currentDb.execute('ROLLBACK');
    console.error("Error deleting prompt:", error);
    throw error;
  }
}

// 切换收藏状态
export async function toggleFavorite(id: string): Promise<boolean> {
  const currentDb = await ensureDbInitialized();
  const result = await currentDb.select<any[]>(
    `SELECT is_favorite FROM prompts WHERE id = $1`, [id]
  );
  if (result.length === 0) return false;

  const newValue = result[0].is_favorite === 1 ? 0 : 1;
  await currentDb.execute(
    `UPDATE prompts SET is_favorite = $1 WHERE id = $2`, [newValue, id]
  );
  return newValue === 1;
}

// 获取所有标签
export async function getAllTags(): Promise<Tag[]> {
  const currentDb = await ensureDbInitialized();
  const result = await currentDb.select<any[]>(`SELECT * FROM tags`);
  return result.map(row => ({ id: row.id, name: row.name, color: row.color }));
} 