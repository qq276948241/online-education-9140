import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'database.sqlite');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
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

const initDB = async () => {
  console.log('开始初始化数据库...');

  await dbRun(`DROP TABLE IF EXISTS study_records`);
  await dbRun(`DROP TABLE IF EXISTS comments`);
  await dbRun(`DROP TABLE IF EXISTS orders`);
  await dbRun(`DROP TABLE IF EXISTS course_chapters`);
  await dbRun(`DROP TABLE IF EXISTS courses`);
  await dbRun(`DROP TABLE IF EXISTS users`);
  await dbRun(`DROP TABLE IF EXISTS banners`);

  await dbRun(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cover TEXT,
      price REAL DEFAULT 0,
      original_price REAL,
      instructor TEXT,
      instructor_avatar TEXT,
      category TEXT,
      level TEXT,
      duration INTEGER,
      students_count INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      intro_video TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE course_chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      parent_id INTEGER DEFAULT 0,
      title TEXT NOT NULL,
      video_url TEXT,
      duration INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_free INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
  `);

  await dbRun(`
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      pay_method TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
  `);

  await dbRun(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
  `);

  await dbRun(`
    CREATE TABLE study_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      chapter_id INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      watched_duration INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      last_watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (chapter_id) REFERENCES course_chapters(id)
    )
  `);

  await dbRun(`
    CREATE TABLE banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      image TEXT NOT NULL,
      link TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const usersData = [
    { username: 'demo', password: '123456', email: 'demo@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo', bio: '热爱学习的开发者' },
    { username: 'alice', password: '123456', email: 'alice@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', bio: '前端工程师' },
    { username: 'bob', password: '123456', email: 'bob@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', bio: '后端开发者' },
    { username: 'charlie', password: '123456', email: 'charlie@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie', bio: '全栈工程师' },
    { username: 'david', password: '123456', email: 'david@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', bio: '数据分析师' },
    { username: 'eve', password: '123456', email: 'eve@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve', bio: '产品经理' },
    { username: 'frank', password: '123456', email: 'frank@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank', bio: '运维工程师' },
    { username: 'grace', password: '123456', email: 'grace@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace', bio: 'UI设计师' },
    { username: 'henry', password: '123456', email: 'henry@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=henry', bio: '安全工程师' },
    { username: 'ivy', password: '123456', email: 'ivy@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivy', bio: '测试工程师' },
    { username: 'jack', password: '123456', email: 'jack@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jack', bio: '架构师' },
    { username: 'kate', password: '123456', email: 'kate@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kate', bio: '机器学习工程师' },
    { username: 'leo', password: '123456', email: 'leo@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=leo', bio: '游戏开发者' },
    { username: 'mia', password: '123456', email: 'mia@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mia', bio: 'iOS开发者' },
    { username: 'nick', password: '123456', email: 'nick@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nick', bio: 'Android开发者' },
    { username: 'olivia', password: '123456', email: 'olivia@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia', bio: 'DevOps工程师' },
    { username: 'peter', password: '123456', email: 'peter@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=peter', bio: '区块链开发者' },
    { username: 'queen', password: '123456', email: 'queen@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=queen', bio: '项目经理' },
    { username: 'ryan', password: '123456', email: 'ryan@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ryan', bio: '云计算工程师' },
    { username: 'sophia', password: '123456', email: 'sophia@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophia', bio: 'AI研究员' },
    { username: 'tom', password: '123456', email: 'tom@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom', bio: '嵌入式工程师' },
    { username: 'uma', password: '123456', email: 'uma@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=uma', bio: '大数据工程师' },
    { username: 'victor', password: '123456', email: 'victor@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=victor', bio: '网络安全专家' },
    { username: 'wendy', password: '123456', email: 'wendy@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wendy', bio: '技术写作' },
    { username: 'xander', password: '123456', email: 'xander@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xander', bio: '运维开发' },
  ];
  
  for (const user of usersData) {
    await dbRun(
      `INSERT INTO users (username, password, email, avatar, bio) VALUES (?, ?, ?, ?, ?)`,
      [user.username, user.password, user.email, user.avatar, user.bio]
    );
  }

  const coursesData = [
    {
      title: 'Vue3 全家桶实战开发',
      description: '从零开始学习 Vue3，掌握 Composition API、Pinia、Vue Router 等核心技术，打造完整的企业级项目。',
      cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
      price: 199,
      original_price: 399,
      instructor: '张老师',
      instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
      category: '前端开发',
      level: '中级',
      duration: 3600,
      students_count: 2345,
      rating: 4.8,
      rating_count: 156,
      intro_video: 'https://www.w3schools.com/html/mov_bbb.mp4',
      tags: JSON.stringify(['Vue3', '前端', 'JavaScript'])
    },
    {
      title: 'Node.js 后端开发实战',
      description: '深入学习 Node.js，掌握 Express、Koa、数据库操作、API 设计等后端开发技能。',
      cover: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=225&fit=crop',
      price: 249,
      original_price: 499,
      instructor: '李老师',
      instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
      category: '后端开发',
      level: '中级',
      duration: 4200,
      students_count: 1876,
      rating: 4.9,
      rating_count: 203,
      intro_video: 'https://www.w3schools.com/html/mov_bbb.mp4',
      tags: JSON.stringify(['Node.js', '后端', 'Express'])
    },
    {
      title: 'React 18 从入门到精通',
      description: '全面掌握 React 18 新特性，Hooks、Redux、Next.js 一站式学习。',
      cover: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=225&fit=crop',
      price: 229,
      original_price: 459,
      instructor: '王老师',
      instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
      category: '前端开发',
      level: '中级',
      duration: 3900,
      students_count: 3421,
      rating: 4.7,
      rating_count: 289,
      intro_video: 'https://www.w3schools.com/html/mov_bbb.mp4',
      tags: JSON.stringify(['React', '前端', 'JavaScript'])
    },
    {
      title: 'Python 数据分析实战',
      description: '使用 Python 进行数据分析，掌握 Pandas、NumPy、Matplotlib 等工具。',
      cover: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
      price: 179,
      original_price: 359,
      instructor: '陈老师',
      instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen',
      category: '数据分析',
      level: '初级',
      duration: 3200,
      students_count: 1567,
      rating: 4.6,
      rating_count: 134,
      intro_video: 'https://www.w3schools.com/html/mov_bbb.mp4',
      tags: JSON.stringify(['Python', '数据分析', 'Pandas'])
    },
    {
      title: 'Go 语言高性能编程',
      description: '深入学习 Go 语言，掌握并发编程、微服务架构等高级技术。',
      cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=225&fit=crop',
      price: 299,
      original_price: 599,
      instructor: '刘老师',
      instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu',
      category: '后端开发',
      level: '高级',
      duration: 4800,
      students_count: 987,
      rating: 4.9,
      rating_count: 89,
      intro_video: 'https://www.w3schools.com/html/mov_bbb.mp4',
      tags: JSON.stringify(['Go', '后端', '微服务'])
    },
    {
      title: 'Web 安全攻防实战',
      description: '学习 Web 安全知识，掌握常见漏洞原理与防护措施。',
      cover: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop',
      price: 349,
      original_price: 699,
      instructor: '赵老师',
      instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao',
      category: '安全',
      level: '高级',
      duration: 5400,
      students_count: 654,
      rating: 4.8,
      rating_count: 67,
      intro_video: 'https://www.w3schools.com/html/mov_bbb.mp4',
      tags: JSON.stringify(['安全', '渗透测试', 'Web'])
    },
    {
      title: 'Docker 容器化部署',
      description: '从零开始学习 Docker，掌握容器化部署、Kubernetes 编排等技能。',
      cover: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=225&fit=crop',
      price: 189,
      original_price: 379,
      instructor: '孙老师',
      instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun',
      category: '运维',
      level: '中级',
      duration: 3000,
      students_count: 1234,
      rating: 4.7,
      rating_count: 112,
      intro_video: 'https://www.w3schools.com/html/mov_bbb.mp4',
      tags: JSON.stringify(['Docker', 'K8s', '运维'])
    },
    {
      title: 'TypeScript 高级编程',
      description: '深入学习 TypeScript，掌握高级类型、泛型、装饰器等高级特性。',
      cover: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=225&fit=crop',
      price: 159,
      original_price: 319,
      instructor: '周老师',
      instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhou',
      category: '前端开发',
      level: '高级',
      duration: 2800,
      students_count: 2156,
      rating: 4.6,
      rating_count: 178,
      intro_video: 'https://www.w3schools.com/html/mov_bbb.mp4',
      tags: JSON.stringify(['TypeScript', '前端', 'JavaScript'])
    }
  ];

  const chaptersTemplate = [
    { parent_idx: -1, title: '第一章：课程介绍', sort_order: 1 },
    { parent_idx: 0, title: '1.1 课程背景与学习路径', sort_order: 1, video: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 300, is_free: 1 },
    { parent_idx: 0, title: '1.2 环境搭建', sort_order: 2, video: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 600, is_free: 1 },
    { parent_idx: -1, title: '第二章：基础知识', sort_order: 2 },
    { parent_idx: 3, title: '2.1 核心概念讲解', sort_order: 1, video: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 900 },
    { parent_idx: 3, title: '2.2 第一个示例程序', sort_order: 2, video: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 800 },
    { parent_idx: 3, title: '2.3 实战小练习', sort_order: 3, video: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 1200 },
    { parent_idx: -1, title: '第三章：进阶实战', sort_order: 3 },
    { parent_idx: 7, title: '3.1 项目架构设计', sort_order: 1, video: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 1000 },
    { parent_idx: 7, title: '3.2 核心功能实现', sort_order: 2, video: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 1500 },
    { parent_idx: 7, title: '3.3 项目部署上线', sort_order: 3, video: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 600 },
    { parent_idx: -1, title: '第四章：课程总结', sort_order: 4 },
    { parent_idx: 11, title: '4.1 知识回顾与拓展', sort_order: 1, video: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 400 },
  ];

  for (const course of coursesData) {
    const courseResult = await dbRun(
      `INSERT INTO courses (title, description, cover, price, original_price, instructor, instructor_avatar, category, level, duration, students_count, rating, rating_count, intro_video, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course.title,
        course.description,
        course.cover,
        course.price,
        course.original_price,
        course.instructor,
        course.instructor_avatar,
        course.category,
        course.level,
        course.duration,
        course.students_count,
        course.rating,
        course.rating_count,
        course.intro_video,
        course.tags,
      ]
    );

    const courseId = courseResult.lastID;
    const chapterIds = [];

    for (let i = 0; i < chaptersTemplate.length; i++) {
      const ch = chaptersTemplate[i];
      const parentId = ch.parent_idx === -1 ? 0 : chapterIds[ch.parent_idx];
      
      const result = await dbRun(
        `INSERT INTO course_chapters (course_id, parent_id, title, video_url, duration, sort_order, is_free) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          courseId,
          parentId,
          ch.title,
          ch.video || null,
          ch.duration || 0,
          ch.sort_order,
          ch.is_free || 0,
        ]
      );
      chapterIds[i] = result.lastID;
    }
  }

  await dbRun(
    `INSERT INTO banners (title, image, link, sort_order) VALUES (?, ?, ?, ?)`,
    ['Vue3 新课上线', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=400&fit=crop', '/course/1', 1]
  );
  await dbRun(
    `INSERT INTO banners (title, image, link, sort_order) VALUES (?, ?, ?, ?)`,
    ['618 学习节，全场8折', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=400&fit=crop', '/courses', 2]
  );
  await dbRun(
    `INSERT INTO banners (title, image, link, sort_order) VALUES (?, ?, ?, ?)`,
    ['Node.js 实战训练营', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=400&fit=crop', '/course/2', 3]
  );

  const comments = [
    [1, 1, '课程内容很详细，老师讲得也很好，学到了很多！', 5],
    [1, 1, '非常棒的课程，推荐给想要学习 Vue3 的同学。', 5],
    [1, 2, 'Node.js 的讲解非常深入，实战项目很有价值。', 4],
  ];
  for (const c of comments) {
    await dbRun(
      `INSERT INTO comments (user_id, course_id, content, rating) VALUES (?, ?, ?, ?)`,
      c
    );
  }

  const now = new Date();
  const studyRecordsData = [];
  const userDurations = {};
  
  for (let userId = 1; userId <= 25; userId++) {
    const totalMinutes = Math.floor(Math.random() * 1800) + 120;
    userDurations[userId] = totalMinutes * 60;
    
    const numRecords = Math.floor(Math.random() * 8) + 3;
    for (let i = 0; i < numRecords; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const courseId = Math.floor(Math.random() * 8) + 1;
      const chapterId = (courseId - 1) * 13 + Math.floor(Math.random() * 13) + 1;
      const duration = Math.floor(Math.random() * 3600) + 300;
      const progress = Math.min(100, Math.floor(duration / 30));
      
      const recordDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      studyRecordsData.push({
        user_id: userId,
        course_id: courseId,
        chapter_id: chapterId,
        progress: progress,
        watched_duration: duration,
        is_completed: progress >= 100 ? 1 : 0,
        last_watched_at: recordDate.toISOString()
      });
    }
  }
  
  for (const record of studyRecordsData) {
    await dbRun(
      `INSERT INTO study_records (user_id, course_id, chapter_id, progress, watched_duration, is_completed, last_watched_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [record.user_id, record.course_id, record.chapter_id, record.progress, record.watched_duration, record.is_completed, record.last_watched_at]
    );
  }

  console.log('数据库初始化完成！');
  console.log('测试账号: demo / 123456');
  
  const chapters = await dbAll('SELECT COUNT(*) as count FROM course_chapters');
  console.log('章节总数:', chapters[0].count);
  
  const users = await dbAll('SELECT COUNT(*) as count FROM users');
  console.log('用户总数:', users[0].count);
  
  const records = await dbAll('SELECT COUNT(*) as count FROM study_records');
  console.log('学习记录总数:', records[0].count);
};

initDB()
  .catch(err => console.error('初始化失败:', err))
  .finally(() => db.close());
