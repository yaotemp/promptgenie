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

// 数据库连接实例
let db: Database | null = null;

// 初始化数据库
export async function initDatabase() {
  if (db) return db;

  try {
    // 连接SQLite数据库 - 使用Tauri 2.0中的内置方式
    db = await Database.load('sqlite:promptgenie.db');
    console.log('数据库连接成功');

    return db;
  } catch (err) {
    console.error('数据库初始化失败:', err);
    throw err;
  }
}

// 获取所有提示词
export async function getAllPrompts(): Promise<Prompt[]> {
  await initDatabase();

  // 获取所有提示词
  const result = await db!.select<any[]>(`SELECT * FROM prompts ORDER BY updated_at DESC`);

  // 为每个提示词获取标签
  const prompts: Prompt[] = [];

  for (const row of result) {
    const tagsResult = await db!.select<any[]>(`
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
      tags: tagsResult.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      }))
    });
  }

  return prompts;
}

// 获取单个提示词
export async function getPrompt(id: string): Promise<Prompt | null> {
  await initDatabase();

  const result = await db!.select<any[]>(`SELECT * FROM prompts WHERE id = $1`, [id]);

  if (result.length === 0) {
    return null;
  }

  const row = result[0];

  // 获取标签
  const tagsResult = await db!.select<any[]>(`
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
    tags: tagsResult.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color
    }))
  };
}

// 创建新提示词
export async function createPrompt(promptData: PromptInput): Promise<Prompt> {
  await initDatabase();

  const now = new Date().toISOString();
  const id = uuidv4();

  // 使用事务确保数据一致性
  await db!.execute('BEGIN TRANSACTION');

  try {
    // 插入提示词
    await db!.execute(
      `INSERT INTO prompts (id, title, content, is_favorite, created_at, updated_at) 
       VALUES ($1, $2, $3, 0, $4, $5)`,
      [id, promptData.title, promptData.content, now, now]
    );

    // 插入或获取标签
    const tagIds = new Map<string, string>();

    for (const tag of promptData.tags) {
      let tagId = tag.id;

      // 如果标签没有ID，检查是否已存在同名标签
      if (!tagId) {
        const existingTags = await db!.select<any[]>(
          `SELECT id FROM tags WHERE name = $1`,
          [tag.name]
        );

        if (existingTags.length > 0) {
          tagId = existingTags[0].id;
        } else {
          // 创建新标签
          tagId = uuidv4();
          await db!.execute(
            `INSERT INTO tags (id, name, color) VALUES ($1, $2, $3)`,
            [tagId, tag.name, tag.color]
          );
        }
      }

      tagIds.set(tag.name, tagId);

      // 关联提示词和标签
      await db!.execute(
        `INSERT INTO prompt_tags (prompt_id, tag_id) VALUES ($1, $2)`,
        [id, tagId]
      );
    }

    await db!.execute('COMMIT');

    // 返回新创建的提示词
    return {
      id,
      title: promptData.title,
      content: promptData.content,
      isFavorite: false,
      dateCreated: now,
      dateModified: now,
      tags: promptData.tags.map(tag => ({
        id: tag.id || tagIds.get(tag.name) || '',
        name: tag.name,
        color: tag.color
      }))
    };
  } catch (error) {
    await db!.execute('ROLLBACK');
    throw error;
  }
}

// 更新提示词
export async function updatePrompt(id: string, promptData: PromptInput): Promise<Prompt> {
  await initDatabase();

  const now = new Date().toISOString();

  // 使用事务
  await db!.execute('BEGIN TRANSACTION');

  try {
    // 更新提示词
    await db!.execute(
      `UPDATE prompts SET title = $1, content = $2, updated_at = $3 WHERE id = $4`,
      [promptData.title, promptData.content, now, id]
    );

    // 删除旧的标签关联
    await db!.execute(`DELETE FROM prompt_tags WHERE prompt_id = $1`, [id]);

    // 添加新的标签关联
    for (const tag of promptData.tags) {
      let tagId = tag.id;

      // 如果标签没有ID，检查是否已存在同名标签
      if (!tagId) {
        const existingTags = await db!.select<any[]>(
          `SELECT id FROM tags WHERE name = $1`,
          [tag.name]
        );

        if (existingTags.length > 0) {
          tagId = existingTags[0].id;
        } else {
          // 创建新标签
          tagId = uuidv4();
          await db!.execute(
            `INSERT INTO tags (id, name, color) VALUES ($1, $2, $3)`,
            [tagId, tag.name, tag.color]
          );
        }
      }

      // 关联提示词和标签
      await db!.execute(
        `INSERT INTO prompt_tags (prompt_id, tag_id) VALUES ($1, $2)`,
        [id, tagId]
      );
    }

    await db!.execute('COMMIT');

    // 获取更新后的提示词
    const updated = await getPrompt(id);
    if (!updated) {
      throw new Error(`提示词 ${id} 未找到`);
    }

    return updated;
  } catch (error) {
    await db!.execute('ROLLBACK');
    throw error;
  }
}

// 删除提示词
export async function deletePrompt(id: string): Promise<boolean> {
  await initDatabase();

  // 使用事务
  await db!.execute('BEGIN TRANSACTION');

  try {
    // 删除标签关联
    await db!.execute(`DELETE FROM prompt_tags WHERE prompt_id = $1`, [id]);

    // 删除提示词
    await db!.execute(`DELETE FROM prompts WHERE id = $1`, [id]);

    await db!.execute('COMMIT');
    return true;
  } catch (error) {
    await db!.execute('ROLLBACK');
    throw error;
  }
}

// 切换收藏状态
export async function toggleFavorite(id: string): Promise<boolean> {
  await initDatabase();

  // 获取当前收藏状态
  const result = await db!.select<any[]>(
    `SELECT is_favorite FROM prompts WHERE id = $1`,
    [id]
  );

  if (result.length === 0) {
    return false;
  }

  const newValue = result[0].is_favorite === 1 ? 0 : 1;

  // 更新收藏状态
  await db!.execute(
    `UPDATE prompts SET is_favorite = $1 WHERE id = $2`,
    [newValue, id]
  );

  return newValue === 1;
}

// 获取所有标签
export async function getAllTags(): Promise<Tag[]> {
  await initDatabase();

  const result = await db!.select<any[]>(`SELECT * FROM tags`);

  return result.map(row => ({
    id: row.id,
    name: row.name,
    color: row.color
  }));
} 