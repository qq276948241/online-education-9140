import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'database.sqlite');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
  }
});

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

app.get('/', (req, res) => {
  res.json({ message: '在线教育平台 API', version: '1.0.0' });
});

app.get('/api/banners', async (req, res) => {
  try {
    const banners = await dbAll('SELECT * FROM banners WHERE status = 1 ORDER BY sort_order ASC');
    res.json({ code: 200, data: banners });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, category, keyword, sort } = req.query;
    let sql = 'SELECT * FROM courses WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM courses WHERE 1=1';
    let params = [];

    if (category) {
      sql += ' AND category = ?';
      countSql += ' AND category = ?';
      params.push(category);
    }
    if (keyword) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      countSql += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (sort === 'price-asc') sql += ' ORDER BY price ASC';
    else if (sort === 'price-desc') sql += ' ORDER BY price DESC';
    else if (sort === 'students') sql += ' ORDER BY students_count DESC';
    else if (sort === 'rating') sql += ' ORDER BY rating DESC';
    else sql += ' ORDER BY created_at DESC';

    const offset = (page - 1) * pageSize;
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const [courses, countResult] = await Promise.all([
      dbAll(sql, params),
      dbGet(countSql, params.slice(0, params.length - 2))
    ]);

    const coursesWithTags = courses.map(course => ({
      ...course,
      tags: course.tags ? JSON.parse(course.tags) : []
    }));

    res.json({
      code: 200,
      data: {
        list: coursesWithTags,
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await dbAll('SELECT DISTINCT category FROM courses WHERE category IS NOT NULL');
    res.json({ code: 200, data: categories.map(c => c.category) });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await dbGet('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (!course) {
      return res.status(404).json({ code: 404, message: '课程不存在' });
    }

    const chapters = await dbAll('SELECT * FROM course_chapters WHERE course_id = ? ORDER BY id ASC', [req.params.id]);
    course.tags = course.tags ? JSON.parse(course.tags) : [];

    const buildChapterTree = (chapters, parentId = 0) => {
      return chapters
        .filter(ch => ch.parent_id === parentId)
        .map(ch => ({
          ...ch,
          children: buildChapterTree(chapters, ch.id)
        }));
    };

    const chapterTree = buildChapterTree(chapters);

    res.json({ code: 200, data: { ...course, chapters: chapterTree } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/courses/:id/chapters', async (req, res) => {
  try {
    const chapters = await dbAll('SELECT * FROM course_chapters WHERE course_id = ? ORDER BY id ASC', [req.params.id]);
    
    const buildChapterTree = (chapters, parentId = 0) => {
      return chapters
        .filter(ch => ch.parent_id === parentId)
        .map(ch => ({
          ...ch,
          children: buildChapterTree(chapters, ch.id)
        }));
    };

    res.json({ code: 200, data: buildChapterTree(chapters) });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/courses/:id/comments', async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const comments = await dbAll(`
      SELECT c.*, u.username, u.avatar 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.course_id = ? 
      ORDER BY c.created_at DESC 
      LIMIT ? OFFSET ?
    `, [req.params.id, parseInt(pageSize), offset]);

    const countResult = await dbGet('SELECT COUNT(*) as total FROM comments WHERE course_id = ?', [req.params.id]);

    res.json({
      code: 200,
      data: {
        list: comments,
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/courses/:id/comments', async (req, res) => {
  try {
    const { user_id, content, rating = 5 } = req.body;
    if (!user_id || !content) {
      return res.status(400).json({ code: 400, message: '请填写评论内容' });
    }

    const result = await dbRun(
      'INSERT INTO comments (user_id, course_id, content, rating) VALUES (?, ?, ?, ?)',
      [user_id, req.params.id, content, rating]
    );

    res.json({ code: 200, data: { id: result.id } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await dbGet('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    delete user.password;
    res.json({ code: 200, data: user });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ code: 400, message: '请填写完整信息' });
    }

    const existingUser = await dbGet('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(400).json({ code: 400, message: '用户名或邮箱已存在' });
    }

    const result = await dbRun(
      'INSERT INTO users (username, password, email, avatar) VALUES (?, ?, ?, ?)',
      [username, password, email, `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`]
    );

    res.json({ code: 200, data: { id: result.id, username, email } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await dbGet('SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    res.json({ code: 200, data: user });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { bio, avatar } = req.body;
    await dbRun(
      'UPDATE users SET bio = COALESCE(?, bio), avatar = COALESCE(?, avatar) WHERE id = ?',
      [bio, avatar, req.params.id]
    );
    res.json({ code: 200, data: { message: '更新成功' } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/users/:id/orders', async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const orders = await dbAll(`
      SELECT o.*, c.title, c.cover 
      FROM orders o 
      JOIN courses c ON o.course_id = c.id 
      WHERE o.user_id = ? 
      ORDER BY o.created_at DESC 
      LIMIT ? OFFSET ?
    `, [req.params.id, parseInt(pageSize), offset]);

    const countResult = await dbGet('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [req.params.id]);

    res.json({
      code: 200,
      data: {
        list: orders,
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { user_id, course_id, amount, pay_method = 'alipay' } = req.body;
    if (!user_id || !course_id || !amount) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }

    const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();

    const result = await dbRun(
      'INSERT INTO orders (order_no, user_id, course_id, amount, status, pay_method, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderNo, user_id, course_id, amount, 'paid', pay_method, new Date().toISOString()]
    );

    res.json({ code: 200, data: { id: result.id, order_no: orderNo } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await dbGet(`
      SELECT o.*, c.title, c.cover 
      FROM orders o 
      JOIN courses c ON o.course_id = c.id 
      WHERE o.id = ?
    `, [req.params.id]);

    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }

    res.json({ code: 200, data: order });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/users/:id/my-courses', async (req, res) => {
  try {
    const courses = await dbAll(`
      SELECT DISTINCT c.*, o.paid_at 
      FROM courses c 
      JOIN orders o ON c.id = o.course_id 
      WHERE o.user_id = ? AND o.status = 'paid'
      ORDER BY o.paid_at DESC
    `, [req.params.id]);

    const coursesWithTags = courses.map(course => ({
      ...course,
      tags: course.tags ? JSON.parse(course.tags) : []
    }));

    res.json({ code: 200, data: coursesWithTags });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/users/:id/study-records', async (req, res) => {
  try {
    const { course_id } = req.query;
    let sql = `
      SELECT sr.*, c.title as course_title, ch.title as chapter_title 
      FROM study_records sr 
      JOIN courses c ON sr.course_id = c.id 
      JOIN course_chapters ch ON sr.chapter_id = ch.id 
      WHERE sr.user_id = ?
    `;
    let params = [req.params.id];

    if (course_id) {
      sql += ' AND sr.course_id = ?';
      params.push(course_id);
    }

    sql += ' ORDER BY sr.last_watched_at DESC';

    const records = await dbAll(sql, params);
    res.json({ code: 200, data: records });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/study-records', async (req, res) => {
  try {
    const { user_id, course_id, chapter_id } = req.query;
    if (!user_id || !course_id || !chapter_id) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }

    const record = await dbGet(
      'SELECT * FROM study_records WHERE user_id = ? AND course_id = ? AND chapter_id = ?',
      [user_id, course_id, chapter_id]
    );

    res.json({ code: 200, data: record || null });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/study-records', async (req, res) => {
  try {
    const { user_id, course_id, chapter_id, progress, watched_duration } = req.body;
    if (!user_id || !course_id || !chapter_id) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }

    const existingRecord = await dbGet(
      'SELECT * FROM study_records WHERE user_id = ? AND course_id = ? AND chapter_id = ?',
      [user_id, course_id, chapter_id]
    );

    if (existingRecord) {
      await dbRun(
        'UPDATE study_records SET progress = ?, watched_duration = ?, is_completed = ?, last_watched_at = ? WHERE id = ?',
        [
          progress || existingRecord.progress,
          watched_duration || existingRecord.watched_duration,
          (progress || existingRecord.progress) >= 100 ? 1 : 0,
          new Date().toISOString(),
          existingRecord.id
        ]
      );
      res.json({ code: 200, data: { id: existingRecord.id } });
    } else {
      const result = await dbRun(
        'INSERT INTO study_records (user_id, course_id, chapter_id, progress, watched_duration, is_completed) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, course_id, chapter_id, progress || 0, watched_duration || 0, (progress || 0) >= 100 ? 1 : 0]
      );
      res.json({ code: 200, data: { id: result.id } });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/users/:id/study-progress/:course_id', async (req, res) => {
  try {
    const records = await dbAll(
      'SELECT * FROM study_records WHERE user_id = ? AND course_id = ?',
      [req.params.id, req.params.course_id]
    );

    const chapters = await dbAll(
      'SELECT * FROM course_chapters WHERE course_id = ? AND parent_id != 0',
      [req.params.course_id]
    );

    let totalProgress = 0;
    if (chapters.length > 0) {
      const completedCount = records.filter(r => r.is_completed === 1).length;
      totalProgress = Math.round((completedCount / chapters.length) * 100);
    }

    res.json({
      code: 200,
      data: {
        records,
        totalProgress,
        chaptersCount: chapters.length,
        completedCount: records.filter(r => r.is_completed === 1).length
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
